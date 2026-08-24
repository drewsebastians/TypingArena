"use client";
// Shared dictation workspace: clip selection + engine. Static audio only.
import { useMemo, useState } from "react";
import Link from "next/link";
import DictationEngine from "@/components/DictationEngine";
import { getDictationByLang } from "@/lib/content/dictation";
import type { DictationItem, DictationResult, Language } from "@/lib/types";

export default function DictationPanel({
  initialLanguage = "en",
  lockLanguage = false,
}: {
  initialLanguage?: Language;
  lockLanguage?: boolean;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [clipIdx, setClipIdx] = useState(0);
  const [lastResult, setLastResult] = useState<DictationResult | null>(null);

  const clips = useMemo<DictationItem[]>(() => getDictationByLang(language), [language]);
  const clip = clips[clipIdx % clips.length];

  const nextClip = () => {
    setLastResult(null);
    setClipIdx((i) => i + 1);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {!lockLanguage && (
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900">
          {(["en", "id"] as const).map((l) => (
            <button key={l} onClick={() => { setLanguage(l); setLastResult(null); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${language === l ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>
              {l === "en" ? "English" : "Bahasa Indonesia"}
            </button>
          ))}
        </div>
      )}

      {!lastResult && <ClipMeta clip={clip} index={clipIdx % clips.length} total={clips.length} />}

      <DictationEngine key={`${clip.id}-${clipIdx}`} item={clip} onComplete={setLastResult} />

      {lastResult && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={nextClip} className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
            Next clip →
          </button>
          <Link href="/transcription-practice" className="rounded-full border border-amber-400 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
            Step up to Transcription →
          </Link>
        </div>
      )}
    </div>
  );
}

function ClipMeta({ clip, index, total }: { clip: DictationItem; index: number; total: number }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-500">clip {index + 1}/{total} • {clip.topic} • ~{clip.durationSec}s</p>
    </div>
  );
}

