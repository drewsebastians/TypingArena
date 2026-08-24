// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DictationEngine from "@/components/DictationEngine";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import { DICTATION_CLIPS, TRANSCRIPTION_CLIPS } from "@/lib/content/dictation";

beforeEach(() => {
  localStorage.clear();
  // jsdom lacks media element implementations — provide no-op play/pause.
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn(() => Promise.resolve()),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => cleanup());

function fire(el: EventTarget, type: string) {
  fireEvent(el as Element, new Event(type));
}

describe("DictationEngine — real playback analytics", () => {
  function setup() {
    const clip = DICTATION_CLIPS[0];
    const onComplete = vi.fn();
    render(<DictationEngine item={clip} onComplete={onComplete} />);
    const audio = document.querySelector("audio") as HTMLAudioElement;
    Object.defineProperty(audio, "duration", { configurable: true, value: 10 });
    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      value: 0,
      writable: true,
    });
    return { clip, onComplete, audio };
  }

  it("initial play is NOT a replay; replay counted only on second play", () => {
    const { onComplete, audio } = setup();
    fire(audio, "play");
    fire(audio, "pause");
    fire(audio, "play");
    const textarea = screen.getByRole("textbox", { name: /your transcription/i });
    fireEvent.change(textarea, { target: { value: "anything" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const r = onComplete.mock.calls[0][0];
    expect(r.playback.playCount).toBe(2);
    expect(r.playback.replayCount).toBe(1);
  });

  it("partial playback contributes only actual seconds; ratio uses real duration", () => {
    const { onComplete, audio } = setup();
    fire(audio, "play"); // baseline at t=0
    audio.currentTime = 4;
    fire(audio, "timeupdate");
    audio.currentTime = 7;
    fire(audio, "timeupdate"); // +3s
    fire(audio, "durationchange");
    const textarea = screen.getByRole("textbox", { name: /your transcription/i });
    fireEvent.change(textarea, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    const r = onComplete.mock.calls[0][0];
    expect(r.playback.playedSeconds).toBeCloseTo(3, 1);
    expect(r.playback.uniqueClipSeconds).toBe(10);
    expect(r.playback.replayRatio).toBeCloseTo(0.3, 2);
  });

  it("pause count is accurate", () => {
    const { onComplete, audio } = setup();
    fire(audio, "play");
    fire(audio, "pause");
    fire(audio, "play");
    fire(audio, "pause");
    const textarea = screen.getByRole("textbox", { name: /your transcription/i });
    fireEvent.change(textarea, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onComplete.mock.calls[0][0].playback.pauseCount).toBe(2);
  });

  it("paste is blocked and flags the attempt", () => {
    const { onComplete, audio } = setup();
    fire(audio, "play");
    const textarea = screen.getByRole("textbox", { name: /your transcription/i });
    fireEvent.change(textarea, { target: { value: "typed" } });
    fireEvent.paste(textarea);
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    const r = onComplete.mock.calls[0][0];
    expect(r.pasteDetected).toBe(true);
    expect(r.integrity).toBe("flagged");
  });

  it("result records normalization + scoring versions (dictation reproducibility)", () => {
    const { onComplete, audio } = setup();
    fire(audio, "play");
    const textarea = screen.getByRole("textbox", { name: /your transcription/i });
    fireEvent.change(textarea, { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    const r = onComplete.mock.calls[0][0];
    expect(r.scoringVersion).toMatch(/^v\d/);
    expect(r.normalizationVersion).toMatch(/^v\d/);
    expect(r.exerciseId).toBe(DICTATION_CLIPS[0].id);
  });

  it("audio src points at the static asset path", () => {
    const { clip, audio } = setup();
    expect(audio.getAttribute("src")).toContain(clip.audioPath);
    expect(clip.audioPath.startsWith("/audio/dictation/")).toBe(true);
  });
});

describe("TranscriptionEngine — long-clip flow", () => {
  it("submit disabled until audio played and text typed; metrics complete after", () => {
    const clip = TRANSCRIPTION_CLIPS.find((c) => c.language === "en")!;
    const onComplete = vi.fn();
    render(<TranscriptionEngine item={clip} onComplete={onComplete} />);
    const audio = document.querySelector("audio") as HTMLAudioElement;
    Object.defineProperty(audio, "duration", { configurable: true, value: 40 });
    Object.defineProperty(audio, "currentTime", { configurable: true, value: 0, writable: true });

    const textarea = screen.getByRole("textbox", { name: /transcribe below/i });
    const submit = screen.getByRole("button", { name: /submit transcription/i });
    expect(submit).toBeDisabled();

    fire(audio, "play");
    audio.currentTime = 30;
    fire(audio, "timeupdate");
    fire(audio, "durationchange");

    fireEvent.change(textarea, { target: { value: "partial transcript" } });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    expect(onComplete).toHaveBeenCalledTimes(1);
    const r = onComplete.mock.calls[0][0];
    expect(r.effectiveWpm).toBeGreaterThan(0);
    expect(r.activeInputMs).toBeGreaterThanOrEqual(0);
    expect(r.playback.uniqueClipSeconds).toBe(40);
    expect(r.difficulty).toBe(clip.difficulty);
  });
});
