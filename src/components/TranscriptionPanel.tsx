"use client";

import { useMemo, useState } from "react";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import { getTranscriptionByLang } from "@/lib/content/dictation";
import type { Language, TranscriptionResult } from "@/lib/types";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import NextStepCard from "@/components/tool/NextStepCard";

export default function TranscriptionPanel({
  initialLanguage = "en",
  lockLanguage = false,
  onLifecycleChange,
  onComplete,
  syncPolicy = "local",
}: {
  initialLanguage?: Language;
  lockLanguage?: boolean;
  onLifecycleChange?: (state: TaskLifecycle) => void;
  onComplete?: (result: TranscriptionResult) => void;
  syncPolicy?: "local" | "shared";
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [clipIdx, setClipIdx] = useState(0);
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null);
  const clips = useMemo(() => getTranscriptionByLang(language), [language]);
  const clip = clips[clipIdx % clips.length];

  const nextClip = () => {
    setLastResult(null);
    setClipIdx((i) => i + 1);
  };

  const complete = (result: TranscriptionResult) => {
    setLastResult(result);
    onComplete?.(result);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {!lockLanguage && (
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900" role="group" aria-label="transcription language">
          {(["en", "id"] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLanguage(l); setClipIdx(0); setLastResult(null); }}
              className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold ${language === l ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 dark:text-zinc-300"}`}
            >
              {l === "en" ? "English" : "Bahasa Indonesia"}
            </button>
          ))}
        </div>
      )}

      {!lastResult && (
        <p className="text-center text-xs uppercase tracking-widest text-zinc-500">
          Clip {(clipIdx % clips.length) + 1}/{clips.length} · {clip.topic}
        </p>
      )}

      <TranscriptionEngine
        key={`${clip.id}-${clipIdx}`}
        item={clip}
        onLifecycleChange={onLifecycleChange}
        onComplete={complete}
        syncPolicy={syncPolicy}
      />

      {lastResult && (
        <NextStepCard
          title="Your next transcription step"
          body="Run another clip, or compare your progress in the device history."
          steps={[{ href: "/progress", label: "View progress" }]}
        >
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <button onClick={nextClip} className="inline-flex min-h-11 items-center rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
            Next clip →
          </button>
          </div>
        </NextStepCard>
      )}
    </div>
  );
}
