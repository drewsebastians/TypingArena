// Integrity classification — practical, transparent, deterministic.
//
// States:
//   "ranked"   — eligible for shared leaderboards (server re-validates; client
//                classification alone is not trusted for security).
//   "practice" — valid attempt with minor caveats (e.g. brief focus loss).
//   "flagged"  — excluded from ranked boards. Reasons recorded.
//
// Client-side signals are heuristics only. The database RPC rejects non-ranked
// writes into ranked tables, so a tampered client still cannot fabricate ranked
// entries.

import type { CorrectionSummary } from "./corrections";

export type IntegrityState = "ranked" | "practice" | "flagged";

export interface IntegrityInput {
  pasteDetected: boolean;
  focusLostCount: number;
  burstDetected: boolean;
  durationSec: number;
  corrections?: CorrectionSummary | null;
  /** Challenge metadata matched what the server issued for this date. */
  challengeValid?: boolean;
}

export interface IntegrityVerdict {
  state: IntegrityState;
  reasons: string[];
}

/** Impossible burst: >10 characters within any 400ms sliding window
 *  (~1500 WPM). Tested with synthetic keystroke streams. */
export function detectBurst(eventTimes: number[]): boolean {
  const times = eventTimes.slice().sort((a, b) => a - b);
  const WINDOW = 400;
  const COUNT = 11;
  if (times.length < COUNT) return false;
  for (let i = 0; i + COUNT - 1 < times.length; i++) {
    if (times[i + COUNT - 1] - times[i] < WINDOW) return true;
  }
  return false;
}

export function classifyIntegrity(input: IntegrityInput): IntegrityVerdict {
  const reasons: string[] = [];
  if (input.pasteDetected) reasons.push("paste");
  if (input.burstDetected) reasons.push("impossible_typing_burst");
  if (input.focusLostCount > 2) reasons.push(`focus_lost_x${input.focusLostCount}`);
  if (input.challengeValid === false) reasons.push("challenge_metadata_mismatch");

  if (reasons.length > 0) return { state: "flagged", reasons };

  // A short test barely leaves room to refocus; require at least 20s before a
  // single focus loss demotes the result.
  if (input.focusLostCount > 0 && input.durationSec >= 20) reasons.push("focus_lost");
  if (reasons.length > 0) return { state: "practice", reasons };
  return { state: "ranked", reasons: [] };
}

export const INTEGRITY_EXPLANATIONS: Record<IntegrityState, string> = {
  ranked: "Eligible for leaderboards.",
  practice: "Counts toward your history and skill profile, but not ranked boards (window lost focus during the test).",
  flagged: "Excluded from ranked boards: paste, impossible typing bursts, repeated focus loss, or mismatched challenge metadata.",
};
