// Audio playback analytics — real measured playback, no nominal durations.
//
// Pure reducer core (`reducePlayback`) is unit-testable without a DOM; the
// `PlaybackTracker` class wires HTMLMediaElement events onto it.
//
// Semantics:
//   - playCount includes the FIRST play; replayCount = playCount - 1.
//   - playedSeconds accumulates actual audible time via timeupdate forward
//     deltas — partial plays contribute only what was actually heard; backward
//     jumps (rewinds) reset the baseline without subtracting.
//   - pauseCount increments on pause events caused by user or end-of-media
//     after playback began.
//   - seekCount counts seeks made during/after first play.
//   - uniqueClipSeconds is the REAL media duration once metadata loads.
//   - replayRatio = playedSeconds / uniqueClipSeconds (null until duration known).

export interface PlaybackState {
  playCount: number;
  playedSeconds: number;
  pauseCount: number;
  seekCount: number;
  uniqueClipSeconds: number;
  hasStartedOnce: boolean;
  lastKnownTime: number | null;
}

export const initialPlaybackState: PlaybackState = {
  playCount: 0,
  playedSeconds: 0,
  pauseCount: 0,
  seekCount: 0,
  uniqueClipSeconds: 0,
  hasStartedOnce: false,
  lastKnownTime: null,
};

export type PlaybackEvent =
  | { type: "play" }
  | { type: "timeupdate"; currentTime: number }
  | { type: "pause" }
  | { type: "ended" }
  | { type: "seeking"; currentTime: number }
  | { type: "durationchange"; duration: number };

export function reducePlayback(state: PlaybackState, event: PlaybackEvent): PlaybackState {
  switch (event.type) {
    case "play":
      return {
        ...state,
        playCount: state.playCount + 1,
        hasStartedOnce: true,
      };
    case "timeupdate": {
      if (!state.hasStartedOnce || state.lastKnownTime === null) {
        return { ...state, lastKnownTime: event.currentTime };
      }
      // Forward progress always accumulates — long gaps count as real
      // listening (e.g. background-tab throttling). Backward movement is a
      // seek: reset the baseline without subtracting.
      const delta = event.currentTime - state.lastKnownTime;
      if (delta >= 0) {
        return { ...state, lastKnownTime: event.currentTime, playedSeconds: state.playedSeconds + delta };
      }
      return { ...state, lastKnownTime: event.currentTime };
    }
    case "pause":
      return { ...state, pauseCount: state.hasStartedOnce ? state.pauseCount + 1 : state.pauseCount };
    case "ended":
      return state; // 'pause' fires alongside ended for media elements
    case "seeking":
      return { ...state, seekCount: state.hasStartedOnce ? state.seekCount + 1 : state.seekCount };
    case "durationchange": {
      if (Number.isFinite(event.duration) && event.duration > 0) {
        return { ...state, uniqueClipSeconds: event.duration };
      }
      return state;
    }
  }
}

export function playbackSnapshot(state: PlaybackState): {
  playCount: number;
  replayCount: number;
  playedSeconds: number;
  uniqueClipSeconds: number;
  pauseCount: number;
  seekCount: number;
  replayRatio: number | null;
} {
  return {
    playCount: state.playCount,
    replayCount: Math.max(0, state.playCount - 1),
    playedSeconds: Math.round(state.playedSeconds * 10) / 10,
    uniqueClipSeconds: Math.round(state.uniqueClipSeconds * 10) / 10,
    pauseCount: state.pauseCount,
    seekCount: state.seekCount,
    replayRatio:
      state.uniqueClipSeconds > 0 ? Math.round((state.playedSeconds / state.uniqueClipSeconds) * 100) / 100 : null,
  };
}

/** DOM adapter: attach to an HTMLMediaElement and read snapshot() anytime. */
export class PlaybackTracker {
  private state: PlaybackState = { ...initialPlaybackState };

  constructor(private media: HTMLMediaElement) {
    media.addEventListener("play", this.onPlay);
    media.addEventListener("timeupdate", this.onTimeUpdate);
    media.addEventListener("pause", this.onPause);
    media.addEventListener("ended", this.onEnded);
    media.addEventListener("seeking", this.onSeeking);
    media.addEventListener("durationchange", this.onDurationChange);
  }

  private onPlay = () => this.dispatch({ type: "play" });
  private onTimeUpdate = () => this.dispatch({ type: "timeupdate", currentTime: this.media.currentTime });
  private onPause = () => this.dispatch({ type: "pause" });
  private onEnded = () => this.dispatch({ type: "ended" });
  private onSeeking = () => this.dispatch({ type: "seeking", currentTime: this.media.currentTime });
  private onDurationChange = () => this.dispatch({ type: "durationchange", duration: this.media.duration });

  dispatch(event: PlaybackEvent): void {
    this.state = reducePlayback(this.state, event);
  }

  /** Live reducer state (for reactive UIs). */
  rawState(): PlaybackState {
    return this.state;
  }

  snapshot() {
    return playbackSnapshot(this.state);
  }

  detach(): void {
    this.media.removeEventListener("play", this.onPlay);
    this.media.removeEventListener("timeupdate", this.onTimeUpdate);
    this.media.removeEventListener("pause", this.onPause);
    this.media.removeEventListener("ended", this.onEnded);
    this.media.removeEventListener("seeking", this.onSeeking);
    this.media.removeEventListener("durationchange", this.onDurationChange);
  }
}
