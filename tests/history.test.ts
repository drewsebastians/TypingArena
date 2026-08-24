// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  getStreak,
  loadTypingHistory,
  noteActivity,
  saveDictationResult,
  saveTranscriptionResult,
  saveTypingResult,
} from "@/lib/history";
import type { DictationResult, TranscriptionResult, TypingResult } from "@/lib/types";

// Fixed instants: 2026-08-24 10:00 UTC = 17:00 WIB (same product day);
// 2026-08-24 16:00 UTC = 23:00 WIB; 2026-08-25 02:00 UTC = next WIB day.
const D1 = Date.parse("2026-08-24T10:00:00Z");
const D1_LATE = Date.parse("2026-08-24T16:00:00Z");
const D2 = Date.parse("2026-08-25T02:00:00Z");
const D4 = Date.parse("2026-08-27T02:00:00Z");

beforeEach(() => localStorage.clear());

describe("streak logic — one qualifying activity per Asia/Jakarta day", () => {
  it("first activity starts streak at 1", () => {
    expect(noteActivity(D1)).toBe(1);
    expect(getStreak(D1).current).toBe(1);
  });

  it("multiple activities on the SAME product day do not double-increment", () => {
    noteActivity(D1);
    expect(noteActivity(D1)).toBeNull(); // no increment
    expect(noteActivity(D1_LATE)).toBeNull(); // still same WIB day
    expect(getStreak(D1_LATE).current).toBe(1);
  });

  it("consecutive day increments exactly once", () => {
    noteActivity(D1);
    expect(noteActivity(D2)).toBe(2);
  });

  it("gap of 2+ days resets to 1", () => {
    noteActivity(D1);
    expect(noteActivity(D4)).toBe(1);
  });

  it("displayed streak goes stale after a gap without activity", () => {
    noteActivity(D1);
    expect(getStreak(D4).current).toBe(0); // broken streak shows as 0 until new activity
  });
});

function fakeTyping(over: Partial<TypingResult> = {}): TypingResult {
  return {
    id: "x", mode: "sprint", language: "en", durationSec: 30, elapsedMs: 30_000,
    grossWpm: 60, netWpm: 55, cpm: 300, accuracy: 95, correctChars: 280, typedChars: 300,
    correctedErrors: 3, uncorrectedErrors: 5, rawErrorEvents: 8, backspaceActions: 4,
    immediateCorrections: 2, correctionLatencyMsAvg: 200, perKeyErrors: {}, bigramErrors: {},
    pasteDetected: false, focusLostCount: 0, integrity: "ranked", integrityReasons: [],
    exerciseId: "en-sprint-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
    timestamp: Date.now(), ...over,
  };
}

function fakeDictation(): DictationResult {
  return {
    id: "d1", language: "en", strictScore: 90, normalizedScore: 95, wordAccuracy: 96,
    punctuationAccuracy: 80, effectiveWpm: 40, completionMs: 20_000,
    playback: { playCount: 2, replayCount: 1, playedSeconds: 12, uniqueClipSeconds: 8, pauseCount: 1, seekCount: 0, replayRatio: 1.5 },
    pasteDetected: false, integrity: "ranked", integrityReasons: [],
    exerciseId: "dict-en-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
    normalizationVersion: "v2.0.0", timestamp: Date.now(),
  };
}

function fakeTranscription(): TranscriptionResult {
  return {
    id: "t1", language: "id", strictScore: 80, normalizedScore: 88, wordAccuracy: 90,
    punctuationAccuracy: null, effectiveWpm: 35, activeTypingWpm: 42, completionMs: 45_000,
    activeInputMs: 30_000,
    playback: { playCount: 3, replayCount: 2, playedSeconds: 100, uniqueClipSeconds: 40, pauseCount: 2, seekCount: 1, replayRatio: 2.5 },
    corrections: 4, pasteDetected: false, integrity: "ranked", integrityReasons: [],
    exerciseId: "trans-id-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
    normalizationVersion: "v2.0.0", difficulty: "medium", timestamp: Date.now(),
  };
}

describe("history persistence", () => {
  it("saves and loads typing results with version fields intact", () => {
    const r = fakeTyping();
    saveTypingResult(r);
    const loaded = loadTypingHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].scoringVersion).toBe("v2.0.0");
    expect(loaded[0].exerciseId).toBe("en-sprint-001");
  });

  it("all three modes persist independently and count toward activity", () => {
    saveTypingResult(fakeTyping());
    saveDictationResult(fakeDictation());
    saveTranscriptionResult(fakeTranscription());
    expect(loadTypingHistory()).toHaveLength(1);
    expect(localStorage.getItem("ta:last_activity_day")).not.toBeNull();
  });

  it("caps history at 500 entries", () => {
    for (let i = 0; i < 520; i++) saveTypingResult(fakeTyping({ id: `r${i}` }));
    expect(loadTypingHistory().length).toBe(500);
  });
});

