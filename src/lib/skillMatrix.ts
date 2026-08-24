// Multi-skill deterministic adaptation engine.
//
// Builds a skill matrix from typing + dictation + transcription history and
// deterministically recommends the next exercise. Rules are transparent
// thresholds — no AI, no opaque composite score.

import type {
  DictationResult,
  ExerciseRecommendation,
  Language,
  SkillMatrix,
  TranscriptionResult,
  TypingResult,
} from "./types";

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export const LISTENING_WEAK_NORMALIZED_THRESHOLD = 75;
export const LISTENING_HEAVY_REPLAY_RATIO = 2;

export function buildSkillMatrix(
  typingHistory: TypingResult[],
  dictationHistory: DictationResult[] = [],
  transcriptionHistory: TranscriptionResult[] = [],
): SkillMatrix {
  // --- typing -------------------------------------------------------------
  const keyAgg: Record<string, { errors: number; exposures: number }> = {};
  for (const r of typingHistory) {
    for (const [ch, s] of Object.entries(r.perKeyErrors)) {
      const agg = (keyAgg[ch] ??= { errors: 0, exposures: 0 });
      agg.errors += s.errors;
      agg.exposures += s.exposures;
    }
  }
  const weakKeys = Object.entries(keyAgg)
    .filter(([, s]) => s.exposures >= 5 && s.errors / s.exposures > 0.15)
    .sort((a, b) => b[1].errors / b[1].exposures - a[1].errors / a[1].exposures)
    .slice(0, 5)
    .map(([ch]) => ch);

  const bigramAgg: Record<string, { errors: number; exposures: number }> = {};
  for (const r of typingHistory) {
    for (const [bg, s] of Object.entries(r.bigramErrors)) {
      const agg = (bigramAgg[bg] ??= { errors: 0, exposures: 0 });
      agg.errors += s.errors;
      agg.exposures += s.exposures;
    }
  }
  const weakBigrams = Object.entries(bigramAgg)
    .filter(([, s]) => s.exposures >= 4 && s.errors / s.exposures > 0.25)
    .sort((a, b) => b[1].errors / b[1].exposures - a[1].errors / a[1].exposures)
    .slice(0, 5)
    .map(([bg]) => bg);

  const punctChars = [",", ".", "'", '"', ";", ":", "!", "?", "-", "—", "(", ")"];
  const punctuationWeak = punctChars.some((ch) => {
    const s = keyAgg[ch];
    return s && s.exposures >= 5 && s.errors / s.exposures > 0.2;
  });
  const numbersWeak = "0123456789".split("").some((ch) => {
    const s = keyAgg[ch];
    return s && s.exposures >= 5 && s.errors / s.exposures > 0.15;
  });

  const latencies = typingHistory.map((r) => r.correctionLatencyMsAvg).filter((x): x is number => typeof x === "number");

  // --- dictation (real listening modelling) --------------------------------
  const dictByLang: Record<Language, { attempts: number; scores: number[] }> = {
    en: { attempts: 0, scores: [] },
    id: { attempts: 0, scores: [] },
  };
  for (const r of dictationHistory) {
    dictByLang[r.language].attempts++;
    dictByLang[r.language].scores.push(r.normalizedScore);
  }
  const dictAttempts = dictationHistory.length;
  const avgNormalizedDict = avg(dictationHistory.map((r) => r.normalizedScore));
  const avgReplayRatios = dictationHistory
    .map((r) => r.playback.replayRatio)
    .filter((x): x is number => typeof x === "number");
  const avgReplayRatio = avg(avgReplayRatios);
  const listeningWeak =
    dictAttempts === 0
      ? false // unknown until tried; recommendation logic handles the "never tried" case
      : (avgNormalizedDict !== null && avgNormalizedDict < LISTENING_WEAK_NORMALIZED_THRESHOLD) ||
        (avgReplayRatio !== null && avgReplayRatio > LISTENING_HEAVY_REPLAY_RATIO && (avgNormalizedDict ?? 100) < 85);

  // --- transcription --------------------------------------------------------
  const transAvgNormalized = avg(transcriptionHistory.map((r) => r.normalizedScore));
  const transReplayRatios = transcriptionHistory
    .map((r) => r.playback.replayRatio)
    .filter((x): x is number => typeof x === "number");
  const completionHeavy =
    transcriptionHistory.length >= 2 &&
    (avg(transReplayRatios) ?? 0) > 2 &&
    (transAvgNormalized ?? 100) < 80;

  return {
    typing: {
      attempts: typingHistory.length,
      avgGrossWpm: avg(typingHistory.slice(0, 20).map((r) => r.grossWpm)),
      avgAccuracy: avg(typingHistory.slice(0, 20).map((r) => r.accuracy)),
      weakKeys,
      weakBigrams,
      punctuationWeak,
      numbersWeak,
      avgCorrectionLatencyMs: avg(latencies),
    },
    dictation: {
      attempts: dictAttempts,
      avgStrict: avg(dictationHistory.slice(0, 20).map((r) => r.strictScore)),
      avgNormalized: avgNormalizedDict,
      avgWordAccuracy: avg(dictationHistory.slice(0, 20).map((r) => r.wordAccuracy)),
      avgReplayRatio,
      listeningWeak,
      byLanguage: {
        en: { attempts: dictByLang.en.attempts, avgNormalized: avg(dictByLang.en.scores) },
        id: { attempts: dictByLang.id.attempts, avgNormalized: avg(dictByLang.id.scores) },
      },
    },
    transcription: {
      attempts: transcriptionHistory.length,
      avgNormalized: transAvgNormalized,
      avgReplayRatio: avg(transReplayRatios),
      completionHeavy,
    },
    lastUpdated: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Deterministic next-exercise selection.
// Priority: baseline → accuracy emergency → weakness drills → audio adoption →
// listening weakness → transcription depth → competition/variety rotation.
// ---------------------------------------------------------------------------

export function nextExerciseRecommendation(matrix: SkillMatrix, historyLen: number): ExerciseRecommendation {
  if (matrix.typing.attempts === 0) {
    return { label: "Start with a 30s Sprint", reason: "Establish your baseline typing speed", href: "/typing-test?duration=30" };
  }
  const t = matrix.typing;
  if (t.avgAccuracy !== null && t.avgAccuracy < 85) {
    return { label: "Accuracy drill — Copy Pro", reason: `Your recent accuracy averages ${t.avgAccuracy}% — slow down and rebuild precision`, href: "/punctuation-typing-test" };
  }
  if (t.punctuationWeak) {
    const weakPunct = t.weakKeys.filter((k) => /[.,'"";:!?()—\-/]/.test(k));
    return { label: "Punctuation Precision", reason: `You miss ${weakPunct.slice(0, 3).join(" ") || "punctuation"} more often than other keys`, href: "/punctuation-typing-test" };
  }
  if (t.numbersWeak) {
    return { label: "Numbers & Data drill", reason: "Accuracy drops on number-heavy patterns", href: "/data-entry-test" };
  }
  // Audio adoption: after a few sessions everyone should try dictation once.
  if (matrix.dictation.attempts === 0 && t.attempts >= 1) {
    return { label: matrix.typing.attempts % 2 === 0 ? "Test your listening (English)" : "Uji mendengar (Bahasa Indonesia)", reason: "You type well by sight — now prove listening-to-text", href: "/dictation" };
  }
  if (matrix.dictation.listeningWeak) {
    const weakestLang: Language =
      (matrix.dictation.byLanguage.id.avgNormalized ?? 101) < (matrix.dictation.byLanguage.en.avgNormalized ?? 101) ? "id" : "en";
    const href = weakestLang === "id" ? "/dictation/indonesian" : "/dictation/english";
    return {
      label: weakestLang === "id" ? "Latihan dikte lanjutan" : "Listening focus drill",
      reason: `Dictation normalised score ${matrix.dictation.avgNormalized ?? "—"}% suggests listening headroom`,
      href,
    };
  }
  if (matrix.transcription.attempts === 0 && matrix.dictation.attempts >= 2) {
    return { label: "Try Transcription Sprint", reason: "Your dictation is solid — step up to full clips with replay analytics", href: "/transcription-practice" };
  }
  if (matrix.transcription.completionHeavy) {
    return { label: "Transcription replay discipline", reason: "High replay ratio with lower accuracy — practice finishing clips in fewer passes", href: "/transcription-practice" };
  }
  if (t.weakKeys.length > 0) {
    return { label: `Key focus: ${JSON.stringify(t.weakKeys[0])}`, reason: `Key ${JSON.stringify(t.weakKeys[0])} has your highest error rate`, href: "/typing-test?mode=copy-pro" };
  }
  // Variety rotation between Daily Arena and audio maintenance.
  if (historyLen % 3 === 0) {
    return { label: "Daily Arena challenge", reason: "Compare yourself on today's standardized test", href: "/daily-arena" };
  }
  return { label: "Keep the streak — 60s Sprint", reason: "Consistency builds durable speed", href: "/typing-test?duration=60" };
}

// ---------------------------------------------------------------------------
// XP / level — includes all scored modes.
// ---------------------------------------------------------------------------

export function xpFromResults(typing: TypingResult[], dictation: DictationResult[], transcription: TranscriptionResult[]): number {
  const t = typing.reduce((sum, r) => sum + Math.round(r.grossWpm * (r.accuracy / 100) * 2), 0);
  const d = dictation.reduce((sum, r) => sum + Math.round(r.normalizedScore), 0);
  const tr = transcription.reduce((sum, r) => sum + Math.round(r.normalizedScore * 1.5), 0);
  return t + d + tr;
}

export function levelFromXP(xp: number): { level: number; progress: number; needed: number; pct: number } {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const nextXp = Math.pow(level, 2) * 50;
  const curXp = Math.pow(level - 1, 2) * 50;
  const progress = xp - curXp;
  const needed = nextXp - curXp;
  return { level, progress, needed, pct: needed ? Math.min(100, (progress / needed) * 100) : 0 };
}
