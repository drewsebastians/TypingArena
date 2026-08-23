"use client";
import { useState } from "react";
import DictationEngine from "@/components/DictationEngine";
import { DICTATION_ID } from "@/lib/content/dictation";

export default function DictationIndonesian() {
  const [idx, setIdx] = useState(0);
  const item = DICTATION_ID[idx % DICTATION_ID.length];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Latihan Dikte Bahasa Indonesia</h1>
      <p className="text-sm text-zinc-600">Dengarkan dan ketik persis seperti yang Anda dengar — tanda baca dihitung.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>setIdx(i=>i+1)} className="rounded-full border bg-white px-4 py-1.5 text-sm">Kalimat berikutnya</button>
        <span className="self-center text-xs text-zinc-500">{idx+1} / {DICTATION_ID.length}</span>
      </div>
      <div className="mt-4 flex justify-center"><DictationEngine key={item.id+idx} item={item} /></div>
    </div>
  );
}
