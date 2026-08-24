"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import { getTranscriptionByLang } from "@/lib/content/dictation";
import AdSlot from "@/components/AdSlot";
import type { Language } from "@/lib/types";

export default function TranscriptionPracticePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [clipIdx, setClipIdx] = useState(0);

  const clips = useMemo(() => getTranscriptionByLang(language), [language]);
  const clip = clips[clipIdx % clips.length];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-center text-2xl font-black">Transcription Sprint</h1>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Full-length clips (30s+). Type everything: words, punctuation, numbers. Every replay, pause and seek is measured — steady first-pass listening scores best.
      </p>

      <div className="mt-6 flex justify-center">
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900">
          {(["en", "id"] as const).map((l) => (
            <button key={l} onClick={() => setLanguage(l)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${language === l ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>
              {l === "en" ? "English" : "Bahasa Indonesia"}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-xs uppercase tracking-widest text-zinc-500">
        clip {(clipIdx % clips.length) + 1}/{clips.length} • {clip.topic}
      </p>

      <div className="mx-auto mt-4 max-w-3xl">
        <TranscriptionEngine key={clip.id} item={clip} />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setClipIdx((i) => i + 1)}
            className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black"
          >
            Next clip →
          </button>
          <Link href="/daily-arena" className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            Today&apos;s Daily Arena →
          </Link>
        </div>
        <AdSlot slot="transcription" className="mt-8" />
      </div>
    </div>
  );
}

