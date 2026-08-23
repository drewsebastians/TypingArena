"use client";
import { useState } from "react";
import TypingEngine from "@/components/TypingEngine";
import ResultCard from "@/components/ResultCard";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import type { TypingResult } from "@/lib/types";

export default function PunctuationTest() {
  const pool = ENGLISH_CORPUS.filter(c=>c.mode==="punctuation" || c.tags.includes("punctuation"));
  const [idx, setIdx] = useState(0);
  const [res, setRes] = useState<TypingResult|null>(null);
  const item = pool[idx % pool.length] || ENGLISH_CORPUS[0];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Punctuation Typing Test</h1>
      <p className="text-sm text-zinc-600">Copy Pro precision — quotes, apostrophes, em-dashes, commas. Differentiates from simplistic WPM lists.</p>
      <div className="mt-4">
        {!res ? <TypingEngine key={item.id+idx} item={item} durationSec={30} onComplete={setRes} /> : <ResultCard result={res} onNext={()=>{setRes(null); setIdx(i=>i+1);}} />}
      </div>
    </div>
  );
}
