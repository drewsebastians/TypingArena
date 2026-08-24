// Continuous test stream — deterministic replenishing passage model.
//
// Timed tests MUST remain active for their configured duration regardless of
// how fast the user types. Instead of one short passage, the engine types
// through an effectively endless stream assembled deterministically from the
// reviewed corpus (seeded Fisher–Yates shuffle, cycled with re-shuffles).
// Same (poolId, seed) => same stream, so Daily Arena streams are identical for
// everyone. No runtime generation — only ordering of pre-reviewed content.

export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(arr: readonly T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export class TestStream {
  private parts: string[] = [];
  private cycles = 0;

  constructor(
    private readonly pool: readonly { id: string; text: string }[],
    seed: string,
    private readonly minBufferSize = 600,
  ) {
    if (pool.length === 0) throw new Error("TestStream requires a non-empty corpus pool");
    this.rand = mulberry32(hashSeed(seed));
    this.appendCycle();
  }

  private rand: () => number;

  /** Total characters currently materialized (extends lazily). */
  get length(): number {
    return this.parts.join("").length;
  }

  /** Character at absolute position (extends buffer as needed). */
  charAt(pos: number): string {
    this.ensure(pos + this.minBufferSize);
    return this.parts.join("")[pos] ?? "";
  }

  /** A window of the stream [start, start+len). */
  slice(start: number, len: number): string {
    this.ensure(start + len);
    return this.parts.join("").slice(start, start + len);
  }

  /** Read up to n chars without extending far beyond pos (for rendering). */
  ensure(uptoPos: number): void {
    let s = this.parts.join("");
    while (s.length < uptoPos) {
      this.appendCycle();
      s = this.parts.join("");
    }
  }

  private appendCycle(): void {
    // Re-shuffle each cycle so repeats are never adjacent-identical forever,
    // while remaining fully deterministic for a given seed.
    const order = shuffled(this.pool, this.rand);
    this.parts.push((this.cycles++ === 0 ? "" : " ") + order.map((x) => x.text).join(" "));
  }
}

/**
 * Estimate how many characters a target duration could consume at a fast pace
 * (used to sanity-check pool size in tests, not to cap streams — streams are
 * endless by design).
 */
export function charsNeededForDuration(durationSec: number, wpm = 180): number {
  return Math.ceil((wpm * 5 * durationSec) / 60) + 200;
}
