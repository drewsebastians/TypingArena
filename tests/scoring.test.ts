import { describe, expect, it } from "vitest";
import {
  calcCpm,
  calcWpm,
  effectiveWpm,
  netWpm,
  normalizeTextForScoring,
  punctuationAccuracyPercent,
  strictSimilarityPercent,
  typedScopeAccuracy,
  wordAccuracyPercent,
} from "@/lib/scoring";

describe("WPM formulas", () => {
  it("gross WPM = chars/5/minutes", () => {
    // 300 chars in 60s => 60 wpm
    expect(calcWpm(300, 60_000)).toBe(60);
    // 100 chars in 15s => 80 wpm
    expect(calcWpm(100, 15_000)).toBe(80);
  });
  it("zero elapsed is safe", () => {
    expect(calcWpm(300, 0)).toBe(0);
    expect(calcCpm(300, 0)).toBe(0);
  });
  it("net WPM subtracts uncorrected errors", () => {
    expect(netWpm(300, 10, 60_000)).toBe(58); // (300-10)/5
    expect(netWpm(20, 50, 60_000)).toBe(0); // floor at zero
  });
  it("effective wpm uses completion time", () => {
    expect(effectiveWpm(250, 30_000)).toBe(100);
  });
});

describe("typed-scope accuracy — untyped text must NOT be penalized", () => {
  it("typing the first 10 chars of a 500-char passage correctly = 100%", () => {
    const typed = "a".repeat(10);
    expect(typedScopeAccuracy(10, 10)).toBe(100);
    void typed;
  });

  it("errors only in typed scope reduce accuracy proportionally", () => {
    // 8 correct out of 10 typed
    expect(typedScopeAccuracy(8, 10)).toBe(80);
  });

  it("nothing typed yields 0 (not a fake perfect score)", () => {
    expect(typedScopeAccuracy(0, 0)).toBe(0);
  });
});

describe("normalization v2", () => {
  it("lowercases and strips punctuation by default", () => {
    expect(normalizeTextForScoring("Hello, World! It's fine.")).toBe("hello world its fine");
  });

  it("collapses whitespace incl. newlines", () => {
    expect(normalizeTextForScoring("a\n b\t c")).toBe("a b c");
  });

  it("unicode NFC composition treats decomposed accents equal", () => {
    const composed = "café";
    const decomposed = "cafe\u0301";
    expect(normalizeTextForScoring(composed)).toBe(normalizeTextForScoring(decomposed));
  });

  it("Indonesian text passes through safely (no apostrophe surprises)", () => {
    expect(normalizeTextForScoring("Rapat dimulai pukul sembilan pagi.")).toBe(
      "rapat dimulai pukul sembilan pagi",
    );
  });

  it("case-sensitive mode preserves case", () => {
    expect(normalizeTextForScoring("Hello", { caseSensitive: true, punctSensitive: true })).toBe("Hello");
  });
});

describe("aligned similarity metrics", () => {
  it("strict similarity penalizes insertions without cascade", () => {
    // 19 matches + 1 insertion; denom = 20 → 95
    expect(strictSimilarityPercent("the quick brown fox", "the quicXk brown fox")).toBe(95);
  });

  it("identical strings are 100", () => {
    expect(strictSimilarityPercent("same", "same")).toBe(100);
  });

  it("word accuracy uses alignment not position", () => {
    const ref = "the meeting starts at nine sharp today";
    const typed = "the starts at nine sharp today"; // missing 'meeting'
    const expected = Math.round((6 / 7) * 1000) / 10; // 85.7
    expect(wordAccuracyPercent(ref, typed, true)).toBe(expected);
  });

  it("normalized word accuracy ignores case/punct", () => {
    expect(wordAccuracyPercent("Hello, World!", "hello world", true)).toBe(100);
  });

  it("punctuation accuracy counts punct-bearing positions", () => {
    const ref = "Stop! Wait, go.";
    const typed = "Stop Wait go"; // missing all punctuation
    expect(punctuationAccuracyPercent(ref, typed)).toBe(0);
    expect(punctuationAccuracyPercent(ref, "Stop! Wait, go.")).toBe(100);
  });

  it("punctuation accuracy returns null when reference has none", () => {
    expect(punctuationAccuracyPercent("no marks here", "no marks here")).toBeNull();
  });
});
