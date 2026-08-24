import { describe, expect, it } from "vitest";
import { TestStream, charsNeededForDuration, hashSeed } from "@/lib/stream";
import { ENGLISH_CORPUS } from "@/lib/content/english";

const pool = ENGLISH_CORPUS.filter((c) => c.mode === "sprint");

describe("TestStream — continuous timed tests", () => {
  it("same seed produces identical stream", () => {
    const a = new TestStream(pool, "daily-2026-08-24");
    const b = new TestStream(pool, "daily-2026-08-24");
    expect(a.slice(0, 500)).toBe(b.slice(0, 500));
  });

  it("different seeds produce different streams", () => {
    const a = new TestStream(pool, "seed-A");
    const b = new TestStream(pool, "seed-B");
    expect(a.slice(0, 400)).not.toBe(b.slice(0, 400));
  });

  it("extends far beyond the pool size (5-minute endurance)", () => {
    // A fast typist (180 WPM) consumes ~4.7k chars in 300s — the endless
    // stream must supply it without exhausting the pool.
    const need = charsNeededForDuration(300);
    expect(need).toBeGreaterThan(4_000);
    const s = new TestStream(pool, "endurance-test", 200);
    const text = s.slice(0, need + 100);
    expect(text.length).toBeGreaterThanOrEqual(need + 100);
    const poolChars = pool.reduce((n, c) => n + c.text.length, 0);
    expect(text.length).toBeGreaterThan(poolChars); // multiple cycles deep
  });

  it("charAt is consistent with slice", () => {
    const s = new TestStream(pool, "consistency");
    for (let i = 0; i < 200; i += 7) {
      expect(s.charAt(i)).toBe(s.slice(Math.max(0, i - 3), 10)[Math.max(0, i - 3) === 0 ? i : 3]);
    }
  });

  it("stream content only contains corpus words plus joining spaces", () => {
    const s = new TestStream(pool, "purity-check");
    let text = s.slice(0, 2000);
    // Drop the trailing partial word at the window boundary.
    text = text.slice(0, text.lastIndexOf(" "));
    const words = text.split(" ").filter(Boolean);
    const vocab = new Set(pool.flatMap((c) => c.text.split(" ")));
    for (const w of words) expect(vocab.has(w)).toBe(true);
  });

  it("hashSeed is deterministic and well distributed enough", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
    expect(hashSeed("abc")).not.toBe(hashSeed("abd"));
  });
});
