"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import TypingEngine from "@/components/TypingEngine";
import ResultCard from "@/components/ResultCard";
import SkillProfile from "@/components/SkillProfile";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import type { CorpusItem, TypingResult } from "@/lib/types";

const quickDurations = [15, 30, 60, 300] as const;

export default function Home() {
  const [lang, setLang] = useState<"en" | "id">("en");
  const [duration, setDuration] = useState<15 | 30 | 60 | 300>(30);
  const [item, setItem] = useState<CorpusItem>(ENGLISH_CORPUS[0]);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [mode, setMode] = useState<CorpusItem["mode"]>("sprint");

  const pickItem = (l: "en" | "id", m: CorpusItem["mode"]) => {
    const pool = l === "en" ? ENGLISH_CORPUS : INDONESIAN_CORPUS;
    const filtered = pool.filter(c => m === "sprint" ? c.mode === "sprint" : c.mode === m);
    const arr = filtered.length ? filtered : pool;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  useEffect(() => {
    setItem(pickItem(lang, mode));
  }, [lang, mode]);

  const nextExercise = () => {
    setResult(null);
    setItem(pickItem(lang, mode));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* SEO hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Train and prove how quickly you turn what you <span className="underline decoration-amber-400 decoration-4">see or hear</span> into text.</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">One arena for <strong>typing, dictation & transcription</strong>. No login required. Start in seconds. Ads never inside the active test.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">9/10 feasibility — STRONG GO</span>
          <span className="rounded-full bg-zinc-900 px-3 py-1 font-semibold text-white">English + Indonesia</span>
          <span className="rounded-full border bg-white px-3 py-1 dark:bg-zinc-900">Deterministic • No runtime AI</span>
        </div>
      </div>

      {/* controls */}
      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900">
          {(["en", "id"] as const).map(l => (
            <button key={l} onClick={()=>setLang(l)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${lang===l ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>{l==="en" ? "English" : "Indonesia"}</button>
          ))}
        </div>
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900">
          {quickDurations.map(d => (
            <button key={d} onClick={()=>setDuration(d as any)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${duration===d ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>{d===300?"5 min":`${d}s`}</button>
          ))}
        </div>
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900">
          {(["sprint","copy-pro","punctuation","numbers"] as const).map(m => (
            <button key={m} onClick={()=>setMode(m as any)} className={`rounded-full px-2 py-1.5 text-xs font-semibold ${mode===m ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>{m}</button>
          ))}
        </div>
        <button onClick={nextExercise} className="rounded-full border bg-white px-4 py-1.5 text-sm font-medium dark:bg-zinc-900">↻ New text</button>
      </div>

      {/* engine */}
      <div className="mx-auto mt-6 flex flex-col items-center gap-6">
        {!result ? (
          <TypingEngine key={item.id + String(duration)} item={item} durationSec={duration} onComplete={setResult} />
        ) : (
          <ResultCard result={result} onNext={nextExercise} />
        )}

        {/* discovery nudge — blueprint 7.2 step 4 */}
        {result && (
          <div className="w-full max-w-3xl rounded-xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <div className="text-sm font-bold text-amber-900 dark:text-amber-100">Nice sprint! Now test your listening accuracy →</div>
            <div className="text-sm text-amber-800 dark:text-amber-200">Top players train BOTH visual typing and listening-to-text. Try a 30-second dictation.</div>
            <Link href="/dictation" className="mt-2 inline-block rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white">Go to Dictation</Link>
          </div>
        )}

        {/* profile */}
        <SkillProfile />

        {/* ad slot — outside active test, stable layout */}
        <div className="w-full max-w-3xl ad-slot rounded-xl">Ad slot — results/discovery only (never inside active test)</div>

        {/* SEO clusters */}
        <div className="w-full max-w-3xl grid gap-3 sm:grid-cols-3 text-sm">
          {[
            { href: "/typing-test", title: "Typing Speed Test", desc: "15/30/60s WPM & accuracy" },
            { href: "/typing-test/1-minute", title: "1 Minute Typing Test", desc: "Standard 60s" },
            { href: "/typing-test/5-minute", title: "5 Minute Test", desc: "Endurance 300s" },
            { href: "/tes-mengetik", title: "Tes Mengetik Cepat", desc: "Tes kecepatan mengetik ID" },
            { href: "/dictation/english", title: "English Dictation", desc: "Listen → type exactly" },
            { href: "/dictation/indonesian", title: "Dikte Bahasa Indonesia", desc: "Latihan dikte" },
            { href: "/noise-challenge", title: "Noise Challenge", desc: "Dictation in cafe/street" },
            { href: "/friends", title: "Friend Challenge", desc: "Shareable link battle" },
            { href: "/transcription-practice", title: "Transcription Practice", desc: "30–120s real clips" },
            { href: "/data-entry-test", title: "Data Entry Test", desc: "Numbers, dates, codes" },
            { href: "/punctuation-typing-test", title: "Punctuation Test", desc: "Precision mode" },
            { href: "/daily-arena", title: "Daily Arena", desc: "Same challenge, daily reset" },
          ].map(c => (
            <Link key={c.href} href={c.href} className="rounded-xl border bg-white p-4 hover:border-black dark:bg-zinc-900 dark:hover:border-white">
              <div className="font-bold">{c.title}</div>
              <div className="text-xs text-zinc-500">{c.desc}</div>
            </Link>
          ))}
        </div>

        <div className="w-full max-w-3xl rounded-xl border bg-white p-4 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <strong>How it works:</strong> Every exercise is curated and carries metadata (language, mode, punctuation, difficulty, license). Scoring is deterministic: <span className="font-mono">WPM = chars/5/min</span>, accuracy, per-key & bigram error rates, correction latency, paste/focus integrity. The next challenge is chosen by <span className="font-mono">priority = weakness + freshness + variety</span> — no LLM at runtime.
        </div>
      </div>
    </div>
  );
}
