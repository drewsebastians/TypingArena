import type { TypingResult, SkillMatrix } from "./types";

// Deterministic adaptation engine — blueprint §10
// Input: error event stream -> skill matrix -> deterministic selector

export function buildSkillMatrix(history: TypingResult[]): SkillMatrix {
  const perKeyRate: Record<string, number> = {};
  const agg: Record<string, { errors: number; exposures: number }> = {};
  for (const r of history) {
    for (const [k, v] of Object.entries(r.perKeyErrors)) {
      if (!agg[k]) agg[k] = { errors: 0, exposures: 0 };
      agg[k].errors += v.errors;
      agg[k].exposures += v.exposures;
    }
  }
  for (const [k, v] of Object.entries(agg)) {
    perKeyRate[k] = v.exposures ? v.errors / v.exposures : 0;
  }
  const weakKeys = Object.entries(perKeyRate)
    .filter(([, rate]) => rate > 0.15)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([k])=>k);

  // bigram weakness
  const bigramAgg: Record<string, { errors: number; exposures: number }> = {};
  for (const r of history) {
    for (const [bg, v] of Object.entries(r.bigramErrors)) {
      if (!bigramAgg[bg]) bigramAgg[bg] = { errors: 0, exposures: 0 };
      bigramAgg[bg].errors += v.errors;
      bigramAgg[bg].exposures += v.exposures;
    }
  }
  const weakBigrams = Object.entries(bigramAgg)
    .filter(([, v]) => v.exposures > 2 && v.errors / v.exposures > 0.25)
    .sort((a,b)=> (b[1].errors/b[1].exposures) - (a[1].errors/a[1].exposures))
    .slice(0,5)
    .map(([k])=>k);

  const punctChars = [",",".","'","\"",";","!",":","-","—","(",")"];
  const punctuationWeak = punctChars.some(ch => (perKeyRate[ch] ?? 0) > 0.2);
  const numbersWeak = "0123456789".split("").some(ch => (perKeyRate[ch] ?? 0) > 0.15);
  const listeningWeak = false; // derived from dictation history separately

  return { perKeyRate, weakKeys, weakBigrams, punctuationWeak, numbersWeak, listeningWeak, lastUpdated: Date.now() };
}

export function nextExerciseRecommendation(matrix: SkillMatrix, historyLen: number): { label: string; reason: string; href: string } {
  // Deterministic selector: weakness relevance + freshness + variety — blueprint formula simplified
  if (historyLen === 0) return { label: "Start with 30s Sprint", reason: "Establish your baseline speed", href: "/typing-test?duration=30" };
  if (matrix.punctuationWeak) return { label: "Punctuation Precision", reason: `You miss ${matrix.weakKeys.filter(k=>/[.,'\";:!?()—-]/.test(k)).join(" ") || "punctuation"} more often`, href: "/punctuation-typing-test" };
  if (matrix.numbersWeak) return { label: "Numbers & Data Drill", reason: "Accuracy drops on number-heavy patterns", href: "/data-entry-test" };
  if (matrix.weakBigrams.length) return { label: `Bigram focus: ${matrix.weakBigrams[0]}`, reason: `Bigram "${matrix.weakBigrams[0]}" needs practice`, href: "/typing-test?mode=copy-pro" };
  if (matrix.weakKeys.length) return { label: `Key focus: ${matrix.weakKeys[0]}`, reason: `Key "${matrix.weakKeys[0]}" has highest error rate`, href: "/typing-test?mode=copy-pro" };
  // rotate to audio
  if (historyLen % 3 === 0) return { label: "Test listening accuracy", reason: "Your typing is solid — now test listening-to-text", href: "/dictation" };
  return { label: "Daily Arena Challenge", reason: "Compare yourself on today's standardized test", href: "/daily-arena" };
}

// XP / Level derived from WPM+accuracy — deterministic
export function levelFromXP(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const nextXp = Math.pow(level, 2) * 50;
  const curXp = Math.pow(level - 1, 2) * 50;
  const progress = xp - curXp;
  const needed = nextXp - curXp;
  return { level, progress, needed, pct: needed ? (progress/needed)*100 : 0 };
}
