"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { buildTypingResult, calcWpm } from "@/lib/scoring";
import type { CorpusItem, TypingResult } from "@/lib/types";
import { saveTypingResult } from "@/lib/history";
import { track } from "@/lib/analytics";

export default function TypingEngine({
  item,
  durationSec,
  onComplete,
}: {
  item: CorpusItem;
  durationSec: number;
  onComplete?: (r: TypingResult) => void;
}) {
  const target = item.text;
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pasteDetected, setPasteDetected] = useState(false);
  const [focusLost, setFocusLost] = useState(0);
  const [wpmLive, setWpmLive] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const keystrokesRef = useRef<Array<{ time: number; key: string; correct: boolean; isBackspace: boolean }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const remainingMs = Math.max(0, durationSec * 1000 - elapsedMs);
  const remainingSec = Math.ceil(remainingMs / 1000);

  const finish = useCallback((finalTyped: string, elapsed: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const res = buildTypingResult({
      target,
      typed: finalTyped,
      elapsedMs: elapsed,
      durationSec,
      language: item.language,
      mode: item.mode,
      keystrokes: keystrokesRef.current,
      pasteDetected,
      focusLostCount: focusLost,
    });
    saveTypingResult(res);
    setFinished(true);
    onComplete?.(res);
    if (timerRef.current) window.clearInterval(timerRef.current);
    track("typing_test_complete", { wpm: res.wpm, accuracy: res.accuracy, durationSec, language: item.language, mode: item.mode, integrity: res.integrity });
    if (res.integrity !== "ranked") track("session_unranked", { reason: res.integrity, pasteDetected, focusLost });
    if (pasteDetected) track("paste_detected", { durationSec });
    // burst detection handled in scoring; emit if flagged
    if (res.integrity === "flagged") track("suspicious_burst_detected", { wpm: res.wpm });
  }, [target, durationSec, item.language, item.mode, pasteDetected, focusLost, onComplete]);

  // timer
  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const start = startTimeRef.current!;
      const elapsed = now - start;
      setElapsedMs(elapsed);
      setWpmLive(calcWpm(typed.length, elapsed));
      if (elapsed >= durationSec * 1000) {
        finish(typed, durationSec * 1000);
      }
    }, 100);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [started, finished, typed, durationSec, finish]);

  // keep live wpm in sync when typed changes but timer not ticking yet? handled by interval.

  // focus/blur integrity
  useEffect(() => {
    const onBlur = () => {
      if (started && !finished) { setFocusLost(c => c + 1); track("focus_lost", { durationSec }); }
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", () => { if (document.hidden) onBlur(); });
    return () => {
      window.removeEventListener("blur", onBlur);
    };
  }, [started, finished, durationSec]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // prevent overshoot beyond target + 20%
    if (val.length > target.length + 20) val = val.slice(0, target.length + 20);
    if (!started) {
      setStarted(true);
      startTimeRef.current = Date.now();
      keystrokesRef.current = [];
      setElapsedMs(0);
      finishedRef.current = false;
      track("typing_test_start", { durationSec, language: item.language, mode: item.mode });
      track("test_start", { type: "typing", durationSec });
    }
    // record keystroke diff
    const prev = typed;
    if (val.length > prev.length) {
      // added char(s) — could be paste (multiple)
      const added = val.slice(prev.length);
      if (added.length > 1) setPasteDetected(true);
      for (let i = 0; i < added.length; i++) {
        const idx = prev.length + i;
        const exp = target[idx] ?? "";
        const got = added[i];
        keystrokesRef.current.push({ time: Date.now() - (startTimeRef.current ?? Date.now()), key: got, correct: exp === got, isBackspace: false });
      }
    } else if (val.length < prev.length) {
      keystrokesRef.current.push({ time: Date.now() - (startTimeRef.current ?? Date.now()), key: "Backspace", correct: false, isBackspace: true });
    }
    setTyped(val);
    // auto finish when correctly completed early
    if (val === target) {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      setElapsedMs(elapsed);
      finish(val, elapsed);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    setPasteDetected(true);
    track("paste_detected", { source: "typing" });
  };

  const handleReset = () => {
    setTyped("");
    setStarted(false);
    setFinished(false);
    setElapsedMs(0);
    setPasteDetected(false);
    setFocusLost(0);
    keystrokesRef.current = [];
    startTimeRef.current = null;
    finishedRef.current = false;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // render per-char coloring
  const chars = target.split("");

  return (
    <div className="w-full max-w-3xl">
      {/* HUD */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Time</div>
            <div className={`text-2xl font-mono font-bold ${remainingSec <= 5 && started && !finished ? "text-red-600" : ""}`}>{remainingSec}s</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">WPM</div>
            <div className="text-2xl font-mono font-bold">{started ? wpmLive : 0}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">Mode</div>
            <div className="text-sm font-semibold">{item.mode} • {item.language === "en" ? "English" : "Indonesia"} • {durationSec}s</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pasteDetected && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">paste detected — flagged</span>}
          {focusLost > 0 && <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">focus lost ×{focusLost}</span>}
          <button onClick={handleReset} className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">Reset (Tab)</button>
        </div>
      </div>

      {/* Text area — ad-safe, no layout shift */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative cursor-text rounded-xl border border-zinc-200 bg-white p-6 leading-8 dark:border-zinc-800 dark:bg-zinc-900"
        role="textbox"
        aria-label="typing area"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Tab") { e.preventDefault(); handleReset(); } }}
      >
        <p className="font-mono text-lg tracking-wide">
          {chars.map((ch, i) => {
            const typedChar = typed[i];
            let cls = "text-zinc-400";
            if (typedChar == null) cls = "text-zinc-400";
            else if (typedChar === ch) cls = "text-emerald-600 dark:text-emerald-400";
            else cls = "bg-red-100 text-red-700 underline decoration-red-500 dark:bg-red-950 dark:text-red-300";
            const isCaret = i === typed.length && started && !finished;
            return (
              <span key={i} className={`${cls} ${isCaret ? "border-l-2 border-black dark:border-white -ml-px animate-pulse" : ""}`}>
                {ch}
              </span>
            );
          })}
          {typed.length > target.length && (
            <span className="bg-red-100 text-red-700">{typed.slice(target.length)}</span>
          )}
        </p>
        {/* hidden input captures keystrokes */}
        <input
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          onPaste={handlePaste}
          disabled={finished}
          className="absolute inset-0 h-full w-full opacity-0"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="type here"
        />
        {!started && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white shadow dark:bg-white dark:text-black">Click & start typing — timer starts on first key</span>
          </div>
        )}
        {finished && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Test finished — see results below ↓</div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>Tip: Focus stays locked. Ads never appear inside this area.</span>
        <span>Press Tab to reset</span>
      </div>
    </div>
  );
}
