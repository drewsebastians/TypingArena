"use client";
// Typing engine v2 — timed tests that behave like timed tests.
//
// Guarantees (verified by tests + E2E):
//  1. Timer starts on the first printable key and the test ends ONLY at the
//     configured duration. Completing one passage never ends a timed test —
//     the stream replenishes endlessly from the reviewed corpus.
//  2. Accuracy is computed over the typed scope only; untouched future text is
//     never counted as an error.
//  3. Corrected / uncorrected errors and correction latency come from precise
//     event tracking (CorrectionTracker), not string heuristics.
//  4. Paste attempts are blocked and flagged; focus loss is counted with
//     de-duplication; impossible bursts are detected.
//
// Rendering is state-driven: refs hold accumulators that are only touched in
// event handlers / timers, never read during render.

import { useCallback, useEffect, useRef, useState } from "react";
import { assembleTypingMetrics, accumulatePerKey, accumulateBigram } from "@/lib/scoring";
import { CorrectionTracker } from "@/lib/corrections";
import { classifyIntegrity, detectBurst } from "@/lib/integrity";
import { TestStream } from "@/lib/stream";
import { saveTypingResult } from "@/lib/history";
import { queueAttempt, typingEvidence } from "@/lib/sync";
import { track } from "@/lib/analytics";
import type { BigramStat, CorpusItem, Language, Mode, PerKeyStat, TypingResult } from "@/lib/types";
import type { TaskLifecycle } from "@/lib/taskLifecycle";

export interface TypingEngineProps {
  /** Pool of reviewed corpus items used to build the continuous stream. */
  pool: CorpusItem[];
  language: Language;
  mode: Mode;
  durationSec: number;
  /** Stable exercise identity for versioning (e.g. daily challenge ref). */
  exerciseId: string;
  exerciseVersion?: string;
  challengeDate?: string;
  onComplete?: (r: TypingResult) => void;
  onLifecycleChange?: (state: TaskLifecycle) => void;
  /** Ordinary practice is local-first. Shared callers opt in explicitly. */
  syncPolicy?: "local" | "shared";
  /** Avoid stealing scroll/focus when the engine is embedded below discovery UI. */
  autoFocus?: boolean;
  /**
   * Advisory progress signal for observers (e.g. multiplayer race UI).
   * Throttled to ~3 updates/sec; never fires after completion. NOT part of
   * scoring — authoritative metrics still come only from onComplete.
   */
  onProgress?: (p: { typedChars: number; correctChars: number; progressPct: number; liveWpm: number; elapsedMs: number }) => void;
}

const WINDOW_BEFORE = 48;
const WINDOW_AFTER = 110;

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface EntryView {
  expected: string;
  typed: string;
}

export default function TypingEngine({
  pool,
  language,
  mode,
  durationSec,
  exerciseId,
  exerciseVersion = "v2",
  challengeDate,
  onComplete,
  onLifecycleChange,
  syncPolicy = "local",
  autoFocus = true,
  onProgress,
}: TypingEngineProps) {
  const [entries, setEntries] = useState<EntryView[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [focusLost, setFocusLost] = useState(0);
  const [pasteFlag, setPasteFlag] = useState(false);

  // Accumulators — mutated in handlers/timers only.
  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const startAtRef = useRef<number | null>(null);
  const trackerRef = useRef(new CorrectionTracker());
  const perKeyRef = useRef<Record<string, PerKeyStat>>({});
  const bigramRef = useRef<Record<string, BigramStat>>({});
  const keystrokeTimesRef = useRef<number[]>([]);
  const focusLostRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastFocusSignalRef = useRef(0);
  const lastProgressSentRef = useRef(0);
  const onProgressRef = useRef(onProgress);
  const onLifecycleRef = useRef(onLifecycleChange);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onLifecycleRef.current = onLifecycleChange;
  }, [onLifecycleChange]);

  useEffect(() => {
    onLifecycleRef.current?.("ready");
    return () => onLifecycleRef.current?.("idle");
  }, [exerciseId]);

  // Deterministic per-session stream (stable identity across renders).
  const [stream] = useState(
    () => new TestStream(pool, `${exerciseId}:${mode}:${language}:${exerciseVersion}`),
  );

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onLifecycleRef.current?.("completing");
    setFinished(true);
    const elapsed = Math.min(durationSec * 1000, Date.now() - (startAtRef.current ?? Date.now()));
    setElapsedMs(elapsed);

    const burstDetected = detectBurst(keystrokeTimesRef.current);
    const verdict = classifyIntegrity({
      pasteDetected: pasteFlag,
      focusLostCount: focusLostRef.current,
      burstDetected,
      durationSec,
    });
    const metrics = assembleTypingMetrics({
      language,
      mode,
      configuredDurationSec: durationSec,
      elapsedMs: elapsed,
      tracker: trackerRef.current,
      perKey: perKeyRef.current,
      bigrams: bigramRef.current,
      burstDetected,
      pasteDetected: pasteFlag,
      focusLostCount: focusLostRef.current,
      exerciseId,
      exerciseVersion,
      id: newId(),
      timestamp: Date.now(),
    });

    const result: TypingResult = {
      id: newId(),
      mode,
      language,
      durationSec,
      elapsedMs: elapsed,
      grossWpm: metrics.grossWpm,
      netWpm: metrics.netWpm,
      cpm: metrics.cpm,
      accuracy: metrics.accuracy,
      correctChars: metrics.correctChars,
      typedChars: metrics.typedChars,
      correctedErrors: metrics.corrections.correctedErrors,
      uncorrectedErrors: metrics.corrections.uncorrectedErrors,
      rawErrorEvents: metrics.corrections.rawErrorEvents,
      backspaceActions: metrics.corrections.backspaceActions,
      immediateCorrections: metrics.corrections.immediateCorrections,
      correctionLatencyMsAvg: metrics.corrections.correctionLatencyMsAvg,
      perKeyErrors: perKeyRef.current,
      bigramErrors: bigramRef.current,
      pasteDetected: pasteFlag,
      focusLostCount: focusLostRef.current,
      integrity: verdict.state,
      integrityReasons: verdict.reasons,
      exerciseId,
      exerciseVersion,
      scoringVersion: metrics.scoringVersion,
      challengeDate,
      challengeVersion: challengeDate ? "v2" : undefined,
      timestamp: Date.now(),
    };
    saveTypingResult(result);
    onLifecycleRef.current?.("result");
    onComplete?.(result);
    // Shared callers opt in; ordinary practice stays entirely local.
    if (syncPolicy === "shared") void queueAttempt(typingEvidence(result));

    track("typing_test_complete", {
      wpm: result.grossWpm,
      accuracy: result.accuracy,
      durationSec,
      language,
      mode,
      integrity: result.integrity,
    });
    track("task_completed", { task: "typing", mode, language, integrity: result.integrity });
    if (result.integrity !== "ranked") track("session_unranked", { reason: verdict.reasons.join(",") });
    if (pasteFlag) track("paste_detected", { source: "typing", durationSec });
    if (burstDetected) track("suspicious_burst_detected", { wpm: result.grossWpm });
  }, [durationSec, language, mode, exerciseId, exerciseVersion, challengeDate, onComplete, pasteFlag, syncPolicy]);

  // Active-exercise focus: secondary chrome visually recedes
  useEffect(() => {
    if (started && !finished) document.documentElement.setAttribute("data-exercise-active", "");
    else document.documentElement.removeAttribute("data-exercise-active");
    return () => document.documentElement.removeAttribute("data-exercise-active");
  }, [started, finished]);

  // Timer — ends the test exactly at the configured duration. The same tick
  // emits throttled (~3/sec) advisory progress for observers.
  useEffect(() => {
    if (!started || finished) return;
    const emitProgress = () => {
      if (!onProgressRef.current) return;
      const now = Date.now();
      if (now - lastProgressSentRef.current < 300) return;
      lastProgressSentRef.current = now;
      const pos = trackerRef.current.length;
      const elapsed = Math.max(1, Date.now() - (startAtRef.current ?? Date.now()));
      onProgressRef.current({
        typedChars: pos,
        correctChars: trackerRef.current.finalEntries().filter((x) => x.typed === x.expected).length,
        progressPct: Math.min(100, Math.round((elapsed / (durationSec * 1000)) * 100)),
        liveWpm: elapsed > 750 ? Math.round(pos / 5 / (elapsed / 60_000)) : 0,
        elapsedMs: elapsed,
      });
    };
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - (startAtRef.current ?? Date.now());
      setElapsedMs(elapsed);
      emitProgress();
      if (elapsed >= durationSec * 1000) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        finish();
      }
    }, 100);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [started, finished, durationSec, finish]);

  // Focus-loss integrity with 1s de-duplication between blur/visibilitychange.
  useEffect(() => {
    if (!started || finished) return;
    const onBlur = () => {
      const now = Date.now();
      if (now - lastFocusSignalRef.current < 1000) return;
      lastFocusSignalRef.current = now;
      focusLostRef.current += 1;
      setFocusLost(focusLostRef.current);
      track("focus_lost", { durationSec });
    };
    const onVis = () => {
      if (document.hidden) onBlur();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [started, finished, durationSec]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (finishedRef.current) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const now = () => Date.now() - (startAtRef.current ?? Date.now());

    if (e.key === "Backspace") {
      e.preventDefault();
      if (!startedRef.current || trackerRef.current.length === 0) return;
      const removed = trackerRef.current.backspace(now());
      if (removed) {
        keystrokeTimesRef.current.push(now());
        setEntries(trackerRef.current.finalEntries().map((x) => ({ expected: x.expected, typed: x.typed })));
      }
      return;
    }

    // Printable single characters only (desktop-first; IME composition ignored).
    if (e.key.length !== 1) return;
    e.preventDefault();
    const wallNow = Date.now();
    if (!startedRef.current) {
      startedRef.current = true;
      startAtRef.current = wallNow;
      setStarted(true);
      onLifecycleRef.current?.("active");
      track("typing_test_start", { durationSec, language, mode, exerciseId });
      track("test_start", { type: "typing", durationSec, mode });
      track("task_started", { task: "typing", mode, language });
    }
    const time = wallNow - startAtRef.current!;
    const expected = stream.charAt(entries.length);
    const typed = e.key;
    const buffer = trackerRef.current.finalEntries();
    const prevTop = buffer.length > 0 ? buffer[buffer.length - 1] : null;
    trackerRef.current.push(expected, typed, time);
    accumulatePerKey(perKeyRef.current, expected, typed);
    accumulateBigram(bigramRef.current, prevTop ? prevTop.expected : null, { expected, typed }, prevTop);
    keystrokeTimesRef.current.push(time);
    if (typed !== expected) {
      track("keystroke_error", { expected: expected === " " ? "space" : expected, got: typed === " " ? "space" : typed });
    }
    setEntries(trackerRef.current.finalEntries().map((x) => ({ expected: x.expected, typed: x.typed })));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setPasteFlag(true);
    track("paste_detected", { source: "typing-input" });
  };

  const reset = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    startedRef.current = false;
    finishedRef.current = false;
    startAtRef.current = null;
    trackerRef.current = new CorrectionTracker();
    perKeyRef.current = {};
    bigramRef.current = {};
    keystrokeTimesRef.current = [];
    focusLostRef.current = 0;
    setEntries([]);
    setStarted(false);
    setFinished(false);
    setElapsedMs(0);
    setFocusLost(0);
    setPasteFlag(false);
    onLifecycleRef.current?.("ready");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // ---- rendering (pure, from state) ---------------------------------------
  const pos = entries.length;
  const viewStart = Math.max(0, pos - WINDOW_BEFORE);
  const viewText = stream.slice(viewStart, WINDOW_BEFORE + WINDOW_AFTER);
  const chars = [...viewText];
  const liveWpm = started && elapsedMs > 750 ? Math.round(pos / 5 / (elapsedMs / 60_000)) : 0;
  const remainingSec = Math.max(0, Math.ceil((durationSec * 1000 - elapsedMs) / 1000));
  const liveAcc = pos > 0 ? Math.round((entries.filter((x) => x.typed === x.expected).length / pos) * 100) : 100;

  return (
    <div className="w-full max-w-3xl">
      {/* HUD */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Time</div>
            <div className={`text-2xl font-mono font-bold ${remainingSec <= 5 && started && !finished ? "text-red-600" : ""}`} aria-live="off">{remainingSec}s</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">WPM</div>
            <div className="text-2xl font-mono font-bold">{liveWpm}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Accuracy</div>
            <div className="text-2xl font-mono font-bold">{liveAcc}%</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs uppercase tracking-widest text-zinc-500">Mode</div>
            <div className="text-sm font-semibold capitalize">{mode} • {language === "en" ? "English" : "Indonesia"} • {durationSec}s</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pasteFlag && <span role="status" className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">paste blocked — flagged</span>}
          {focusLost > 0 && <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">focus lost ×{focusLost}</span>}
          <button onClick={reset} className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Restart</button>
        </div>
      </div>

      {/* Stream area — no ads ever inside this region */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative cursor-text rounded-xl border border-zinc-200 bg-white p-6 leading-8 dark:border-zinc-800 dark:bg-zinc-900"
        aria-label={`Typing test, ${durationSec} seconds. Click or press any key to begin.`}
        tabIndex={0}
      >
        <p className="break-words font-mono text-lg leading-9 tracking-wide" aria-hidden={true}>
          {chars.map((ch, i) => {
            const globalIdx = viewStart + i;
            let cls = "text-zinc-400";
            if (globalIdx < pos) {
              const entry = entries[globalIdx];
              cls = entry && entry.typed === entry.expected
                ? "text-emerald-600 dark:text-emerald-400"
                : "bg-red-100 text-red-700 underline decoration-red-500 dark:bg-red-950 dark:text-red-300";
            }
            const isCaret = globalIdx === pos && started && !finished;
            return (
              <span key={i} className={`${cls} ${isCaret ? "animate-pulse border-l-2 border-black dark:border-white" : ""}`}>
                {ch}
              </span>
            );
          })}
        </p>
        <input
          ref={inputRef}
          value=""
          onChange={() => undefined}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={(e) => e.preventDefault()}
          disabled={finished}
          className="absolute inset-0 h-full w-full opacity-0"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Type here — the timer starts with your first keystroke"
        />
        {!started && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white shadow dark:bg-white dark:text-black">
              Start typing — timer runs for the full {durationSec}s
            </span>
          </div>
        )}
        {finished && (
          <div role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Time! Results below.
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>Passages continue until time runs out — pace yourself.</span>
        <span>Restart abandons the attempt (not saved).</span>
      </div>
    </div>
  );
}
