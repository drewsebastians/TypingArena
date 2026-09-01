"use client";
// Local persistence — anonymous-first history, streaks (product-day aware),
// XP across all modes, nickname, and consent state.
//
// Migration note: prototype v1 stored results without versioning fields and
// used UTC dates for streaks. loadX() functions tolerate missing fields so old
// entries keep working; streak keys changed name (ta:streak_v2) to avoid
// miscounting legacy UTC-day data.

import type { DictationResult, TranscriptionResult, TypingResult } from "./types";
import type { CareerAssessmentResult } from "./career";
import { arenaDateString, arenaDaysBetween } from "./datetime";
import { track } from "./analytics";
import { getLocalNickname, setLocalNickname } from "./nickname";

const KEYS = {
  typing: "ta:typing_history_v2",
  dictation: "ta:dictation_history_v2",
  transcription: "ta:transcription_history_v2",
  career: "ta:career_history",
  xp: "ta:xp",
  streak: "ta:streak_v2",
  lastActivityDay: "ta:last_activity_day",
  nickname: "ta:nickname",
  analyticsConsent: "ta:analytics_consent",
};

const MAX_HISTORY = 500;

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, arr: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(arr.slice(0, MAX_HISTORY)));
  } catch {
    // storage full/blocked — practice continues without persistence
  }
}

// ---------------------------------------------------------------------------
// Typing
// ---------------------------------------------------------------------------

export function loadTypingHistory(): TypingResult[] {
  return readArray<TypingResult>(KEYS.typing);
}

export function saveTypingResult(r: TypingResult): void {
  const arr = loadTypingHistory();
  arr.unshift(r);
  writeArray(KEYS.typing, arr);
  noteActivity();
}

// ---------------------------------------------------------------------------
// Dictation / Transcription
// ---------------------------------------------------------------------------

export function loadDictationHistory(): DictationResult[] {
  return readArray<DictationResult>(KEYS.dictation);
}

export function saveDictationResult(r: DictationResult): void {
  const arr = loadDictationHistory();
  arr.unshift(r);
  writeArray(KEYS.dictation, arr);
  noteActivity();
}

export function loadTranscriptionHistory(): TranscriptionResult[] {
  return readArray<TranscriptionResult>(KEYS.transcription);
}

export function saveTranscriptionResult(r: TranscriptionResult): void {
  const arr = loadTranscriptionHistory();
  arr.unshift(r);
  writeArray(KEYS.transcription, arr);
  noteActivity();
}

// ---------------------------------------------------------------------------
// Career (shared history can hydrate through explicit opt-in sync)
// ---------------------------------------------------------------------------

export function loadCareerHistory(): CareerAssessmentResult[] {
  return readArray<CareerAssessmentResult>(KEYS.career);
}

/** Newest-first insert keyed by completedAt (the career result's identity). */
export function saveCareerResult(r: CareerAssessmentResult): void {
  const arr = loadCareerHistory().filter((x) => x.completedAt !== r.completedAt || x.trackId !== r.trackId);
  arr.unshift(r);
  writeArray(KEYS.career, arr);
  noteActivity();
}

/** Every persisted result across modes (used for export and explicit sync). */
export function exportAllResults(): {
  typing: TypingResult[];
  dictation: DictationResult[];
  transcription: TranscriptionResult[];
  career: CareerAssessmentResult[];
} {
  return {
    typing: loadTypingHistory(),
    dictation: loadDictationHistory(),
    transcription: loadTranscriptionHistory(),
    career: loadCareerHistory(),
  };
}

// ---------------------------------------------------------------------------
// Streak — one qualifying activity per product day (Asia/Jakarta).
// Qualifying activity = saving any scored attempt in any mode.
// ---------------------------------------------------------------------------

export interface StreakState {
  current: number;
  lastActivityDay: string | null;
}

export function getStreak(now: number = Date.now()): StreakState {
  if (typeof window === "undefined") return { current: 0, lastActivityDay: null };
  const current = parseInt(localStorage.getItem(KEYS.streak) ?? "0", 10) || 0;
  const lastActivityDay = localStorage.getItem(KEYS.lastActivityDay);
  let effective = current;
  if (lastActivityDay) {
    const gap = arenaDaysBetween(lastActivityDay, arenaDateString(now));
    if (gap > 1) effective = 0; // stale streak display; resets on next activity
  }
  return { current: effective, lastActivityDay };
}

/** Returns the new streak value, or null if no increment happened today. */
export function noteActivity(now: number = Date.now()): number | null {
  if (typeof window === "undefined") return null;
  const today = arenaDateString(now);
  const last = localStorage.getItem(KEYS.lastActivityDay);
  if (last === today) return null;
  let next: number;
  if (!last) next = 1;
  else {
    const gap = arenaDaysBetween(last, today);
    next = gap === 1 ? (parseInt(localStorage.getItem(KEYS.streak) ?? "0", 10) || 0) + 1 : 1;
  }
  try {
    localStorage.setItem(KEYS.streak, String(next));
    localStorage.setItem(KEYS.lastActivityDay, today);
  } catch {
    /* ignore */
  }
  track("streak_incremented", { streak: next });
  return next;
}

// ---------------------------------------------------------------------------
// Identity & consent
// ---------------------------------------------------------------------------

export function getNickname(): string | null {
  return getLocalNickname();
}

export function setNickname(name: string): void {
  setLocalNickname(name);
}

export type ConsentChoice = "granted" | "denied" | null;
const ANALYTICS_QUEUE_KEY = "ta:analytics_queue";

export function getAnalyticsConsent(): ConsentChoice {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEYS.analyticsConsent);
  return v === "granted" || v === "denied" ? v : null;
}

export function setAnalyticsConsent(choice: Exclude<ConsentChoice, null>): void {
  try {
    localStorage.setItem(KEYS.analyticsConsent, choice);
    if (choice === "denied") localStorage.removeItem(ANALYTICS_QUEUE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Delete ALL local product data (history, streak, nickname). Used by the
 * privacy controls on /progress. Analytics queue intentionally included via
 * clearQueue in analytics module when invoked from the UI.
 */
export function clearAllLocalData(): void {
  if (typeof window === "undefined") return;
  for (const key of Object.values(KEYS)) localStorage.removeItem(key);
}

