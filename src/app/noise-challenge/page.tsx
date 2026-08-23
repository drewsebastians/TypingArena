"use client";
import { useState, useRef } from "react";
import DictationEngine from "@/components/DictationEngine";
import { DICTATION_EN } from "@/lib/content/dictation";
import { track } from "@/lib/analytics";

const LEVELS = [
  { id: "clean", label: "Clean", desc: "no noise", gain: 0 },
  { id: "cafe", label: "Cafe", desc: "light babble", gain: 0.08 },
  { id: "street", label: "Street", desc: "traffic + chatter", gain: 0.18 },
  { id: "static", label: "Static", desc: "heavy white noise", gain: 0.3 },
] as const;

export default function NoiseChallenge() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("clean");
  const [idx, setIdx] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);

  const item = DICTATION_EN[idx % DICTATION_EN.length];
  const chosen = LEVELS.find(l=>l.id===level)!;

  const startNoise = async (gainVal: number) => {
    if (gainVal === 0) { stopNoise(); return; }
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * 0.25; // white noise
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = gainVal;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = level==="cafe" ? 1800 : level==="street" ? 2500 : 4000;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      srcRef.current = src;
      gainRef.current = gain;
    } catch {}
  };
  const stopNoise = () => {
    try { srcRef.current?.stop(); srcRef.current?.disconnect(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;
  };

  const handleLevel = (id: typeof level) => {
    stopNoise();
    setLevel(id);
    const g = LEVELS.find(l=>l.id===id)!.gain;
    if (g>0) startNoise(g);
    track("noise_challenge_start", { level: id });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Noise Challenge</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Blueprint §6.5 — train listening under difficult acoustic conditions. Same dictation engine, added deterministic noise layers. No ASR, just human skill.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEVELS.map(l=>(
          <button key={l.id} onClick={()=>handleLevel(l.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${level===l.id ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>
            {l.label} <span className="font-normal opacity-60">· {l.desc}</span>
          </button>
        ))}
        <button onClick={stopNoise} className="rounded-full border bg-white px-3 py-2 text-xs dark:bg-zinc-900">Stop noise</button>
      </div>

      {level!=="clean" && (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          🔊 Noise active: {chosen.label} ({chosen.desc}). Adjust your system volume. Noise auto-stops on submit. For production, use mastered cafe/street IRs + calibrated SNR — this MVP uses generated white noise filtered per level.
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <span>Transcript hidden until playback — integrity: clean &lt; cafe &lt; street &lt; static</span>
        <button onClick={()=>setIdx(i=>i+1)} className="ml-auto rounded-full border bg-white px-3 py-1.5 dark:bg-zinc-900">↻ New sentence</button>
      </div>

      <div className="mt-4 flex justify-center">
        <DictationEngine key={item.id+level+idx} item={item} />
      </div>

      <div className="mt-4 rounded-xl border bg-white p-4 text-xs dark:bg-zinc-900">
        <strong>Scoring note:</strong> Noise level is stored with the result. Don&apos;t collapse to single score — show separate dimensions: <span className="font-mono">strict / normalized / replay × noise</span>.
      </div>
    </div>
  );
}
