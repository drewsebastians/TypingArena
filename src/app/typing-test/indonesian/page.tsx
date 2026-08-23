"use client";
import { useState } from "react";
import TypingEngine from "@/components/TypingEngine";
import ResultCard from "@/components/ResultCard";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import type { TypingResult } from "@/lib/types";

export default function IndonesianTypingPage() {
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [dur, setDur] = useState<15|30|60>(30);
  const item = INDONESIAN_CORPUS[idx % INDONESIAN_CORPUS.length];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Tes Mengetik Bahasa Indonesia</h1>
      <p className="text-sm text-zinc-600">Tes kecepatan mengetik gratis — 15/30/60 detik, akurasi, analisis kesalahan per tombol.</p>
      <div className="mt-3 flex gap-2">
        {[15,30,60].map(d=> <button key={d} onClick={()=>setDur(d as any)} className={`rounded-full px-3 py-1 text-sm ${d===dur?"bg-black text-white":"border"}`}>{d}s</button>)}
        <button onClick={()=>{setResult(null); setIdx(i=>i+1);}} className="rounded-full border px-3 py-1 text-sm">Teks baru</button>
      </div>
      <div className="mt-4">
        {!result ? <TypingEngine key={item.id+String(dur)+idx} item={item} durationSec={dur} onComplete={setResult} /> : <ResultCard result={result} onNext={()=>{setResult(null); setIdx(i=>i+1);}} />}
      </div>
    </div>
  );
}
