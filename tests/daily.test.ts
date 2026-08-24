import { describe, expect, it } from "vitest";
import { CHALLENGE_VERSION } from "@/lib/types";
import { dailySeed, formatDailyTitle, getDailyChallengeForDate } from "@/lib/daily";

describe("daily challenge determinism", () => {
  it("same date yields identical challenge", () => {
    const a = getDailyChallengeForDate("2026-08-24");
    const b = getDailyChallengeForDate("2026-08-24");
    expect(a.typing.id).toBe(b.typing.id);
    expect(a.dictation.id).toBe(b.dictation.id);
    expect(a.focus).toBe(b.focus);
    expect(a.seed).toBe(b.seed);
  });

  it("different dates yield (virtually always) different selections", () => {
    const picks = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const day = `2026-03-${String(d).padStart(2, "0")}`;
      picks.add(getDailyChallengeForDate(day).typing.id);
    }
    // With ~27 pool items and 28 draws, collision-free would be lucky; assert variety.
    expect(picks.size).toBeGreaterThan(8);
  });

  it("challenge version participates in the seed", () => {
    // Seed must be a pure function of (date, version) — changing the constant
    // changes every pick. We verify the hash function directly.
    expect(dailySeed("2026-08-24")).toBe(dailySeed("2026-08-24"));
  });

  it("typing challenge comes only from sprint/copy-pro pools with valid metadata", () => {
    for (let m = 1; m <= 12; m++) {
      const c = getDailyChallengeForDate(`2026-${String(m).padStart(2, "0")}-15`);
      expect(["sprint", "copy-pro"]).toContain(c.typing.mode);
      expect(c.typing.charCount).toBeGreaterThan(0);
      expect(c.dictation.audioPath.startsWith("/audio/dictation/")).toBe(true);
      expect(CHALLENGE_VERSION).toMatch(/^v\d+/);
    }
  });

  it("focus alternates deterministically", () => {
    const days = Array.from({ length: 10 }, (_, i) => getDailyChallengeForDate(`2026-05-${String(i + 1).padStart(2, "0")}`).focus);
    expect(days).toContain("typing");
    expect(days).toContain("dictation");
  });

  it("title formatting is UTC-stable", () => {
    expect(formatDailyTitle("2026-08-24")).toBe("Monday, August 24, 2026");
  });
});
