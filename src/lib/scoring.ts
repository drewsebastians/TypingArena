import { SCORING_VERSION, type TypingResult, type Mode, type Language } from "./types";

// Deterministic scoring — blueprint §9
// WPM = (typed chars / 5) / minutes  -- standard
// Accuracy = correct input events / relevant input events
// Plus per-key + bigram, correction latency, paste/focus signals

export function calcWpm(typedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((typedChars / 5 / minutes) * 10) / 10;
}

export function calcCpm(typedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round((typedChars / minutes) * 10) / 10;
}

// Final text accuracy: correct chars vs reference length
// For typing test we compare typed vs target up to typed length, plus untyped chars as errors
export function calcAccuracy(target: string, typed: string): number {
  if (target.length === 0 && typed.length === 0) return 100;
  const len = Math.max(target.length, typed.length);
  if (len === 0) return 100;
  let correct = 0;
  for (let i = 0; i < Math.min(target.length, typed.length); i++) {
    if (target[i] === typed[i]) correct++;
  }
  // extra typed chars beyond target are errors, missing chars are errors (counts against)
  // accuracy = correct / len
  return Math.round((correct / len) * 1000) / 10;
}

export function analyzePerKey(
  target: string,
  typed: string,
  keystrokes?: Array<{ key: string; correct: boolean }>
) {
  const perKey: Record<string, { errors: number; exposures: number; rate: number }> = {};
  const ensure = (ch: string) => {
    if (!perKey[ch]) perKey[ch] = { errors: 0, exposures: 0, rate: 0 };
  };
  for (let i = 0; i < typed.length; i++) {
    const exp = target[i] ?? "";
    const got = typed[i];
    const key = exp || got;
    ensure(key);
    perKey[key].exposures++;
    if (exp !== got) perKey[key].errors++;
  }
  // also count untyped tail as errors per expected char
  for (let i = typed.length; i < target.length; i++) {
    const ch = target[i];
    ensure(ch);
    perKey[ch].exposures++;
    perKey[ch].errors++;
  }
  for (const k of Object.keys(perKey)) {
    perKey[k].rate = perKey[k].exposures ? perKey[k].errors / perKey[k].exposures : 0;
  }
  return perKey;
}

export function analyzeBigrams(target: string, typed: string) {
  const map: Record<string, { errors: number; exposures: number }> = {};
  const max = Math.max(target.length, typed.length);
  for (let i = 0; i < max - 1; i++) {
    const expBigram = target.slice(i, i + 2);
    const gotBigram = typed.slice(i, i + 2);
    if (!expBigram) continue;
    // exposure each expected bigram encountered
    if (!map[expBigram]) map[expBigram] = { errors: 0, exposures: 0 };
    map[expBigram].exposures++;
    if (expBigram !== gotBigram.slice(0, expBigram.length)) {
      map[expBigram].errors++;
    }
  }
  return map;
}

export function calcCorrectionStats(keystrokes: Array<{ time: number; isBackspace: boolean; isCorrection: boolean }>) {
  let corrected = 0;
  const latencies: number[] = [];
  let lastErrorTime: number | null = null;
  for (const k of keystrokes) {
    // heuristic: time between error and backspace is correction latency
    // For simplicity, if isBackspace, count as correction if previous was error?
    // We'll approximate: backspace events are corrections
    if (k.isBackspace) corrected++;
  }
  // avg latency placeholder — computed from detailed stream in component
  return { corrected, avgLatency: latencies.length ? latencies.reduce((a,b)=>a+b,0)/latencies.length : null };
}

// Dictation scoring — blueprint §9.5
export function normalizeTextForScoring(
  s: string,
  opts: { caseSensitive: boolean; punctSensitive: boolean; trim: boolean } = {
    caseSensitive: false,
    punctSensitive: false,
    trim: true,
  }
): string {
  let out = s;
  if (opts.trim) out = out.trim().replace(/\s+/g, " ");
  if (!opts.caseSensitive) out = out.toLowerCase();
  if (!opts.punctSensitive) out = out.replace(/[.,!?;:"'()\-—]/g, "");
  // collapse spaces again after punct removal
  out = out.replace(/\s+/g, " ").trim();
  return out;
}

export function wordAccuracy(reference: string, typed: string, normalized = false): number {
  const norm = (x: string) => (normalized ? normalizeTextForScoring(x, { caseSensitive: false, punctSensitive: false, trim: true }) : x.trim());
  const refWords = norm(reference).split(/\s+/).filter(Boolean);
  const typedWords = norm(typed).split(/\s+/).filter(Boolean);
  if (refWords.length === 0) return typedWords.length === 0 ? 100 : 0;
  // simple word-level correct count via position — for dictation we want strict positional
  let correct = 0;
  const len = Math.max(refWords.length, typedWords.length);
  for (let i = 0; i < Math.min(refWords.length, typedWords.length); i++) {
    if (refWords[i] === typedWords[i]) correct++;
  }
  // If extra/missing words, they reduce accuracy by denominator = max length
  // But to keep 0-100 interpretable, use ref length denominator for recall-style
  // Blueprint says listening-content score focuses on captured words
  return Math.round((correct / refWords.length) * 1000) / 10;
}

// Levenshtein for strict char-level similarity (optional display)
export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  }
  return dp[m][n];
}

export function strictSimilarityPercent(reference: string, typed: string): number {
  if (reference === typed) return 100;
  if (reference.length === 0 && typed.length === 0) return 100;
  const maxLen = Math.max(reference.length, typed.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(reference, typed);
  return Math.max(0, Math.round(((maxLen - dist) / maxLen) * 1000) / 10);
}

export function buildTypingResult(params: {
  target: string;
  typed: string;
  elapsedMs: number;
  durationSec: number;
  language: Language;
  mode: Mode;
  keystrokes: Array<{ time: number; key: string; correct: boolean; isBackspace: boolean }>;
  pasteDetected: boolean;
  focusLostCount: number;
}): TypingResult {
  const { target, typed, elapsedMs, durationSec, language, mode, keystrokes, pasteDetected, focusLostCount } = params;
  const wpm = calcWpm(typed.length, elapsedMs);
  const rawWpm = calcWpm(target.length, elapsedMs); // alternative baseline
  const accuracy = calcAccuracy(target, typed);
  const perKey = analyzePerKey(target, typed);
  const bigram = analyzeBigrams(target, typed);
  // corrected vs uncorrected — count mismatches that were ultimately fixed?
  // simplified: totalErrors = chars mismatched in final string
  let mismatched = 0;
  for (let i = 0; i < Math.max(target.length, typed.length); i++) {
    if ((target[i] ?? "") !== (typed[i] ?? "")) mismatched++;
  }
  const backspaces = keystrokes.filter(k => k.isBackspace).length;
  const correctedErrors = Math.min(backspaces, mismatched + backspaces); // heuristic
  // uncorrected = mismatched final
  const uncorrectedErrors = mismatched;
  const totalErrors = uncorrectedErrors + backspaces; // raw error events
  const errorRate = target.length ? (uncorrectedErrors / target.length) : 0;

  // correction latency avg — time between wrong key and next backspace
  let latencySum = 0, latencyCount = 0;
  for (let i = 1; i < keystrokes.length; i++) {
    if (keystrokes[i].isBackspace && i > 0 && !keystrokes[i-1].correct) {
      latencySum += keystrokes[i].time - keystrokes[i-1].time;
      latencyCount++;
    }
  }
  const correctionLatencyMsAvg = latencyCount ? Math.round(latencySum / latencyCount) : null;

  const hasBurst = detectBurst(keystrokes);
  const integrity: TypingResult["integrity"] = pasteDetected || hasBurst || focusLostCount > 2 ? "flagged" : focusLostCount > 0 ? "practice" : "ranked";

  return {
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    mode, language, durationSec, elapsedMs, wpm, rawWpm, accuracy,
    correctedErrors: backspaces, // treat backspaces as corrected attempt count
    uncorrectedErrors,
    totalErrors,
    errorRate,
    cpm: calcCpm(typed.length, elapsedMs),
    perKeyErrors: perKey,
    bigramErrors: bigram,
    correctionLatencyMsAvg,
    pasteDetected,
    focusLostCount,
    integrity,
    text: target,
    typed,
    timestamp: Date.now(),
    version: SCORING_VERSION,
  };
}

function detectBurst(keystrokes: Array<{ time: number }>): boolean {
  // impossible burst: > 25 chars in < 500ms (50 wps ~ 600 wpm unrealistic)
  if (keystrokes.length < 10) return false;
  for (let i = 0; i < keystrokes.length - 10; i++) {
    const window = keystrokes[i+10].time - keystrokes[i].time;
    if (window < 400) return true;
  }
  return false;
}
