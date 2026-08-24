// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TypingEngine from "@/components/TypingEngine";
import type { CorpusItem } from "@/lib/types";

function corpusItem(id: string, text: string): CorpusItem {
  return {
    id, text, language: "en", mode: "sprint", difficulty: "easy",
    source: "test", tags: [], charCount: text.length,
    wordCount: text.trim().split(/\s+/).length, punctuationTypes: [],
  };
}

// One SHORT item: completing it must NOT end a timed test.
const POOL = [corpusItem("tiny-001", "alpha bravo charlie")];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function typeText(text: string) {
  const input = document.querySelector('input[aria-label^="Type here"]') as HTMLInputElement;
  for (const ch of text) {
    fireEvent.keyDown(input, { key: ch });
  }
}

describe("TypingEngine — timed-test semantics", () => {
  it("timer does not start until the first printable key", () => {
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={15} exerciseId="t1" />);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText("15s")).toBeInTheDocument(); // untouched clock
    const input = document.querySelector('input[aria-label^="Type here"]') as HTMLInputElement;
    fireEvent.keyDown(input, { key: "a" });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("14s")).toBeInTheDocument();
  });

  it("completing the entire first passage does NOT end the test", () => {
    const onComplete = vi.fn();
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={30} exerciseId="t2" onComplete={onComplete} />);
    // Type through TWO full cycles of the single-item pool.
    typeText("alpha bravo charlie");
    act(() => { vi.advanceTimersByTime(2000); });
    typeText(" alpha bravo charlie");
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.queryByText(/Time!/)).toBeNull();
  });

  it("finishes exactly at the configured duration (clamped elapsed)", () => {
    const onComplete = vi.fn();
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={15} exerciseId="t3" onComplete={onComplete} />);
    const input = document.querySelector('input[aria-label^="Type here"]') as HTMLInputElement;
    act(() => { vi.advanceTimersByTime(1000); }); // pre-start drift ignored
    fireEvent.keyDown(input, { key: "a" });
    act(() => { vi.advanceTimersByTime(14_000); });
    expect(onComplete).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1200); });
    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result.elapsedMs).toBeLessThanOrEqual(15_000);
    expect(result.elapsedMs).toBeGreaterThan(14_800);
    expect(result.durationSec).toBe(15);
  });

  it("accuracy counts ONLY typed scope; untyped future text is never an error", () => {
    const onComplete = vi.fn();
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={10} exerciseId="t4" onComplete={onComplete} />);
    typeText("alpha"); // 5 correct chars out of a much longer endless stream
    act(() => { vi.advanceTimersByTime(10_100); });
    const result = onComplete.mock.calls[0][0];
    expect(result.accuracy).toBe(100);
    expect(result.typedChars).toBe(5);
    expect(result.correctChars).toBe(5);
    expect(result.uncorrectedErrors).toBe(0);
  });

  it("wrong-then-backspace-then-right counts as corrected, not uncorrected", () => {
    const onComplete = vi.fn();
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={10} exerciseId="t5" onComplete={onComplete} />);
    const input = document.querySelector('input[aria-label^="Type here"]') as HTMLInputElement;
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "l" });
    fireEvent.keyDown(input, { key: "X" }); // wrong (expected 'p')
    fireEvent.keyDown(input, { key: "Backspace" });
    fireEvent.keyDown(input, { key: "p" });
    fireEvent.keyDown(input, { key: "h" });
    fireEvent.keyDown(input, { key: "a" });
    act(() => { vi.advanceTimersByTime(10_100); });
    const result = onComplete.mock.calls[0][0];
    expect(result.correctedErrors).toBe(1);
    expect(result.uncorrectedErrors).toBe(0);
    expect(result.rawErrorEvents).toBe(1);
    expect(result.correctionLatencyMsAvg).not.toBeNull();
  });

  it("paste is blocked and flags integrity", () => {
    const onComplete = vi.fn();
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={10} exerciseId="t6" onComplete={onComplete} />);
    const input = document.querySelector('input[aria-label^="Type here"]') as HTMLInputElement;
    typeText("alpha");
    fireEvent.paste(input, { clipboardData: { getData: () => "bravo" } });
    act(() => { vi.advanceTimersByTime(10_100); });
    const result = onComplete.mock.calls[0][0];
    expect(result.pasteDetected).toBe(true);
    expect(result.integrity).toBe("flagged");
    expect(result.integrityReasons).toContain("paste");
  });

  it("result records scoring version + exercise identity (reproducibility)", () => {
    const onComplete = vi.fn();
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={10} exerciseId="daily-2026-08-24" challengeDate="2026-08-24" onComplete={onComplete} />);
    typeText("al");
    act(() => { vi.advanceTimersByTime(10_100); });
    const r = onComplete.mock.calls[0][0];
    expect(r.scoringVersion).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(r.exerciseId).toBe("daily-2026-08-24");
    expect(r.challengeDate).toBe("2026-08-24");
    expect(r.timestamp).toBeGreaterThan(0);
  });

  it("result is persisted to local history", async () => {
    render(<TypingEngine pool={POOL} language="en" mode="sprint" durationSec={10} exerciseId="t8" />);
    typeText("alph");
    act(() => { vi.advanceTimersByTime(10_100); });
    const raw = localStorage.getItem("ta:typing_history_v2");
    expect(raw).not.toBeNull();
    const arr = JSON.parse(raw!);
    expect(arr[0].typedChars).toBe(4);
  });
});
