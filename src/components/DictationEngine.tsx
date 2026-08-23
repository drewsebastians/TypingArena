"use client";
import { useState, useRef, useEffect } from "react";
import type { DictationItem, DictationResult } from "@/lib/types";
import { normalizeTextForScoring, strictSimilarityPercent, wordAccuracy } from "@/lib/scoring";
import { speak, stopSpeak, rateForSpeed } from "@/lib/tts";
import { saveDictationResult } from "@/lib/history";
import { track } from "@/lib/analytics";

export default function DictationEngine({ item, onComplete }: { item: DictationItem; onComplete?: (r: DictationResult) => void }) {
  const [typed, setTyped] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const [replaySec, setReplaySec] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<DictationResult | null>(null);
  const [paste, setPaste] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setStartedAt(Date.now());
    track("dictation_start", { language: item.language, difficulty: item.difficulty, speed: item.speed });
    return () => stopSpeak();
  }, [item.id, item.language, item.difficulty, item.speed]);

  const handlePlay = () => {
    const isReplay = replay > 0;
    track(isReplay ? "audio_replay" : "audio_play", { language: item.language });
    setIsPlaying(true);
    setReplay(r => r + 1);
    // approximate replay seconds add
    setReplaySec(s => s + item.durationSec);
    speak(item.transcript, item.language, rateForSpeed(item.speed), () => setIsPlaying(false), () => setIsPlaying(true));
  };

  const handleSubmit = () => {
    const now = Date.now();
    const elapsed = now - (startedAt ?? now);
    const strict = strictSimilarityPercent(item.transcript, typed);
    const normalized = strictSimilarityPercent(
      normalizeTextForScoring(item.transcript, { caseSensitive: false, punctSensitive: false, trim: true }),
      normalizeTextForScoring(typed, { caseSensitive: false, punctSensitive: false, trim: true })
    );
    const wAcc = wordAccuracy(item.transcript, typed, false);
    const effWpm = Math.round((typed.length / 5 / (elapsed / 60000)) * 10) / 10;
    const res: DictationResult = {
      id: `dr-${Date.now()}`,
      language: item.language,
      strictScore: strict,
      normalizedScore: normalized,
      wordAccuracy: wAcc,
      wpm: effWpm,
      replayCount: replay,
      totalReplaySec: replaySec,
      completionMs: elapsed,
      pasteDetected: paste,
      timestamp: now,
      transcript: item.transcript,
      typed,
      integrity: paste ? "flagged" : replay > 5 ? "practice" : "ranked",
    };
    saveDictationResult(res);
    setSubmitted(res);
    onComplete?.(res);
    stopSpeak();
    track("dictation_complete", { strict: strict, normalized, wordAccuracy: wAcc, replayCount: replay, language: item.language });
    track("dictation_submit", { language: item.language });
  };

  if (submitted) {
    return (
      <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-bold">Dictation Result</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs uppercase text-zinc-500">Strict</div><div className="text-2xl font-black">{submitted.strictScore}%</div></div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs uppercase text-zinc-500">Normalized</div><div className="text-2xl font-black">{submitted.normalizedScore}%</div></div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs uppercase text-zinc-500">Word Acc</div><div className="text-2xl font-black">{submitted.wordAccuracy}%</div></div>
          <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs uppercase text-zinc-500">Replays</div><div className="text-2xl font-black">{submitted.replayCount}</div><div className="text-xs text-zinc-500">{submitted.totalReplaySec}s played</div></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${submitted.integrity === "ranked" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{submitted.integrity.toUpperCase()}</span>
          <span className="text-xs text-zinc-500">Effective {submitted.wpm} WPM • Replay ratio {(submitted.totalReplaySec / Math.max(1, item.durationSec)).toFixed(2)}×</span>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-medium">Compare transcripts</summary>
          <div className="mt-2 font-mono text-sm"><div className="text-zinc-500">Expected:</div>{submitted.transcript}</div>
          <div className="mt-1 font-mono text-sm"><div className="text-zinc-500">You typed:</div>{submitted.typed}</div>
        </details>
        <button onClick={() => { setSubmitted(null); setTyped(""); setReplay(0); setReplaySec(0); setStartedAt(Date.now()); }} className="mt-4 rounded-full border px-4 py-2 text-sm font-semibold">Try another</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold dark:bg-zinc-800">{item.language.toUpperCase()} • {item.speed} • {item.difficulty}</span>
        <span className="text-xs text-zinc-500">{item.topic} • replays: {replay} • {replaySec}s played</span>
      </div>

      <div className="flex flex-col items-start gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800 sm:flex-row sm:items-center">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow ${isPlaying ? "bg-zinc-300" : "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black"}`}
          aria-label="play dictation audio"
        >
          {isPlaying ? "▶ Playing..." : "▶ Play audio"}
        </button>
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Listen and type <em>exactly</em> what you hear. Includes punctuation. Use replay sparingly — it&apos;s scored.
          {typeof window !== "undefined" && !("speechSynthesis" in window) && <span className="ml-2 text-amber-600">TTS unsupported — transcript shown: &ldquo;{item.transcript}&rdquo;</span>}
        </div>
        <button onClick={() => stopSpeak()} className="ml-auto rounded-full border bg-white px-3 py-1.5 text-xs dark:bg-zinc-900">Stop</button>
      </div>

      <label className="mt-4 block text-sm font-medium">Your transcription</label>
      <textarea
        ref={inputRef}
        value={typed}
        onChange={e=>setTyped(e.target.value)}
        onPaste={()=>setPaste(true)}
        rows={3}
        placeholder="Type what you heard..."
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-3 font-mono text-base dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="mt-3 flex gap-2">
        <button onClick={handleSubmit} disabled={!typed.trim()} className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">Submit</button>
        <button onClick={() => { setTyped(""); inputRef.current?.focus(); }} className="rounded-full border px-4 py-2 text-sm">Clear</button>
        <span className="ml-auto self-center text-xs text-zinc-500">{paste && "paste will flag integrity"}</span>
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <span className="font-semibold">Scoring:</span> Strict (exact, case+punct) + Normalized (tolerant) + Word accuracy. Replay count and ratio are tracked for efficiency — lower is better only if accuracy holds.
      </div>
    </div>
  );
}
