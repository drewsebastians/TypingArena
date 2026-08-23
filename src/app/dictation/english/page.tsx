"use client";
import { useState } from "react";
import DictationEngine from "@/components/DictationEngine";
import { DICTATION_EN } from "@/lib/content/dictation";

export default function DictationEnglish() {
  const [idx, setIdx] = useState(0);
  const item = DICTATION_EN[idx % DICTATION_EN.length];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">English Dictation Practice</h1>
      <p className="text-sm text-zinc-600">Listen → type exactly. Tests listening accuracy + punctuation + capitalization.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>setIdx(i=>i+1)} className="rounded-full border bg-white px-4 py-1.5 text-sm">Next sentence</button>
        <span className="self-center text-xs text-zinc-500">{idx+1} / {DICTATION_EN.length} • {item.difficulty}</span>
      </div>
      <div className="mt-4 flex justify-center"><DictationEngine key={item.id+idx} item={item} /></div>
    </div>
  );
}
