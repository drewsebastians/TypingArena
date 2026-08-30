"use client";
// Dictation engine v2 — static-audio-first.
//
// Plays pre-generated audio files from /public/audio (see
// src/lib/content/audio-clips.json + scripts/generate-audio.mjs). Playback
// analytics are REAL measurements via PlaybackTracker: initial play counted
// separately from replays, actual played seconds, pause/seek counts, replay
// ratio against the true clip duration.
//
// In local development, if a static file is missing AND the dev TTS fallback is
// enabled, speech synthesis may be used so development can continue without
// regenerating assets. The fallback module is excluded from production builds.

import { useCallback, useEffect, useRef, useState } from "react";
import type { DictationItem, DictationResult } from "@/lib/types";
import { SCORING_VERSION } from "@/lib/types";
import {
  effectiveWpm,
  normalizeTextForScoring,
  punctuationAccuracyPercent,
  strictSimilarityPercent,
  wordAccuracyPercent,
} from "@/lib/scoring";
import { PlaybackTracker, type PlaybackState, initialPlaybackState } from "@/lib/audioMetrics";
import { BASE_PATH } from "@/lib/config";
import { saveDictationResult } from "@/lib/history";
import { audioEvidence, queueAttempt } from "@/lib/sync";
import { track } from "@/lib/analytics";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import ResultSection from "@/components/tool/ResultSection";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function DictationEngine({
  item,
  noiseLevel,
  exerciseId,
  onComplete,
  onLifecycleChange,
  syncPolicy = "local",
}: {
  item: DictationItem;
  noiseLevel?: string;
  /** Overrides the clip id in the persisted result (e.g. assignment binding). */
  exerciseId?: string;
  onComplete?: (r: DictationResult) => void;
  onLifecycleChange?: (state: TaskLifecycle) => void;
  syncPolicy?: "local" | "shared";
}) {
  const [typed, setTyped] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({ ...initialPlaybackState });
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<DictationResult | null>(null);
  const [pasteFlag, setPasteFlag] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const trackerRef = useRef<PlaybackTracker | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const onLifecycleRef = useRef(onLifecycleChange);

  useEffect(() => {
    onLifecycleRef.current = onLifecycleChange;
  }, [onLifecycleChange]);

  useEffect(() => {
    onLifecycleRef.current?.("ready");
    return () => {
      document.documentElement.removeAttribute("data-exercise-active");
      onLifecycleRef.current?.("idle");
    };
  }, [item.id]);

  useEffect(() => {
    if (submitted) {
      document.documentElement.removeAttribute("data-exercise-active");
      onLifecycleRef.current?.("result");
    } else if (startedAt !== null) {
      document.documentElement.setAttribute("data-exercise-active", "");
      onLifecycleRef.current?.("active");
      track("task_started", { task: "dictation", language: item.language });
    } else {
      document.documentElement.removeAttribute("data-exercise-active");
      onLifecycleRef.current?.("ready");
    }
  }, [item.language, startedAt, submitted]);

  useEffect(() => {
    track("dictation_start", { language: item.language, difficulty: item.difficulty, speed: item.speed, exerciseId: item.id });
  }, [item.id, item.language, item.difficulty, item.speed]);

  // React 19 ref-callback cleanup handles detach/pause on unmount.
  const attachAudio = useCallback((el: HTMLAudioElement | null) => {
    if (!el) return;
    const tracker = new PlaybackTracker(el);
    trackerRef.current = tracker;
    audioElRef.current = el;
    return () => {
      tracker.detach();
      el.pause();
      if (trackerRef.current === tracker) trackerRef.current = null;
      if (audioElRef.current === el) audioElRef.current = null;
    };
  }, []);

  const syncPlayback = () => {
    if (trackerRef.current) setPlayback(trackerRef.current.rawState());
  };

  // First observed playback anchors the completion-clock origin regardless of
  // whether play came from the button or the media element itself.
  useEffect(() => {
    if (playback.playCount > 0 && startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      setStartedAt(startedAtRef.current);
    }
  }, [playback.playCount]);

  const handlePlayPause = () => {
    const audio = audioElRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (playback.playCount === 0) track("audio_play", { exerciseId: item.id, first: true });
      else track("audio_replay", { exerciseId: item.id });
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
      track("audio_pause", { exerciseId: item.id });
    }
  };

  const handleReplayFromStart = () => {
    const audio = audioElRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    if (playback.playCount === 0) track("audio_play", { exerciseId: item.id, first: true });
    else track("audio_replay", { exerciseId: item.id });
    void audio.play().catch(() => undefined);
  };

  const handleSubmit = () => {
    const now = Date.now();
    const elapsed = now - (startedAtRef.current ?? now);
    const snap = trackerRef.current?.snapshot() ?? {
      playCount: 0,
      replayCount: 0,
      playedSeconds: 0,
      uniqueClipSeconds: 0,
      pauseCount: 0,
      seekCount: 0,
      replayRatio: null as number | null,
    };
    const strict = strictSimilarityPercent(item.transcript, typed);
    const normalized = strictSimilarityPercent(
      normalizeTextForScoring(item.transcript),
      normalizeTextForScoring(typed),
    );
    const wAcc = wordAccuracyPercent(item.transcript, typed, true);
    const punctAcc = punctuationAccuracyPercent(item.transcript, typed);

    const reasons: string[] = [];
    if (pasteFlag) reasons.push("paste");
    const integrity = pasteFlag ? "flagged" : snap.replayCount > 10 ? "practice" : "ranked";
    if (integrity === "practice") reasons.push("heavy_replay");

    const res: DictationResult = {
      id: newId(),
      language: item.language,
      strictScore: strict,
      normalizedScore: normalized,
      wordAccuracy: wAcc,
      punctuationAccuracy: punctAcc,
      effectiveWpm: effectiveWpm(typed.trim().length, elapsed),
      completionMs: elapsed,
      playback: {
        playCount: snap.playCount,
        replayCount: snap.replayCount,
        playedSeconds: Math.round(snap.playedSeconds * 100) / 100,
        uniqueClipSeconds: Math.round(snap.uniqueClipSeconds * 100) / 100,
        pauseCount: snap.pauseCount,
        seekCount: snap.seekCount,
        replayRatio: snap.replayRatio,
      },
      pasteDetected: pasteFlag,
      integrity,
      integrityReasons: reasons,
      exerciseId: exerciseId ?? item.id,
      exerciseVersion: "v2",
      scoringVersion: SCORING_VERSION,
      normalizationVersion: "v2.0.0",
      noiseLevel,
      timestamp: now,
    };
    saveDictationResult(res);
    onLifecycleRef.current?.("completing");
    if (syncPolicy === "shared") void queueAttempt(audioEvidence(res, "dictation"));
    setSubmitted(res);
    onComplete?.(res);
    audioElRef.current?.pause();
    track("dictation_submit", { language: item.language, exerciseId: item.id });
    track("dictation_complete", {
      strict, normalized, wordAccuracy: wAcc,
      replayCount: res.playback.replayCount, language: item.language,
      integrity,
    });
    track("task_completed", { task: "dictation", language: item.language, integrity });
    if (pasteFlag) track("paste_detected", { source: "dictation" });
    if (integrity !== "ranked") track("session_unranked", { reason: reasons.join(",") });
  };

  /** Dev-only fallback when static audio fails to load. Never in production. */
  const devFallbackSpeak = async () => {
    if (process.env.NODE_ENV === "production") return;
    try {
      const mod = await import("@/lib/ttsDev");
      setPlaying(true);
      mod.speakOnce(item.transcript, item.language, 1.0, () => setPlaying(false));
    } catch {
      /* ignore */
    }
  };

  if (submitted) {
    return (
      <ResultSection title="Dictation result" className="w-full max-w-3xl">
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Strict" value={`${submitted.strictScore}%`} />
          <Metric label="Normalized" value={`${submitted.normalizedScore}%`} />
          <Metric label="Word Acc" value={`${submitted.wordAccuracy}%`} />
          <Metric label="Punct Acc" value={submitted.punctuationAccuracy === null ? "—" : `${submitted.punctuationAccuracy}%`} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${submitted.integrity === "ranked" ? "bg-emerald-100 text-emerald-800" : submitted.integrity === "flagged" ? "bg-red-100 text-red-800" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>
            {submitted.integrity.toUpperCase()}
          </span>
          <span>Effective {submitted.effectiveWpm} WPM</span>
          <span>• plays {submitted.playback.playCount} (replays {submitted.playback.replayCount})</span>
          <span>• heard {submitted.playback.playedSeconds}s of {submitted.playback.uniqueClipSeconds}s</span>
          <span>• ratio {submitted.playback.replayRatio ?? "—"}×</span>
          <span>• pauses {submitted.playback.pauseCount}</span>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Compare transcripts</summary>
          <div className="mt-2 font-mono text-sm"><span className="text-zinc-500">Reference:</span> {item.transcript}</div>
          <div className="mt-1 font-mono text-sm"><span className="text-zinc-500">You typed:</span> {typed || <em>(empty)</em>}</div>
        </details>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">Next clip ↻</button>
      </ResultSection>
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold dark:bg-zinc-800">
          {item.language === "en" ? "ENGLISH" : "BAHASA INDONESIA"} • {item.speed} • {item.difficulty}
        </span>
        <span className="text-xs text-zinc-500">
          plays {playback.playCount} • heard {Math.round(playback.playedSeconds)}s • pauses {playback.pauseCount}
        </span>
      </div>

      {/* Audio controls — no ad placement between prompt and response, ever */}
      <div className="flex flex-col items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800 sm:flex-row sm:items-center">
        <audio
          ref={attachAudio}
          src={`${BASE_PATH}${item.audioPath}`}
          preload="metadata"
          onError={() => setAudioFailed(true)}
          onPlay={() => { setPlaying(true); syncPlayback(); }}
          onPause={() => { setPlaying(false); syncPlayback(); }}
          onTimeUpdate={syncPlayback}
          onSeeked={syncPlayback}
        />
        <button
          onClick={handlePlayPause}
          disabled={audioFailed && process.env.NODE_ENV !== "development"}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow ${playing ? "bg-zinc-300 text-zinc-700" : "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black"}`}
          aria-label={playing ? "pause dictation audio" : "play dictation audio"}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button onClick={handleReplayFromStart} disabled={!startedAt} className="rounded-full border bg-white px-4 py-2.5 text-xs font-semibold dark:bg-zinc-900 disabled:opacity-40" aria-label="replay audio from start">
          ↻ Replay
        </button>
        {audioFailed && (
          <span className="text-xs text-amber-600">
            Static audio failed to load.
            {process.env.NODE_ENV !== "production" ? (
              <button onClick={devFallbackSpeak} className="ml-1 underline">[dev fallback]</button>
            ) : (
              " Please reload; if it persists the asset is missing from this deployment."
            )}
          </span>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Listen and type exactly what you hear — punctuation included. Replays are measured and lower is better while accuracy holds.
        </p>
      </div>

      <label htmlFor={`dictation-input-${item.id}`} className="mt-4 block text-sm font-medium">Your transcription</label>
      <textarea
        id={`dictation-input-${item.id}`}
        ref={inputRef}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onPaste={(e) => { e.preventDefault(); setPasteFlag(true); track("paste_detected", { source: "dictation" }); }}
        rows={3}
        placeholder="Type what you heard..."
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-base dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="mt-3 flex items-center gap-2">
        <button onClick={handleSubmit} disabled={!typed.trim()} className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">Submit</button>
        <button onClick={() => { setTyped(""); inputRef.current?.focus(); }} className="rounded-full border px-4 py-2 text-sm">Clear</button>
        {pasteFlag && <span className="text-xs text-red-600">Paste blocked — attempt will be flagged.</span>}
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <span className="font-semibold">Scoring:</span> Strict (case+punctuation), Normalized (tolerant), Word and Punctuation accuracy. Replay ratio uses real listening time ÷ clip length. Integrity: pasting flags the attempt.
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
      <div className="text-xs uppercase text-zinc-500">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

