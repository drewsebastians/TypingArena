import { describe, expect, it } from "vitest";
import { alignSequences, alignWords } from "@/lib/alignment";

describe("alignSequences (Wagner–Fischer)", () => {
  it("matches identical strings fully", () => {
    const { stats } = alignSequences("hello", "hello");
    expect(stats.matches).toBe(5);
    expect(stats.substitutions).toBe(0);
    expect(stats.insertions).toBe(0);
    expect(stats.deletions).toBe(0);
  });

  it("attributes a single insertion locally — no downstream cascade", () => {
    // Positional comparison would call every char after 'X' wrong.
    const expected = "the quick brown fox";
    const typed = "the quicXk brown fox"; // one inserted char
    const { stats } = alignSequences(expected, typed);
    expect(stats.matches).toBe(19); // all reference chars still match
    expect(stats.insertions).toBe(1); // the stray X
    expect(stats.substitutions + stats.deletions).toBe(0);
  });

  it("attributes a single deletion locally", () => {
    const { stats } = alignSequences("abcdefgh", "acdefgh"); // 'b' deleted
    expect(stats.matches).toBe(7);
    expect(stats.deletions).toBe(1);
  });

  it("handles substitution as sub not ins+del when equal cost", () => {
    const { ops } = alignSequences("cat", "car");
    const subs = ops.filter((o) => o.type === "substitute");
    expect(subs).toHaveLength(1);
    expect(subs[0]).toMatchObject({ expected: "t", typed: "r" });
  });

  it("empty inputs", () => {
    expect(alignSequences("", "").stats.matches).toBe(0);
    expect(alignSequences("abc", "").stats.deletions).toBe(3);
    expect(alignSequences("", "abc").stats.insertions).toBe(3);
  });
});

describe("alignWords", () => {
  it("survives a missing word without cascading", () => {
    const ref = ["the", "meeting", "starts", "at", "nine"];
    const typed = ["the", "starts", "at", "nine"];
    const { matchedRef } = alignWords(ref, typed);
    expect(matchedRef).toEqual([true, false, true, true, true]);
  });

  it("counts matched typed words", () => {
    const { matchedTypedCount } = alignWords(["a", "b", "c"], ["a", "x", "b", "c"]);
    expect(matchedTypedCount).toBe(3); // a,b,c matched; x unmatched
  });
});
