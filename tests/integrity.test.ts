import { describe, expect, it } from "vitest";
import { classifyIntegrity, detectBurst } from "@/lib/integrity";

describe("burst detection", () => {
  it("11 keys within 400ms is a burst", () => {
    const times = Array.from({ length: 11 }, (_, i) => i * 30); // span 300ms
    expect(detectBurst(times)).toBe(true);
  });

  it("human-ish cadence (>=40ms/char) is not a burst", () => {
    const times = Array.from({ length: 60 }, (_, i) => i * 45);
    expect(detectBurst(times)).toBe(false);
  });

  it("fewer than 11 events never bursts", () => {
    expect(detectBurst([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(false);
  });

  it("detects window anywhere in stream (not just the start)", () => {
    const times: number[] = [];
    for (let i = 0; i < 20; i++) times.push(i * 100); // calm
    times.push(2000, 2010, 2020, 2030, 2040, 2050, 2060, 2070, 2080, 2090, 2100); // burst at end
    expect(detectBurst(times)).toBe(true);
  });
});

describe("integrity classification", () => {
  const base = { pasteDetected: false, focusLostCount: 0, burstDetected: false, durationSec: 30 };
  it("clean attempt is ranked", () => {
    expect(classifyIntegrity(base).state).toBe("ranked");
  });
  it("paste flags", () => {
    const v = classifyIntegrity({ ...base, pasteDetected: true });
    expect(v.state).toBe("flagged");
    expect(v.reasons).toContain("paste");
  });
  it("impossible burst flags with reason", () => {
    const v = classifyIntegrity({ ...base, burstDetected: true });
    expect(v.state).toBe("flagged");
    expect(v.reasons).toContain("impossible_typing_burst");
  });
  it(">2 focus losses flag; 1 on short test stays ranked; 1 on long test demotes to practice", () => {
    expect(classifyIntegrity({ ...base, focusLostCount: 3 }).state).toBe("flagged");
    expect(classifyIntegrity({ ...base, focusLostCount: 1, durationSec: 15 }).state).toBe("ranked");
    const v = classifyIntegrity({ ...base, focusLostCount: 1, durationSec: 60 });
    expect(v.state).toBe("practice");
    expect(v.reasons).toContain("focus_lost");
  });
  it("challenge metadata mismatch flags", () => {
    const v = classifyIntegrity({ ...base, challengeValid: false });
    expect(v.state).toBe("flagged");
  });
});
