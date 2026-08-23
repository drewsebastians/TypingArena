"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import TypingEngine from "@/components/TypingEngine";
import ResultCard from "@/components/ResultCard";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import type { TypingResult } from "@/lib/types";
import Link from "next/link";

function TypingTestInner() {
  const sp = useSearchParams();
  const dur = parseInt(sp.get("duration") || "30", 10);
  const duration = [15,30,60,300].includes(dur) ? dur as 15|30|60|300 : 30;
  const modeParam = sp.get("mode");
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<TypingResult | null>(null);

  const pool = modeParam === "copy-pro" ? ENGLISH_CORPUS.filter(c=>c.mode==="copy-pro") : ENGLISH_CORPUS.filter(c=>c.mode==="sprint");
  const item = pool[idx % pool.length] || ENGLISH_CORPUS[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-black">Typing Speed Test — {duration >= 60 ? `${duration/60} min` : `${duration}s`} {duration===300 && "(Endurance)"}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Measure WPM, accuracy, per-key errors. <Link href="/tes-mengetik" className="underline">Tes mengetik Indonesia →</Link> • <Link href="/typing-test/5-minute" className="underline">5-min endurance →</Link></p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[15,30,60,300].map(d => <Link key={d} href={`/typing-test?duration=${d}`} className={`rounded-full px-3 py-1 text-sm ${d===duration?"bg-black text-white":"border bg-white dark:bg-zinc-900"}`}>{d===300?"5 min":`${d}s`}</Link>)}
          <button onClick={()=>{setResult(null); setIdx(i=>i+1);}} className="rounded-full border bg-white px-3 py-1 text-sm dark:bg-zinc-900">↻ New passage</button>
        </div>
      </div>
      {!result ? (
        <TypingEngine key={item.id+String(duration)+String(idx)} item={item} durationSec={duration} onComplete={setResult} />
      ) : (
        <>
          <ResultCard result={result} onNext={()=>{setResult(null); setIdx(i=>i+1);}} />
          <div className="mt-3 ad-slot rounded-xl">Ad slot — result screen (stable layout)</div>
        </>
      )}
      <div className="mt-6 rounded-xl border bg-white p-4 text-xs dark:bg-zinc-900">
        <h2 className="font-bold">About this test</h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">This is an instant, tool-led experience — blueprint §14. The page <em>is</em> the test. No onboarding, no registration required. Scoring version v1.0.0; every result stores exercise version for reproducibility.</p>
      </div>
    </div>
  );
}

export default function TypingTestPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-6">Loading test…</div>}>
      <TypingTestInner />
    </Suspense>
  );
}
