"use client";
// Noise Challenge — dictation under added noise layers.
//
// Honest scope: the noise layer is procedurally mixed in the browser
// (filtered noise with fixed level/filter settings per difficulty). Difficulty
// tiers are relative, not calibrated real-world SNR measurements.
import { useCallback, useEffect, useRef, useState } from "react";
import DictationEngine from "@/components/DictationEngine";
import { DICTATION_CLIPS } from "@/lib/content/dictation";
import { track } from "@/lib/analytics";
import type { DictationResult } from "@/lib/types";
import { SafeAdSlot } from "@/components/AdSlot";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import NextStepCard from "@/components/tool/NextStepCard";
import { getRouteByPath } from "@/lib/routeRegistry";
import { useLocale } from "@/components/LocaleProvider";

const LEVELS = [
  { id: "clean", label: "Clean", desc: "no noise", gain: 0, cutoffHz: 0 },
  { id: "light", label: "Light", desc: "soft background hum", gain: 0.06, cutoffHz: 1200 },
  { id: "medium", label: "Medium", desc: "steady rumble", gain: 0.14, cutoffHz: 2200 },
  { id: "heavy", label: "Heavy", desc: "dense broadband noise", gain: 0.26, cutoffHz: 4000 },
] as const;

type LevelId = (typeof LEVELS)[number]["id"];

export default function NoiseChallenge() {
  const { locale } = useLocale();
  const [level, setLevel] = useState<LevelId>("clean");
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<DictationResult | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);

  const stopNoise = useCallback(() => {
    try {
      srcRef.current?.stop();
    } catch { /* already stopped */ }
    try {
      void ctxRef.current?.close();
    } catch { /* closed */ }
    ctxRef.current = null;
    srcRef.current = null;
  }, []);

  const startNoise = useCallback((gainVal: number, cutoff: number) => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = gainVal;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cutoff;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      srcRef.current = src;
    } catch {
      /* audio unavailable */
    }
  }, []);

  useEffect(() => stopNoise, [stopNoise]);

  const clips = DICTATION_CLIPS.filter((c) => c.language === "en");
  const item = clips[idx % clips.length];
  const chosen = LEVELS.find((l) => l.id === level)!;

  const handleLevel = (id: LevelId) => {
    stopNoise();
    setLevel(id);
    setResult(null);
    const cfg = LEVELS.find((l) => l.id === id)!;
    if (cfg.gain > 0) startNoise(cfg.gain, cfg.cutoffHz);
    track("noise_challenge_start", { level: id });
  };

  return (
    <ToolPageShell
      eyebrow={locale === "id" ? "Menyimak" : "Listening practice"}
      title={locale === "id" ? "Tantangan Bising" : "Noise Challenge"}
      description={locale === "id" ? "Latih kemampuan menyimak di bawah kondisi akustik yang sulit. Skor dikte tetap sama, dengan lapisan bising yang dapat Anda atur." : "Train listening under difficult acoustic conditions. Dictation scoring stays the same while a controllable noise layer raises the challenge."}
    >
      <div className="mx-auto max-w-3xl">

      <div className="mt-4 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button type="button" key={l.id} onClick={() => handleLevel(l.id)} className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${level === l.id ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`} aria-pressed={level === l.id}>
            {l.label} <span className="font-normal opacity-60">· {l.desc}</span>
          </button>
        ))}
        <button type="button" onClick={stopNoise} className="min-h-11 rounded-full border bg-white px-3 py-2 text-xs dark:bg-zinc-900">Stop noise</button>
      </div>

      {level !== "clean" && (
        <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Noise active ({chosen.label}). Adjust system volume to taste — the clip voice stays at full level above the noise floor.
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <span>Difficulty order: Clean &lt; Light &lt; Medium &lt; Heavy</span>
        <button type="button" onClick={() => { setResult(null); setIdx((i) => i + 1); }} className="ml-auto min-h-11 rounded-full border bg-white px-3 py-1.5 dark:bg-zinc-900">↻ New sentence</button>
      </div>

      <div className="mt-4 flex justify-center">
        <DictationEngine key={`${item.id}-${idx}-${level}`} item={item} noiseLevel={level} onComplete={setResult} />
      </div>
        {result && (
          <NextStepCard
            title={locale === "id" ? "Langkah berikutnya" : "What to do next"}
            body={locale === "id" ? "Bandingkan tingkat bising lain, lalu lanjutkan ke transkripsi untuk latihan audio yang lebih panjang." : "Try another noise level, then step up to a longer transcription sprint."}
            steps={[{ href: "/transcription-practice", label: locale === "id" ? "Lanjut ke transkripsi" : "Go to transcription" }]}
          />
        )}
        <SafeAdSlot slot="noise-challenge" context="outside-task" className="mt-8" />
        {getRouteByPath("/noise-challenge") && <RelatedTools route={getRouteByPath("/noise-challenge")!} />}
      </div>
    </ToolPageShell>
  );
}
