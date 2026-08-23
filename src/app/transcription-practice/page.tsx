"use client";
import { useState, useRef, useEffect } from "react";
import { TRANSCRIPTION_EN } from "@/lib/content/dictation";
import { speak, stopSpeak, rateForSpeed } from "@/lib/tts";
import { strictSimilarityPercent, normalizeTextForScoring } from "@/lib/scoring";

export default function TranscriptionPractice() {
  const item = TRANSCRIPTION_EN[0];
  const [typed, setTyped] = useState("");
  const [playing, setPlaying] = useState(false);
  const [replays, setReplays] = useState(0);
  const [paused, setPaused] = useState(0);
  const [started] = useState(() => Date.now());
  const [result, setResult] = useState<null | { acc: number; norm: number; replayRatio: number }>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const id = setInterval(()=>setTime(Math.round((Date.now()-started)/1000)), 500);
    return () => clearInterval(id);
  }, [started]);

  const handlePlay = () => {
    setPlaying(true); setReplays(r=>r+1);
    speak(item.transcript, item.language, 1.0, ()=>setPlaying(false), ()=>setPlaying(true));
  };
  const handleSubmit = () => {
    const acc = strictSimilarityPercent(item.transcript, typed);
    const norm = strictSimilarityPercent(normalizeTextForScoring(item.transcript, {caseSensitive:false, punctSensitive:false, trim:true}), normalizeTextForScoring(typed, {caseSensitive:false, punctSensitive:false, trim:true}));
    setResult({ acc, norm, replayRatio: (replays * item.durationSec) / item.durationSec });
    stopSpeak();
  };

  if (result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black">Transcription Result</h1>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800"><div className="text-xs text-zinc-500">STRICT</div><div className="text-2xl font-black">{result.acc}%</div></div>
          <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800"><div className="text-xs text-zinc-500">NORMALIZED</div><div className="text-2xl font-black">{result.norm}%</div></div>
          <div className="rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800"><div className="text-xs text-zinc-500">REPLAY RATIO</div><div className="text-2xl font-black">{result.replayRatio.toFixed(2)}×</div></div>
        </div>
        <button onClick={()=>{setResult(null); setTyped(""); setReplays(0);}} className="mt-4 rounded-full border px-4 py-2 text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Transcription Sprint</h1>
      <p className="text-sm text-zinc-600">30–120 second real clips • Pause/replay counted • MVP+ feature (blueprint §6.4). Replay ratio = total audio seconds played / clip duration.</p>

      <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handlePlay} disabled={playing} className={`rounded-full px-6 py-3 text-sm font-bold ${playing?"bg-zinc-300":"bg-black text-white"}`}>{playing?"Playing…":"▶ Play passage"}</button>
          <button onClick={()=>{ stopSpeak(); setPaused(p=>p+1); setPlaying(false); }} className="rounded-full border px-4 py-2 text-sm">Pause</button>
          <span className="text-xs text-zinc-500">⏱ {time}s • replays {replays} • pauses {paused}</span>
        </div>
        <textarea value={typed} onChange={e=>setTyped(e.target.value)} rows={6} placeholder="Transcribe the audio here..." className="mt-4 w-full rounded-lg border p-3 font-mono dark:bg-zinc-800" />
        <div className="mt-3 flex gap-2">
          <button onClick={handleSubmit} className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white">Submit transcription</button>
          <span className="self-center text-xs text-zinc-500">Efficiency matters — but never at cost of accuracy.</span>
        </div>
      </div>
      <div className="mt-3 ad-slot rounded-xl">Ad — below transcription workspace</div>
    </div>
  );
}
