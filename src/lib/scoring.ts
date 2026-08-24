// Scoring v2 — deterministic, documented semantics (see README §Scoring Spec).
//
// KEY CORRECTIONS vs prototype v1:
//  1. Accuracy is computed over the TYPED SCOPE ONLY. Characters the user never
//     reached are never counted as errors.
//  2. Final-text error attribution uses Wagner–Fischer alignment (see
//     ./alignment), not naive positional comparison, so a single insertion or
//     deletion cannot cascade into phantom downstream errors.
//  3. Corrected vs uncorrected errors come from event-level tracking
//     (./corrections), not heuristics over the final string.
//  4. Per-key / bigram profiles are accumulated at keystroke time over every
//     attempt (including later-corrected ones), giving true exposure counts.

import {
  SCORING_VERSION,
  type BigramStat,
  type Language,
  type Mode,
  type PerKeyStat,
} from "./types";
import { alignSequences, alignWords } from "./alignment";
import { CorrectionTracker } from "./corrections";

// ---------------------------------------------------------------------------
// Basic rates
// ---------------------------------------------------------------------------

export function calcWpm(typedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return Math.round((typedChars / 5 / minutes) * 10) / 10;
}

export function calcCpm(typedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return Math.round((typedChars / minutes) * 10) / 10;
}

export function netWpm(typedChars: number, uncorrectedErrors: number, elapsedMs: number): number {
  return calcWpm(Math.max(0, typedChars - uncorrectedErrors), elapsedMs);
}

/**
 * Accuracy over the typed scope: correct committed characters / total committed
 * characters. Untyped future text is irrelevant by construction. Returns 0 when
 * nothing was typed so empty runs can't masquerade as perfect accuracy.
 */
export function typedScopeAccuracy(correctChars: number, typedChars: number): number {
  if (typedChars <= 0) return 0;
  return round1((correctChars / typedChars) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Per-key / bigram accumulation (called at keystroke time)
// ---------------------------------------------------------------------------

const PUNCT_CHARS = new Set([",", ".", "'", '"', ";", ":", "!", "?", "-", "—", "(", ")", "/"]);
const DIGITS = new Set("0123456789".split(""));

export function accumulatePerKey(
  map: Record<string, PerKeyStat>,
  expected: string,
  typed: string,
): void {
  // Attribute the attempt to the EXPECTED character (that is the skill being
  // measured); record what was actually pressed as an additional exposure-free
  // signal only when it differs, so mistyped neighbours surface in the heatmap.
  const stat = map[expected] ?? (map[expected] = { errors: 0, exposures: 0, rate: 0 });
  stat.exposures++;
  if (typed !== expected) stat.errors++;
  if (typed !== expected && typed && !map[typed]) map[typed] = { errors: 0, exposures: 0, rate: 0 };
}

/** Bigram context = previous entry still in the buffer at push time. */
export function accumulateBigram(
  map: Record<string, BigramStat>,
  prevExpected: string | null,
  currentEntry: { expected: string; typed: string },
  previousEntry: { expected: string; typed: string } | null,
): void {
  if (!previousEntry || !prevExpected) return;
  const bigram = `${previousEntry.expected}${currentEntry.expected}`;
  const stat = map[bigram] ?? (map[bigram] = { errors: 0, exposures: 0 });
  stat.exposures++;
  if (currentEntry.typed !== currentEntry.expected || previousEntry.typed !== previousEntry.expected) stat.errors++;
}

export function finalizeRates(perKey: Record<string, PerKeyStat>): void {
  for (const k of Object.keys(perKey)) {
    perKey[k].rate = perKey[k].exposures ? round1((perKey[k].errors / perKey[k].exposures) * 1000) / 1000 : 0;
  }
}

export interface WeaknessReport {
  weakKeys: string[];
  weakBigrams: string[];
  punctuationWeak: boolean;
  numbersWeak: boolean;
}

export function weaknessesFromMaps(
  perKey: Record<string, PerKeyStat>,
  bigrams: Record<string, BigramStat>,
): WeaknessReport {
  const weakKeys = Object.entries(perKey)
    .filter(([ch, s]) => s.exposures >= 5 && ch.trim() !== "" && s.rate > 0.15)
    .sort((a, b) => b[1].rate - a[1].rate)
    .slice(0, 6)
    .map(([ch]) => ch);
  const weakBigrams = Object.entries(bigrams)
    .filter(([, s]) => s.exposures >= 4 && s.errors / s.exposures > 0.25)
    .sort((a, b) => b[1].errors / b[1].exposures - a[1].errors / a[1].exposures)
    .slice(0, 5)
    .map(([bg]) => bg);
  const punctuationWeak = [...PUNCT_CHARS].some((ch) => {
    const s = perKey[ch];
    return s && s.exposures >= 5 && s.rate > 0.2;
  });
  const numbersWeak = [...DIGITS].some((ch) => {
    const s = perKey[ch];
    return s && s.exposures >= 5 && s.rate > 0.15;
  });
  return { weakKeys, weakBigrams, punctuationWeak, numbersWeak };
}

// ---------------------------------------------------------------------------
// Text normalization (versioned — see NORMALIZATION_VERSION)
// ---------------------------------------------------------------------------

export interface NormalizeOptions {
  caseSensitive: boolean;
  punctSensitive: boolean;
}

export const DEFAULT_NORMALIZE_OPTIONS: NormalizeOptions = { caseSensitive: false, punctSensitive: false };

const STRIP_PUNCT_RE = /[.,!?;:"'`´“”‘’«»()\[\]{}\-–—…·]/g;

/**
 * Normalize text for tolerant scoring. Unicode NFC composed first; whitespace
 * collapsed; optionally lowercased and stripped of punctuation. Apostrophes are
 * stripped so English contractions ("don't" → "dont") compare tolerantly —
 * Indonesian rarely uses apostrophes so behaviour is safe for both languages.
 */
export function normalizeTextForScoring(s: string, options: NormalizeOptions = DEFAULT_NORMALIZE_OPTIONS): string {
  let out = s.normalize("NFC");
  out = out.replace(/\s+/g, " ").trim();
  if (!options.caseSensitive) out = out.toLowerCase();
  if (!options.punctSensitive) out = out.replace(STRIP_PUNCT_RE, "");
  return out.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Aligned similarity metrics
// ---------------------------------------------------------------------------

/** Char-level accuracy: aligned matches / max(refLen, typedLen). Penalizes
 *  insertions and deletions symmetrically without positional cascade. */
export function strictSimilarityPercent(reference: string, typed: string): number {
  if (reference.length === 0 && typed.length === 0) return 100;
  const denom = Math.max(reference.length, typed.length);
  if (denom === 0) return 100;
  const { stats } = alignSequences(reference, typed);
  return round1((stats.matches / denom) * 100);
}

/** Word-level accuracy (recall-style): aligned matched reference words / total
 *  reference words. Alignment prevents drift after a missed word. */
export function wordAccuracyPercent(reference: string, typed: string, normalized = false): number {
  const norm = (x: string) => (normalized ? normalizeTextForScoring(x) : x.trim());
  const refWords = norm(reference).split(/\s+/).filter(Boolean);
  const typedWords = norm(typed).split(/\s+/).filter(Boolean);
  if (refWords.length === 0) return typedWords.length === 0 ? 100 : 0;
  const { matchedRef } = alignWords(refWords, typedWords);
  const matched = matchedRef.filter(Boolean).length;
  return round1((matched / refWords.length) * 100);
}

/**
 * Fraction of reference punctuation marks reproduced exactly (case-sensitive
 * alignment). Returns null when the reference contains no punctuation.
 */
export function punctuationAccuracyPercent(reference: string, typed: string): number | null {
  const puncts = [...reference].filter((c) => PUNCT_CHARS.has(c));
  if (puncts.length === 0) return null;
  const { ops } = alignSequences(reference, typed);
  let total = 0;
  let correct = 0;
  for (const op of ops) {
    if (op.type === "match" && PUNCT_CHARS.has(op.expected)) {
      total++;
      correct++;
    } else if ((op.type === "substitute" || op.type === "delete") && PUNCT_CHARS.has(op.expected)) {
      // substituted away or omitted — a punctuation miss
      total++;
    }
  }
  if (total === 0) return null;
  return round1((correct / total) * 100);
}

export function effectiveWpm(typedChars: number, completionMs: number): number {
  return calcWpm(typedChars, completionMs);
}

// ---------------------------------------------------------------------------
// Full typing result assembly
// ---------------------------------------------------------------------------

export interface TypingAttemptInput {
  language: Language;
  mode: Mode;
  configuredDurationSec: number;
  elapsedMs: number;
  tracker: CorrectionTracker;
  perKey: Record<string, PerKeyStat>;
  bigrams: Record<string, BigramStat>;
  burstDetected: boolean;
  pasteDetected: boolean;
  focusLostCount: number;
  challengeDate?: string;
  exerciseId: string;
  exerciseVersion: string;
  id: string;
  timestamp: number;
}

export interface AssembledTypingResult {
  grossWpm: number;
  netWpm: number;
  cpm: number;
  accuracy: number;
  typedChars: number;
  correctChars: number;
  corrections: ReturnType<CorrectionTracker["summarize"]>;
  weaknesses: WeaknessReport;
  scoringVersion: string;
}

export function assembleTypingMetrics(input: TypingAttemptInput): AssembledTypingResult {
  const entries = input.tracker.finalEntries();
  const typedChars = entries.length;
  const correctChars = entries.filter((e) => e.typed === e.expected).length;
  const corrections = input.tracker.summarize();
  finalizeRates(input.perKey);
  return {
    grossWpm: calcWpm(typedChars, input.elapsedMs),
    netWpm: netWpm(typedChars, corrections.uncorrectedErrors, input.elapsedMs),
    cpm: calcCpm(typedChars, input.elapsedMs),
    accuracy: typedScopeAccuracy(correctChars, typedChars),
    typedChars,
    correctChars,
    corrections,
    weaknesses: weaknessesFromMaps(input.perKey, input.bigrams),
    scoringVersion: SCORING_VERSION,
  };
}
