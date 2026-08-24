import { describe, expect, it } from "vitest";
import { buildSkillMatrix, levelFromXP, nextExerciseRecommendation, xpFromResults } from "@/lib/skillMatrix";
import type { DictationResult, TranscriptionResult, TypingResult } from "@/lib/types";

function typing(over: Partial<TypingResult> = {}): TypingResult {
  return {
    id: Math.random().toString(36).slice(2), mode: "sprint", language: "en", durationSec: 30,
    elapsedMs: 30_000, grossWpm: 70, netWpm: 65, cpm: 350, accuracy: 96, correctChars: 300,
    typedChars: 320, correctedErrors: 2, uncorrectedErrors: 4, rawErrorEvents: 6,
    backspaceActions: 3, immediateCorrections: 1, correctionLatencyMsAvg: 250,
    perKeyErrors: {}, bigramErrors: {}, pasteDetected: false, focusLostCount: 0,
    integrity: "ranked", integrityReasons: [], exerciseId: "x", exerciseVersion: "v2",
    scoringVersion: "v2.0.0", timestamp: Date.now(), ...over,
  };
}

function dictation(normalizedScore: number, replayRatio = 1): DictationResult {
  return {
    id: Math.random().toString(36).slice(2), language: "en", strictScore: normalizedScore - 5,
    normalizedScore, wordAccuracy: normalizedScore + 1, punctuationAccuracy: null,
    effectiveWpm: 40, completionMs: 20_000,
    playback: { playCount: replayRatio > 1 ? 3 : 1, replayCount: replayRatio > 1 ? 2 : 0, playedSeconds: replayRatio * 10, uniqueClipSeconds: 10, pauseCount: 0, seekCount: 0, replayRatio },
    pasteDetected: false, integrity: "ranked", integrityReasons: [],
    exerciseId: "dict-en-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
    normalizationVersion: "v2.0.0", timestamp: Date.now(),
  };
}

function transcription(): TranscriptionResult {
  return {
    id: "t", language: "en", strictScore: 85, normalizedScore: 90, wordAccuracy: 92,
    punctuationAccuracy: 75, effectiveWpm: 38, activeTypingWpm: null, completionMs: 60_000,
    activeInputMs: 40_000,
    playback: { playCount: 2, replayCount: 1, playedSeconds: 50, uniqueClipSeconds: 40, pauseCount: 1, seekCount: 0, replayRatio: 1.25 },
    corrections: 5, pasteDetected: false, integrity: "ranked", integrityReasons: [],
    exerciseId: "trans-en-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
    normalizationVersion: "v2.0.0", difficulty: "medium", timestamp: Date.now(),
  };
}

describe("listening weakness is DERIVED, not hardcoded", () => {
  it("no dictation attempts → not weak (unknown)", () => {
    const m = buildSkillMatrix([typing()], [], []);
    expect(m.dictation.listeningWeak).toBe(false);
    expect(m.dictation.attempts).toBe(0);
  });

  it("low dictation scores mark listening weak", () => {
    const m = buildSkillMatrix([typing()], [dictation(55), dictation(65)], []);
    expect(m.dictation.listeningWeak).toBe(true);
    expect(m.dictation.avgNormalized).toBe(60);
  });

  it("strong dictation scores keep listening healthy", () => {
    const m = buildSkillMatrix([typing()], [dictation(92), dictation(95)], []);
    expect(m.dictation.listeningWeak).toBe(false);
  });

  it("heavy replay reliance with mediocre score marks listening weak", () => {
    const m = buildSkillMatrix([], [dictation(80, 4), dictation(82, 5)], []);
    expect(m.dictation.listeningWeak).toBe(true);
  });

  it("language breakdown is tracked separately", () => {
    const m = buildSkillMatrix([], [dictation(90), { ...dictation(40), language: "id" as const }], []);
    expect(m.dictation.byLanguage.en.avgNormalized).toBe(90);
    expect(m.dictation.byLanguage.id.avgNormalized).toBe(40);
  });
});

describe("deterministic recommendations across modes", () => {
  it("empty history → baseline sprint", () => {
    const rec = nextExerciseRecommendation(buildSkillMatrix([], [], []), 0);
    expect(rec.href).toContain("/typing-test");
  });

  it("after typing only, recommends dictation (audio adoption)", () => {
    const history = [typing(), typing()];
    const rec = nextExerciseRecommendation(buildSkillMatrix(history, [], []), history.length);
    expect(rec.href).toBe("/dictation");
  });

  it("weak listening → targeted dictation drill in the weaker language", () => {
    const d = [{ ...dictation(50), language: "id" as const }, dictation(88)];
    const t = [typing(), typing()];
    const rec = nextExerciseRecommendation(buildSkillMatrix(t, d, []), t.length);
    expect(rec.href).toBe("/dictation/indonesian");
  });

  it("dictation solid + ≥2 attempts → suggests transcription step-up", () => {
    const t = [typing(), typing()];
    const d = [dictation(90), dictation(93)];
    const rec = nextExerciseRecommendation(buildSkillMatrix(t, d, []), t.length);
    expect(rec.href).toBe("/transcription-practice");
  });

  it("low typing accuracy overrides everything with accuracy drill", () => {
    const t = [typing({ accuracy: 72 }), typing({ accuracy: 74 })];
    const rec = nextExerciseRecommendation(buildSkillMatrix(t, [], []), t.length);
    expect(rec.href).toBe("/punctuation-typing-test");
  });
});

describe("skill matrix aggregation", () => {
  it("aggregates per-key stats across attempts with exposure weighting", () => {
    const a = typing({
      perKeyErrors: { q: { errors: 1, exposures: 10, rate: 0.1 } },
      bigramErrors: {},
    });
    const b = typing({
      perKeyErrors: { q: { errors: 3, exposures: 10, rate: 0.3 } },
      bigramErrors: {},
    });
    const m = buildSkillMatrix([a, b], [], []);
    expect(m.typing.attempts).toBe(2);
    // Combined: 4 errors / 20 exposures = 20% > 15% threshold → weak.
    expect(m.typing.weakKeys).toContain("q");
  });

  it("transcription metrics surface in matrix", () => {
    const m = buildSkillMatrix([], [], [transcription()]);
    expect(m.transcription.attempts).toBe(1);
    expect(m.transcription.avgNormalized).toBe(90);
    expect(m.transcription.avgReplayRatio).toBe(1.3); // avg() keeps one decimal
  });
});

describe("XP and levels include all modes", () => {
  it("xp grows from typing+dictation+transcription", () => {
    const xp = xpFromResults([typing()], [dictation(90)], [transcription()]);
    // typing: round(70*0.96*2)=134; dictation: 90; transcription: round(90*1.5)=135
    expect(xp).toBe(134 + 90 + 135);
  });

  it("levels are monotonic with progress within a level bounded to 100%", () => {
    for (const xp of [0, 49, 50, 200, 1000]) {
      const l = levelFromXP(xp);
      expect(l.level).toBeGreaterThanOrEqual(1);
      expect(l.pct).toBeLessThanOrEqual(100);
      expect(l.pct).toBeGreaterThanOrEqual(0);
    }
    expect(levelFromXP(200).level).toBeGreaterThan(levelFromXP(50).level);
  });
});
