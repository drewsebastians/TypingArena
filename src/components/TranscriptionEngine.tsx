"use client";
// Transcription engine — full-length clips with real playback + input analytics.
//
// Tracks: strict/normalized/word/punct accuracy, effective WPM, active typing
// time, corrections, play/replay counts, actual seconds heard, pause count,
// seek count, replay ratio. History persists locally; ranked attempts sync to
// the shared backend when the user is signed in.

import { useCallback, useEffect, useRef, useState } from "react";
import type { TranscriptionItem, TranscriptionResult } from "@/lib/types";
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
import { saveTranscriptionResult } from "@/lib/history";
import { track } from "@/lib/analytics";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function TranscriptionEngine({
  item,
  onComplete,
}: {
  item: TranscriptionItem;
  onComplete?: (r: TranscriptionResult) => void;
}) {
  const [typed, setTyped] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({ ...initialPlaybackState });
  const [submitted, setSubmitted] = useState<TranscriptionResult | null>(null);
  const [pasteFlag, setPasteFlag] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [corrections, setCorrections] = useState(0);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const trackerRef = useRef<PlaybackTracker | null>(null);
  const firstPlayAtRef = useRef<number | null>(null);
  const firstInputAtRef = useRef<number | null>(null);
  const lastInputAtRef = useRef<number | null>(null);
  const activeInputMsRef = useRef(0);

  useEffect(() => {
    track("transcription_start", { language: item.language, exerciseId: item.id });
    const timer = window.setInterval(() => {
      if (firstPlayAtRef.current !== null && !submitted) {
        setElapsedSec(Math.round((Date.now() - firstPlayAtRef.current) / 1000));
      }
    }, 500);
    return () => {
      window.clearInterval(timer);
      audioElRef.current?.pause();
      trackerRef.current?.detach();
    };
  }, [item.id, item.language, submitted]);

  const attachAudio = useCallback((el: HTMLAudioElement | null) => {
    if (!el || audioElRef.current === el) return;
    audioElRef.current = el;
    trackerRef.current?.detach();
    trackerRef.current = new PlaybackTracker(el);
  }, []);

  const syncPlayback = () => {
    if (trackerRef.current) setPlayback(trackerRef.current.rawState());
  };

  // First observed playback marks the completion-clock origin, regardless of
  // whether play was triggered by the button or the media element itself.
  useEffect(() => {
    if (playback.playCount > 0 && firstPlayAtRef.current === null) {
      firstPlayAtRef.current = Date.now();
    }
  }, [playback.playCount]);

  const handlePlayPause = () => {
    const audio = audioElRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (playback.playCount === 0) track("audio_play", { exerciseId: item.id, first: true });
      else track("transcription_replay", { exerciseId: item.id });
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
      track("transcription_pause", { exerciseId: item.id });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    const val = e.target.value;
    // Active input time: accumulate keystroke gaps <= 5s only.
    if (firstInputAtRef.current === null) firstInputAtRef.current = now;
    if (lastInputAtRef.current !== null) {
      const gap = now - lastInputAtRef.current;
      if (gap <= 5000) activeInputMsRef.current += gap;
    }
    lastInputAtRef.current = now;
    if (val.length < typed.length) setCorrections((c) => c + Math.min(typed.length - val.length, 50));
    setTyped(val);
  };

  const handleSubmit = () => {
    const audio = audioElRef.current;
    const snap =
      trackerRef.current?.snapshot() ?? {
        playCount: 0,
        replayCount: 0,
        playedSeconds: 0,
        uniqueClipSeconds: 0,
        pauseCount: 0,
        seekCount: 0,
        replayRatio: null as number | null,
      };
    if (!audio || firstPlayAtRef.current === null || snap.playCount === 0) return;

    const completionMs = Date.now() - firstPlayAtRef.current;
    const strict = strictSimilarityPercent(item.transcript, typed);
    const normalized = strictSimilarityPercent(normalizeTextForScoring(item.transcript), normalizeTextForScoring(typed));
    const wAcc = wordAccuracyPercent(item.transcript, typed, true);
    const punctAcc = punctuationAccuracyPercent(item.transcript, typed);

    const reasons: string[] = [];
    if (pasteFlag) reasons.push("paste");
    const integrity = pasteFlag ? "flagged" : "ranked";

    const res: TranscriptionResult = {
      id: newId(),
      language: item.language,
      strictScore: strict,
      normalizedScore: normalized,
      wordAccuracy: wAcc,
      punctuationAccuracy: punctAcc,
      effectiveWpm: effectiveWpm(typed.trim().length, completionMs),
      activeTypingWpm: activeInputMsRef.current > 1000 ? effectiveWpm(typed.trim().length, activeInputMsRef.current) : null,
      completionMs,
      activeInputMs: Math.round(activeInputMsRef.current),
      playback: {
        playCount: snap.playCount,
        replayCount: snap.replayCount,
        playedSeconds: Math.round(snap.playedSeconds * 100) / 100,
        uniqueClipSeconds: Math.round(snap.uniqueClipSeconds * 100) / 100,
        pauseCount: snap.pauseCount,
        seekCount: snap.seekCount,
        replayRatio: snap.replayRatio,
      },
      corrections,
      pasteDetected: pasteFlag,
      integrity,
      integrityReasons: reasons,
      exerciseId: item.id,
      exerciseVersion: "v2",
      scoringVersion: SCORING_VERSION,
      normalizationVersion: "v2.0.0",
      difficulty: item.difficulty,
      timestamp: Date.now(),
    };
    saveTranscriptionResult(res);
    setSubmitted(res);
    onComplete?.(res);
    audio.pause();
    track("transcription_complete", { language: item.language, normalized, wordAccuracy: wAcc, replayRatio: res.playback.replayRatio });
    if (pasteFlag) track("paste_detected", { source: "transcription" });
    if (integrity !== "ranked") track("session_unranked", { reason: reasons.join(",") });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-black">Transcription Result</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Strict" value={`${submitted.strictScore}%`} />
          <Metric label="Normalized" value={`${submitted.normalizedScore}%`} />
          <Metric label="Word Acc" value={`${submitted.wordAccuracy}%`} />
          <Metric label="Punct Acc" value={submitted.punctuationAccuracy === null ? "—" : `${submitted.punctuationAccuracy}%`} />
          <Metric label="Effective WPM" value={String(submitted.effectiveWpm)} />
          <Metric label="Completion" value={`${Math.round(submitted.completionMs / 1000)}s`} />
        </div>
        <div className="mt-3 rounded-lg border bg-white p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          Played {submitted.playback.playCount}× ({submitted.playback.replayCount} replays) • heard{" "}
          {submitted.playback.playedSeconds}s of {submitted.playback.uniqueClipSeconds}s • replay ratio{" "}
          {submitted.playback.replayRatio ?? "—"}× • pauses {submitted.playback.pauseCount} • seeks {submitted.playback.seekCount} •
          corrections {submitted.corrections} • active typing {Math.round(submitted.activeInputMs / 1000)}s
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Compare transcript</summary>
          <div className="mt-2 font-mono text-sm"><span className="text-zinc-500">Reference:</span> {item.transcript}</div>
        </details>
        <button onClick={() => window.location.reload()} className="mt-4 rounded-full border px-5 py-2 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Next clip ↻
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <audio
          ref={attachAudio}
          src={`${BASE_PATH}${item.audioPath}`}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={syncPlayback}
          onSeeked={syncPlayback}
        />
        <button
          onClick={handlePlayPause}
          className={`rounded-full px-6 py-3 text-sm font-bold ${playing ? "bg-zinc-300 text-zinc-700" : "bg-black text-white dark:bg-white dark:text-black"}`}
          aria-label={playing ? "pause clip" : "play clip"}
        >
          {playing ? "⏸ Pause" : "▶ Play clip"}
        </button>
        <span className="text-xs text-zinc-500" aria-live="off">
          ⏱ {elapsedSec}s • plays {playback.playCount} • pauses {playback.pauseCount}
        </span>
        <span className="ml-auto text-xs text-zinc-500">{item.language === "en" ? "English" : "Bahasa Indonesia"} • {item.difficulty}</span>
      </div>

      <label htmlFor={`trans-input-${item.id}`} className="mt-4 block text-sm font-medium">Transcribe below</label>
      <textarea
        id={`trans-input-${item.id}`}
        value={typed}
        onChange={handleChange}
        onPaste={(e) => { e.preventDefault(); setPasteFlag(true); track("paste_detected", { source: "transcription" }); }}
        rows={7}
        placeholder="Type everything you hear — punctuation included. Replays are measured."
        className="mt-1 w-full rounded-lg border p-3 font-mono dark:bg-zinc-800"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={handleSubmit} disabled={playback.playCount === 0 || !typed.trim()} className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">
          Submit transcription
        </button>
        {pasteFlag && <span className="text-xs text-red-600">Paste blocked — attempt will be flagged.</span>}
        {!typed.trim() && playback.playCount > 0 && <span className="text-xs text-zinc-500">Start typing to enable submit.</span>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800">
      <div className="text-xs uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
