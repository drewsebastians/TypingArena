"use client";
// Explicit shared-attempt sync — queue, retry, idempotent submission, and
// lossless remote hydration.
//
// Guarantees:
//  - Shared callers queue an attempt locally the moment it is saved; ordinary
//    local practice never enters this queue and never needs a backend.
//  - Anonymous shared sessions flush the queue through the server-authoritative
//    RPC. Offline/pending items retry on the next explicit shared sync.
//  - Full result objects travel inside attempts.metrics, so a new device can
//    reconstruct identical local history after explicit shared hydration.
//  - Dedupe is threefold: client-generated result id == attempts.client_id,
//    unique(user_id, client_id) in Postgres, and local merge checks.

import { IS_REMOTE_CONFIGURED } from "./config";
import {
  loadCareerHistory,
  loadDictationHistory,
  loadTranscriptionHistory,
  loadTypingHistory,
} from "./history";
import { track } from "./analytics";
import { fetchMyAttempts, getClient, getCurrentUser, serializeSubmitAttemptPayload } from "./remote";
import type {
  DictationResult,
  TranscriptionResult,
  TypingResult,
} from "./types";
import type { CareerAssessmentResult } from "./career";
import type { SubmitAttemptPayload } from "./remote";

const QUEUE_KEY = "ta:sync_queue";
const SYNCED_KEY = "ta:synced_ids";

/** Hard cap so a pathological backlog can never exhaust localStorage. */
export const QUEUE_CAP = 500;
/** Backoff ceiling for retryable failures (rate limits / network). */
const MAX_BACKOFF_MS = 10 * 60_000;
const BASE_BACKOFF_MS = 30_000;

interface QueueItem {
  clientId: string;
  enqueuedAt: number;
  payload: SubmitAttemptPayload;
  /** Retry metadata — drives exponential backoff for retryable outcomes. */
  attempts?: number;
  /** Earliest wall-clock time the item may be retried again. */
  nextAttemptAt?: number;
}

// ---------------------------------------------------------------------------
// Submission outcome taxonomy — the queue only drops an item when the server
// provides DEFINITIVE evidence about it (persisted / idempotent duplicate /
// permanently invalid under documented policy). Everything else stays queued.
// ---------------------------------------------------------------------------

export type SubmissionOutcome =
  /** Persisted AND accepted into ranked competition. */
  | { status: "accepted"; wpm?: number; accuracy?: number }
  /** Idempotent duplicate: this exact attempt was already persisted. */
  | { status: "duplicate" }
  /** Persisted, but deliberately unranked/flagged by server policy. */
  | { status: "unranked"; integrity?: string; reasons?: string[] }
  /** Permanent validation rejection — intentionally dropped (documented). */
  | { status: "rejected_permanent"; reason: string }
  /** Rate-limited — retryable, never silently lost. */
  | { status: "retry_rate_limited" }
  /** Backend responded but failed transiently — retryable. */
  | { status: "retry_transient"; message?: string }
  /** Network/backend unavailable — retryable. */
  | { status: "retry_unavailable" };

/**
 * Classify one submit_attempt RPC round-trip into an explicit outcome.
 *
 * The Supabase RPC resolves transport-level success even when the application
 * response is a rejection (`accepted:false`, `reason:"rate_limited"`, …), so
 * BOTH layers must be inspected. Pure + unit-tested.
 */
export function classifySubmissionResult(
  data: unknown,
  error: { message: string } | null,
): SubmissionOutcome {
  if (error) {
    const msg = error.message ?? "";
    // PostgREST surfaces raised RPC exceptions here; treat known permanent
    // validation errors definitively, everything else as transient.
    if (/invalid_evidence/.test(msg)) return { status: "rejected_permanent", reason: "invalid_evidence" };
    return { status: "retry_transient", message: msg };
  }
  const r = (data ?? {}) as {
    accepted?: boolean;
    integrity?: string;
    reason?: string;
    reasons?: string[];
    duplicate?: boolean;
    wpm?: number;
    accuracy?: number;
  };
  switch (r.reason) {
    case "rate_limited":
      return { status: "retry_rate_limited" };
    case "invalid_evidence":
      return { status: "rejected_permanent", reason: "invalid_evidence" };
    default:
      break;
  }
  if (r.duplicate === true) return { status: "duplicate" };
  if (r.accepted === true) return { status: "accepted", wpm: r.wpm, accuracy: r.accuracy };
  // The server persists non-ranked rows and reports them with accepted:false
  // plus an integrity verdict — persisted but deliberately unranked.
  if (typeof r.integrity === "string") {
    return { status: "unranked", integrity: r.integrity, reasons: r.reasons };
  }
  // Unrecognized shape: do not risk data loss — retry with backoff.
  return { status: "retry_transient", message: "unrecognized_submit_response" };
}

function backoffMs(item: QueueItem): number {
  const attempts = item.attempts ?? 0;
  return Math.min(BASE_BACKOFF_MS * 2 ** attempts, MAX_BACKOFF_MS);
}

function readQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueueItem[];
  } catch {
    return [];
  }
}

function writeQueue(q: QueueItem[]): void {
  try {
    // Keep the NEWEST items when capping; the oldest overflow is retried by a
    // fresh migration/hydration instead of being silently lost mid-flight.
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-QUEUE_CAP)));
  } catch {
    /* storage full */
  }
}

function readSynced(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markSynced(ids: Iterable<string>): void {
  const set = readSynced();
  for (const id of ids) if (id) set.add(id);
  try {
    localStorage.setItem(SYNCED_KEY, JSON.stringify([...set].slice(-2000)));
  } catch {
    /* ignore */
  }
}

/** Public wrapper used by migration to avoid resubmitting known rows. */
export function markIdsSynced(ids: Iterable<string>): void {
  markSynced(ids);
}

export function pendingSyncCount(): number {
  return readQueue().length;
}

/** Remove pending shared submissions and their local idempotency markers. */
export function clearQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(SYNCED_KEY);
}

// ---------------------------------------------------------------------------
// Evidence builders — one per mode (server recomputes + verifies these)
// ---------------------------------------------------------------------------

export function typingEvidence(r: TypingResult): SubmitAttemptPayload {
  return {
    clientId: r.id,
    exerciseId: r.exerciseId,
    exerciseVersion: r.exerciseVersion,
    scoringVersion: r.scoringVersion,
    mode: r.mode,
    language: r.language,
    durationSec: r.durationSec,
    elapsedMs: Math.round(r.elapsedMs),
    typedChars: r.typedChars,
    correctChars: r.correctChars,
    uncorrectedErrors: r.uncorrectedErrors,
    focusLostCount: r.focusLostCount,
    pasteFlag: r.pasteDetected,
    burstFlag: r.integrityReasons.includes("impossible_typing_burst"),
    claimedWpm: r.grossWpm,
    claimedAccuracy: r.accuracy,
    integrity: r.integrity,
    challengeDate: r.challengeDate,
    challengeVersion: r.challengeVersion,
    metrics: { kind: "typing", result: r as unknown as Record<string, unknown> },
  };
}

/** Audio modes: derive consistent typed/correct counts from word accuracy so
 *  server invariants hold; full result rides in metrics. */
export function audioEvidence(
  r: DictationResult | TranscriptionResult,
  mode: "dictation" | "transcription",
): SubmitAttemptPayload {
  const elapsed = Math.max(1, Math.round(r.completionMs));
  const typedChars = Math.max(1, Math.round(((r.effectiveWpm * 5) / 60_000) * elapsed));
  const correctChars = Math.min(typedChars, Math.round((typedChars * r.wordAccuracy) / 100));
  return {
    clientId: r.id,
    exerciseId: r.exerciseId,
    exerciseVersion: r.exerciseVersion,
    scoringVersion: r.scoringVersion,
    normalizationVersion: r.normalizationVersion,
    mode,
    language: r.language,
    durationSec: mode === "dictation" ? 60 : Math.max(30, Math.round(elapsed / 1000)),
    elapsedMs: elapsed,
    typedChars,
    correctChars,
    uncorrectedErrors: 0,
    pasteFlag: r.pasteDetected,
    claimedWpm: r.effectiveWpm,
    claimedAccuracy: r.wordAccuracy,
    integrity: r.integrity,
    metrics: { kind: mode, result: r as unknown as Record<string, unknown> },
  };
}

// ---------------------------------------------------------------------------
// Queueing
// ---------------------------------------------------------------------------


/** Enqueue an explicitly shared attempt; flushes immediately when possible. */
export async function queueAttempt(
  payload: SubmitAttemptPayload,
): Promise<void> {
  if (!IS_REMOTE_CONFIGURED) return;
  if (readSynced().has(payload.clientId)) return;
  const q = readQueue();
  if (!q.some((x) => x.clientId === payload.clientId)) {
    q.push({ clientId: payload.clientId, enqueuedAt: Date.now(), payload, attempts: 0 });
    writeQueue(q);
  }
  void flushQueue();
}

let flushing = false;

/**
 * Flush pending submissions through the authoritative RPC. Safe to call
 * repeatedly from anywhere; concurrent calls coalesce.
 *
 * Removal policy (see SubmissionOutcome): an item leaves the queue ONLY on
 * definitive evidence — accepted, idempotent duplicate, or a permanent
 * validation rejection (documented drop policy). Rate limits and network/
 * transient failures keep the item queued with exponential backoff so nothing
 * is lost and no hot retry loop spins.
 */
export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  if (!IS_REMOTE_CONFIGURED || flushing || typeof window === "undefined") {
    return { sent: 0, remaining: readQueue().length };
  }
  // Claim the flush slot SYNCHRONOUSLY — before any await — so concurrent
  // callers can never interleave and double-submit the same items.
  flushing = true;
  let sent = 0;
  try {
    const user = await getCurrentUser();
    if (!user) return { sent: 0, remaining: readQueue().length };
    const client = getClient();
    const now = Date.now();
    const q = readQueue();
    const keep: QueueItem[] = [];
    for (const item of q) {
      if ((item.nextAttemptAt ?? 0) > now) {
        keep.push(item); // backing off — not due yet
        continue;
      }
      let outcome: SubmissionOutcome;
      try {
        const { data, error } = await client.rpc("submit_attempt", {
          p: serializeSubmitAttemptPayload(item.payload),
        });
        outcome = classifySubmissionResult(data, error);
      } catch {
        // Transport-level throw (offline, DNS, RemoteUnavailableError…).
        outcome = { status: "retry_unavailable" };
      }
      switch (outcome.status) {
        case "accepted":
        case "duplicate":
        case "unranked":
          // Definitive persistence evidence — safe to forget locally.
          markSynced([item.clientId]);
          sent++;
          if (outcome.status === "unranked" && outcome.integrity === "flagged") {
            track("ranked_submission_rejected", { mode: item.payload.mode, reasons: (outcome.reasons ?? []).join(",") });
          }
          break;
        case "rejected_permanent":
          // Documented policy: structurally invalid evidence can never become
          // valid by retrying; drop it and surface the rejection observably.
          track("sync_permanent_rejection", { reason: outcome.reason, mode: item.payload.mode });
          break;
        case "retry_rate_limited":
        case "retry_transient":
        case "retry_unavailable": {
          const attempts = (item.attempts ?? 0) + 1;
          keep.push({ ...item, attempts, nextAttemptAt: Date.now() + backoffMs(item) });
          track("sync_retry_scheduled", { attempts, mode: item.payload.mode });
          break;
        }
      }
    }
    writeQueue(keep);
  } finally {
    flushing = false;
  }
  return { sent, remaining: readQueue().length };
}

/** Test/ops helper: how many queue items are currently waiting on backoff? */
export function pendingRetryCount(): number {
  const now = Date.now();
  return readQueue().filter((i) => (i.nextAttemptAt ?? 0) > now).length;
}

// ---------------------------------------------------------------------------
// Explicit hydration — rebuild local history from a shared anonymous session
// ---------------------------------------------------------------------------

export interface HydrateReport {
  fetched: number;
  addedTyping: number;
  addedDictation: number;
  addedTranscription: number;
  addedCareer: number;
}

function upsertById<T extends { id: string; timestamp: number }>(list: T[], incoming: T): number {
  return mergeById(list, incoming);
}

/** Pure deterministic merge used by hydration (unit-tested). */
export function mergeById<T extends { id: string }>(list: T[], incoming: T): number {
  if (list.some((x) => x.id === incoming.id)) return 0;
  const typed = list as Array<T & { timestamp?: number }>;
  const inc = incoming as T & { timestamp?: number };
  typed.push(inc);
  if (inc.timestamp !== undefined) {
    typed.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }
  return 1;
}

/**
 * Fetch all remote attempts for the current shared session and merge any
 * results not present locally into the local stores (full fidelity via stored
 * `metrics`). This is not part of ordinary practice or automatic page load.
 */
export async function hydrateFromRemote(): Promise<HydrateReport> {
  const report: HydrateReport = { fetched: 0, addedTyping: 0, addedDictation: 0, addedTranscription: 0, addedCareer: 0 };
  if (!IS_REMOTE_CONFIGURED) return report;
  const user = await getCurrentUser();
  if (!user) return report;

  const rows = await fetchMyAttempts();
  report.fetched = rows.length;

  const typing = loadTypingHistory();
  const dictation = loadDictationHistory();
  const transcription = loadTranscriptionHistory();
  const career = loadCareerHistory();
  for (const row of rows) {
    const metrics = row.metrics as { kind?: string; result?: Record<string, unknown>; assessment?: Record<string, unknown> } | null;
    if (!metrics?.kind) continue;
    const rid = typeof row.client_id === "string" ? row.client_id : undefined;
    if (!rid) continue;
    switch (metrics.kind) {
      case "typing": {
        const r = metrics.result as unknown as TypingResult;
        if (r && r.grossWpm !== undefined) report.addedTyping += upsertById(typing, { ...r, id: rid });
        break;
      }
      case "dictation": {
        const r = metrics.result as unknown as DictationResult;
        if (r && r.normalizedScore !== undefined) report.addedDictation += upsertById(dictation, { ...r, id: rid });
        break;
      }
      case "transcription": {
        const r = metrics.result as unknown as TranscriptionResult;
        if (r && r.normalizedScore !== undefined) report.addedTranscription += upsertById(transcription, { ...r, id: rid });
        break;
      }
      case "career": {
        // Career assessments ride their full result object; identity is
        // (trackId, completedAt). Deterministic score/band are preserved
        // byte-for-byte so Progress and Career pages agree on any device.
        const r = metrics.assessment as unknown as CareerAssessmentResult | undefined;
        if (
          r &&
          typeof r.score === "number" &&
          typeof r.completedAt === "number" &&
          !career.some((x) => x.trackId === r.trackId && x.completedAt === r.completedAt)
        ) {
          career.push(r);
          career.sort((a, b) => b.completedAt - a.completedAt);
          report.addedCareer++;
        }
        break;
      }
    }
  }

  if (report.addedTyping > 0 || report.addedDictation > 0 || report.addedTranscription > 0 || report.addedCareer > 0) {
    localStorage.setItem("ta:typing_history_v2", JSON.stringify(typing.slice(0, 500)));
    localStorage.setItem("ta:dictation_history_v2", JSON.stringify(dictation.slice(0, 500)));
    localStorage.setItem("ta:transcription_history_v2", JSON.stringify(transcription.slice(0, 500)));
    localStorage.setItem("ta:career_history", JSON.stringify(career.slice(0, 500)));
    markSynced(rows.map((r) => String(r.client_id ?? "")));
  }
  return report;
}

