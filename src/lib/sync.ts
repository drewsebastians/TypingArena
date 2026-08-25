"use client";
// Cross-device attempt sync — queue, retry, idempotent submission, and
// lossless remote hydration.
//
// Guarantees:
//  - Every scored attempt in EVERY mode is queued locally the moment it is
//    saved; nothing blocks or fails practice if the backend is unavailable.
//  - Signed-in sessions flush the queue through the server-authoritative RPC.
//    Offline/pending items retry on next load / sign-in / manual refresh.
//  - Full result objects travel inside attempts.metrics, so a new device can
//    reconstruct identical local history after sign-in.
//  - Dedupe is threefold: client-generated result id == attempts.client_id,
//    unique(user_id, client_id) in Postgres, and local merge checks.

import { IS_REMOTE_CONFIGURED } from "./config";
import {
  loadDictationHistory,
  loadTranscriptionHistory,
  loadTypingHistory,
} from "./history";
import { fetchMyAttempts, getClient, getCurrentUser } from "./remote";
import type {
  DictationResult,
  TranscriptionResult,
  TypingResult,
} from "./types";
import type { SubmitAttemptPayload } from "./remote";

const QUEUE_KEY = "ta:sync_queue";
const SYNCED_KEY = "ta:synced_ids";

interface QueueItem {
  clientId: string;
  enqueuedAt: number;
  payload: SubmitAttemptPayload;
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
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-500)));
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


/** Enqueue an attempt for sync; flushes immediately when signed in. */
export async function queueAttempt(
  payload: SubmitAttemptPayload,
): Promise<void> {
  if (!IS_REMOTE_CONFIGURED) return;
  if (readSynced().has(payload.clientId)) return;
  const q = readQueue();
  if (!q.some((x) => x.clientId === payload.clientId)) {
    q.push({ clientId: payload.clientId, enqueuedAt: Date.now(), payload });
    writeQueue(q);
  }
  void flushQueue();
}

let flushing = false;

/** Flush pending submissions through the authoritative RPC. Safe to call
 *  repeatedly from anywhere; concurrent calls coalesce. */
export async function flushQueue(): Promise<{ sent: number; remaining: number }> {
  if (!IS_REMOTE_CONFIGURED || flushing || typeof window === "undefined") {
    return { sent: 0, remaining: readQueue().length };
  }
  const user = await getCurrentUser();
  if (!user) return { sent: 0, remaining: readQueue().length };
  flushing = true;
  let sent = 0;
  let client: ReturnType<typeof getClient> | null = null;
  try {
    client = getClient();
    let q = readQueue();
    const keep: QueueItem[] = [];
    for (const item of q) {
      try {
        const { error } = await client.rpc("submit_attempt", {
          p: item.payload as unknown as Record<string, unknown>,
        });
        if (error) {
          // Permanent validation failures drop; transient ones stay queued.
          if (/invalid_evidence|rate_limited/.test(error.message)) continue;
          keep.push(item);
        } else {
          sent++;
        }
      } catch {
        keep.push(item); // network failure → retry later
      }
    }
    q = keep;
    writeQueue(q);
  } finally {
    flushing = false;
  }
  return { sent, remaining: readQueue().length };
}

// ---------------------------------------------------------------------------
// Hydration — rebuild full local history from remote on a new device
// ---------------------------------------------------------------------------

export interface HydrateReport {
  fetched: number;
  addedTyping: number;
  addedDictation: number;
  addedTranscription: number;
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
 * Fetch all remote attempts for the signed-in user and merge any results not
 * present locally into the local stores (full fidelity via stored `metrics`).
 */
export async function hydrateFromRemote(): Promise<HydrateReport> {
  const report: HydrateReport = { fetched: 0, addedTyping: 0, addedDictation: 0, addedTranscription: 0 };
  if (!IS_REMOTE_CONFIGURED) return report;
  const user = await getCurrentUser();
  if (!user) return report;

  const rows = await fetchMyAttempts();
  report.fetched = rows.length;

  const typing = loadTypingHistory();
  const dictation = loadDictationHistory();
  const transcription = loadTranscriptionHistory();

  for (const row of rows) {
    const metrics = row.metrics as { kind?: string; result?: Record<string, unknown> } | null;
    if (!metrics?.kind || !metrics.result) continue;
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
    }
  }

  if (report.addedTyping > 0 || report.addedDictation > 0 || report.addedTranscription > 0) {
    localStorage.setItem("ta:typing_history_v2", JSON.stringify(typing.slice(0, 500)));
    localStorage.setItem("ta:dictation_history_v2", JSON.stringify(dictation.slice(0, 500)));
    localStorage.setItem("ta:transcription_history_v2", JSON.stringify(transcription.slice(0, 500)));
    markSynced(rows.map((r) => String(r.client_id ?? "")));
  }
  return report;
}

