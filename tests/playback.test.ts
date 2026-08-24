import { describe, expect, it } from "vitest";
import { initialPlaybackState, playbackSnapshot, reducePlayback } from "@/lib/audioMetrics";

function played(state = initialPlaybackState) {
  return reducePlayback({ ...state }, { type: "play" });
}

describe("playback metrics reducer — real audio analytics", () => {
  it("first play counts as play, NOT replay", () => {
    const s = played();
    expect(s.playCount).toBe(1);
    expect(playbackSnapshot(s).replayCount).toBe(0);
  });

  it("second play increments replay count", () => {
    let s = played();
    s = reducePlayback(s, { type: "pause" });
    s = reducePlayback(s, { type: "play" });
    const snap = playbackSnapshot(s);
    expect(snap.playCount).toBe(2);
    expect(snap.replayCount).toBe(1);
  });

  it("partial playback contributes only actual seconds", () => {
    let s = played(); // start at time 0 (lastKnownTime null)
    s = reducePlayback(s, { type: "timeupdate", currentTime: 3.5 }); // first reading sets baseline
    s = reducePlayback(s, { type: "timeupdate", currentTime: 6.0 }); // +2.5s
    s = reducePlayback(s, { type: "pause" });
    s = reducePlayback(s, { type: "play" }); // replay
    s = reducePlayback(s, { type: "timeupdate", currentTime: 8.0 }); // +2.0s
    const snap = playbackSnapshot(s);
    expect(snap.playedSeconds).toBeCloseTo(4.5, 1);
  });

  it("post-seek backward jumps do not add negative time", () => {
    let s = played();
    s = reducePlayback(s, { type: "timeupdate", currentTime: 10 });
    s = reducePlayback(s, { type: "seeking", currentTime: 2 });
    s = reducePlayback(s, { type: "timeupdate", currentTime: 3 }); // delta -7 → ignored
    expect(playbackSnapshot(s).playedSeconds).toBe(0);
    expect(playbackSnapshot(s).seekCount).toBe(1);
  });

  it("long forward gaps still count as listening (background-tab throttling)", () => {
    let s = played();
    s = reducePlayback(s, { type: "timeupdate", currentTime: 5 }); // baseline
    s = reducePlayback(s, { type: "timeupdate", currentTime: 60 });
    const snap = playbackSnapshot(s);
    expect(snap.playedSeconds).toBeCloseTo(55, 1); // observed forward progress
  });

  it("unobserved lead-in before the first reading is not counted", () => {
    let s = played();
    s = reducePlayback(s, { type: "timeupdate", currentTime: 5 });
    expect(playbackSnapshot(s).playedSeconds).toBe(0);
  });

  it("pause counted only after playback started", () => {
    const before = reducePlayback(initialPlaybackState, { type: "pause" });
    expect(before.pauseCount).toBe(0);
    const after = reducePlayback(played(), { type: "pause" });
    expect(after.pauseCount).toBe(1);
  });

  it("replay ratio uses real clip duration once known", () => {
    let s = played();
    s = reducePlayback(s, { type: "durationchange", duration: 30 });
    s = reducePlayback(s, { type: "timeupdate", currentTime: 15 }); // baseline
    s = reducePlayback(s, { type: "timeupdate", currentTime: 30 }); // +15s
    const snap = playbackSnapshot(s);
    expect(snap.uniqueClipSeconds).toBe(30);
    expect(snap.playedSeconds).toBeCloseTo(15, 0);
    expect(snap.replayRatio).toBeCloseTo(0.5, 1);
  });

  it("ratio is null before media metadata loads", () => {
    const snap = playbackSnapshot(played());
    expect(snap.replayRatio).toBeNull();
  });
});
