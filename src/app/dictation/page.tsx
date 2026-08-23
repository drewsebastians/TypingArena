"use client";
import { useState } from "react";
import DictationEngine from "@/components/DictationEngine";
import { DICTATION_EN, DICTATION_ID } from "@/lib/content/dictation";
import Link from "next/link";

export default function DictationHub() {
  const [lang, setLang] = useState<"en" | "id">("en");
  const [idx, setIdx] = useState(0);
  const pool = lang === "en" ? DICTATION_EN : DICTATION_ID;
  const item = pool[idx % pool.length];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Dictation Practice</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Hear a sentence and type exactly what you heard — punctuation matters. Core MVP differentiator (blueprint §6.3). No ASR at runtime, just verified transcripts.</p>
      <div className="mt-3 flex gap-2">
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900">
          {(["en","id"] as const).map(l=> <button key={l} onClick={()=>{setLang(l); setIdx(0);}} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${lang===l?"bg-black text-white":"text-zinc-600"}`}>{l==="en"?"English":"Indonesia"}</button>)}
        </div>
        <button onClick={()=>setIdx(i=>i+1)} className="rounded-full border bg-white px-4 py-1.5 text-sm dark:bg-zinc-900">↻ Next clip</button>
        <Link href="/dictation/english" className="rounded-full border bg-white px-3 py-1.5 text-xs dark:bg-zinc-900">EN drills →</Link>
        <Link href="/dictation/indonesian" className="rounded-full border bg-white px-3 py-1.5 text-xs dark:bg-zinc-900">ID dikte →</Link>
      </div>
      <div className="mt-6 flex justify-center">
        <DictationEngine key={item.id+String(idx)} item={item} />
      </div>
      <div className="mt-4 ad-slot rounded-xl">Ad slot — dictation discovery</div>
      <div className="mt-4 rounded-xl border bg-white p-4 text-xs dark:bg-zinc-900">
        <strong>Why dictation?</strong> Research ranked it the moat vs commodity WPM sites. Validation KPI: dictation adoption among typing users & repeat behavior. If only WPM is used, we&apos;re a commodity.
      </div>
    </div>
  );
}
