"use client";
import { useState } from "react";
import TypingEngine from "@/components/TypingEngine";
import ResultCard from "@/components/ResultCard";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import type { TypingResult } from "@/lib/types";

export default function DataEntryTest() {
  const pool = [...ENGLISH_CORPUS.filter(c=>c.mode==="numbers"), ...INDONESIAN_CORPUS.filter(c=>c.mode==="numbers")];
  const [idx, setIdx] = useState(0);
  const [res, setRes] = useState<TypingResult|null>(null);
  const item = pool[idx % pool.length] || ENGLISH_CORPUS.find(c=>c.id==="en-numbers-001")!;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Data Entry Typing Test</h1>
      <p className="text-sm text-zinc-600">Numbers, dates, addresses, codes — career-relevant precision. Distinct SEO surface (blueprint §14).</p>
      <div className="mt-4">
        {!res ? <TypingEngine key={item.id+idx} item={item} durationSec={30} onComplete={setRes} /> : <ResultCard result={res} onNext={()=>{setRes(null); setIdx(i=>i+1);}} />}
      </div>
    </div>
  );
}
