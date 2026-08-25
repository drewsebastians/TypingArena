import { describe, expect, it } from "vitest";
import { typingEvidence, audioEvidence, mergeById } from "@/lib/sync";
import { scoreModules, typingEfficiency, audioEfficiency } from "@/lib/career";
import { currentSeason, recentSeasons, seasonContains, seasonForDay } from "@/lib/seasons";
import type { DictationResult, TypingResult } from "@/lib/types";

// ---------------------------------------------------------------------------
// Sync evidence + merge
// ---------------------------------------------------------------------------

function fakeTyping(over: Partial<TypingResult> = {}): TypingResult {
  return {
    id: "r-1", mode: "sprint", language: "en", durationSec: 30, elapsedMs: 30_000,
    grossWpm: 60, netWpm: 55, cpm: 300, accuracy: 95, correctChars: 142, typedChars: 150,
    correctedErrors: 3, uncorrectedErrors: 5, rawErrorEvents: 8, backspaceActions: 4,
    immediateCorrections: 2, correctionLatencyMsAvg: 200, perKeyErrors: {}, bigramErrors: {},
    pasteDetected: false, focusLostCount: 0, integrity: "ranked", integrityReasons: [],
    exerciseId: "en-sprint-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
    timestamp: Date.now(), ...over,
  };
}

describe("attempt evidence payloads (server-authoritative submission)", () => {
  it("typing evidence carries counts the server can recompute wpm/accuracy from", () => {
    const e = typingEvidence(fakeTyping());
    expect(e.typedChars).toBe(150);
    expect(e.correctChars).toBeLessThanOrEqual(e.typedChars!);
    // Server recomputation matches the client claim exactly for consistent data.
    expect(e.claimedWpm).toBeCloseTo((e.typedChars! / 5) / (e.elapsedMs! / 60_000), 5);
    expect(e.claimedAccuracy).toBeCloseTo((e.correctChars! / e.typedChars!) * 100, 0);
    expect(e.clientId).toBe("r-1");
  });

  it("burst/paste flags derive from integrity reasons", () => {
    expect(typingEvidence(fakeTyping({ integrityReasons: ["impossible_typing_burst"] })).burstFlag).toBe(true);
    expect(typingEvidence(fakeTyping({ pasteDetected: true })).pasteFlag).toBe(true);
  });

  it("audio evidence keeps invariants correct<=typed and rides full result in metrics", () => {
    const r = {
      id: "d-9", language: "en" as const, strictScore: 90, normalizedScore: 92, wordAccuracy: 94,
      punctuationAccuracy: 80, effectiveWpm: 40, completionMs: 20_000,
      playback: { playCount: 1, replayCount: 0, playedSeconds: 8, uniqueClipSeconds: 8, pauseCount: 0, seekCount: 0, replayRatio: 1 },
      pasteDetected: false, integrity: "ranked" as const, integrityReasons: [] as string[],
      exerciseId: "dict-en-001", exerciseVersion: "v2", scoringVersion: "v2.0.0",
      normalizationVersion: "v2.0.0", timestamp: Date.now(),
    } satisfies DictationResult;
    const e = audioEvidence(r, "dictation");
    expect(e.correctChars!).toBeLessThanOrEqual(e.typedChars!);
    expect(e.metrics?.kind).toBe("dictation");
  });

  it("mergeById dedupes on id and sorts by timestamp desc when present", () => {
    const list: Array<{ id: string; timestamp: number; v: number }> = [];
    expect(mergeById(list, { id: "a", timestamp: 100, v: 1 })).toBe(1);
    expect(mergeById(list, { id: "b", timestamp: 300, v: 2 })).toBe(1);
    expect(mergeById(list, { id: "a", timestamp: 100, v: 1 })).toBe(0); // duplicate ignored
    expect(list.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

// ---------------------------------------------------------------------------
// Career scoring
// ---------------------------------------------------------------------------

describe("career scoring bands (transparent weights)", () => {
  const track = { id: "data-entry" as const, modules: [{}, {}, {}] as never[] };
  it("strong module → Advanced band", () => {
    const r = scoreModules(track as never, [
      { label: "m", kind: "typing", accuracy: 97, speedWpm: 70, efficiency: 95, integrityFlags: [] },
      { label: "m2", kind: "typing", accuracy: 96, speedWpm: 72, efficiency: 93, integrityFlags: [] },
      { label: "m3", kind: "typing", accuracy: 98, speedWpm: 68, efficiency: 96, integrityFlags: [] },
    ]);
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.band).toBe("Advanced");
  });
  it("mid performance → Proficient; weak → Developing", () => {
    const mid = scoreModules(track as never, [
      { label: "m", kind: "typing", accuracy: 90, speedWpm: 40, efficiency: 80, integrityFlags: [] },
      { label: "m", kind: "typing", accuracy: 91, speedWpm: 42, efficiency: 82, integrityFlags: [] },
      { label: "m", kind: "typing", accuracy: 89, speedWpm: 41, efficiency: 81, integrityFlags: [] },
    ]);
    expect(mid.band).toBe("Proficient");
    const weak = scoreModules(track as never, [
      { label: "m", kind: "typing", accuracy: 55, speedWpm: 20, efficiency: 30, integrityFlags: ["flagged"] },
      { label: "m", kind: "typing", accuracy: 56, speedWpm: 21, efficiency: 32, integrityFlags: [] },
      { label: "m", kind: "typing", accuracy: 54, speedWpm: 19, efficiency: 28, integrityFlags: [] },
    ]);
    expect(weak.band).toBe("Developing");
  });
  it("efficiency helpers are clamped to 0..100 and neutral for unknown replay ratio", () => {
    expect(typingEfficiency(10, 100)).toBe(80);
    expect(typingEfficiency(500, 10)).toBe(0);
    expect(audioEfficiency(null)).toBe(70);
    expect(audioEfficiency(3)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------

describe("season math (product-day monthly buckets)", () => {
  it("current season matches month with correct boundaries incl. leap years", () => {
    const feb2028 = seasonForDay("2028-02-15");
    expect(feb2028.id).toBe("2028-02");
    expect(feb2028.endDay).toBe("2028-02-29"); // 2028 is a leap year
    const feb2026 = seasonForDay("2026-02-15");
    expect(feb2026.endDay).toBe("2026-02-28");
  });
  it("year rollover works", () => {
    expect(seasonForDay("2026-12-31").id).toBe("2026-12");
    const seasons = recentSeasons(3, Date.parse("2026-01-05T10:00:00Z"));
    expect(seasons.map((s) => s.id)).toEqual(["2026-01", "2025-12", "2025-11"]);
  });
  it("seasonContains uses product day boundaries", () => {
    const s = seasonForDay("2026-08-15");
    expect(seasonContains(s, Date.parse("2026-08-01T00:00:00Z"))).toBe(true); // Aug 1 07:00 WIB
    expect(seasonContains(s, Date.parse("2026-09-01T00:00:00Z"))).toBe(false); // Sep 1 WIB
    void currentSeason;
  });
});

