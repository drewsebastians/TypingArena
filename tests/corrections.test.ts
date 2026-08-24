import { describe, expect, it } from "vitest";
import { CorrectionTracker } from "@/lib/corrections";

describe("CorrectionTracker semantics", () => {
  it("correct then wrong-then-fixed yields corrected=1 uncorrected=0", () => {
    const t = new CorrectionTracker();
    t.push("a", "a", 100);
    t.push("b", "x", 200); // error
    const removed = t.backspace(350);
    expect(removed).toMatchObject({ expected: "b", typed: "x" });
    t.push("b", "b", 400); // retype correctly
    const s = t.summarize();
    expect(s.rawErrorEvents).toBe(1);
    expect(s.correctedErrors).toBe(1);
    expect(s.uncorrectedErrors).toBe(0);
    expect(s.productiveBackspaces).toBe(1);
    expect(s.correctionLatencyMsAvg).toBe(150);
  });

  it("wrong char never fixed counts as uncorrected only", () => {
    const t = new CorrectionTracker();
    t.push("a", "a", 0);
    t.push("b", "z", 100);
    const s = t.summarize();
    expect(s.uncorrectedErrors).toBe(1);
    expect(s.correctedErrors).toBe(0);
    expect(s.backspaceActions).toBe(0);
  });

  it("backspacing a CORRECT char is neutral — cannot inflate errors", () => {
    const t = new CorrectionTracker();
    t.push("a", "a", 0);
    t.push("b", "b", 100);
    t.backspace(200); // rethink: removed correct 'b'
    t.push("b", "b", 300);
    const s = t.summarize();
    expect(s.correctedErrors).toBe(0);
    expect(s.neutralBackspaces).toBe(1);
    expect(s.productiveBackspaces).toBe(0);
    expect(s.uncorrectedErrors).toBe(0);
  });

  it("repeated backspacing on empty buffer is bounded and honest", () => {
    const t = new CorrectionTracker();
    t.backspace(10);
    t.backspace(20);
    const s = t.summarize();
    expect(s.backspaceActions).toBe(2);
    expect(s.correctedErrors + s.uncorrectedErrors).toBe(0);
  });

  it("immediate correction detected when backspace follows the wrong push directly", () => {
    const t = new CorrectionTracker();
    t.push("a", "a", 0);
    t.push("b", "x", 100);
    expect(t.wasLastEventAPush()).toBe(true);
    const removed = t.backspace(150);
    t.noteImmediateCorrectionIfWrong(removed!);
    // after pop, last event is no longer a push
    expect(t.wasLastEventAPush()).toBe(false);
    const s = t.summarize();
    expect(s.immediateCorrections).toBe(1);
    expect(s.correctionLatencyMsAvg).toBe(50);
  });

  it("latency max tracks the slowest correction", () => {
    const t = new CorrectionTracker();
    t.push("a", "x", 0);
    t.backspace(500); // latency 500
    t.push("b", "y", 600);
    t.backspace(700); // latency 100
    expect(t.summarize().correctionLatencyMsMax).toBe(500);
  });
});
