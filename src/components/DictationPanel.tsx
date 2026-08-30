"use client";
// Shared dictation workspace: clip selection + engine. Static audio only.
import { useMemo, useState } from "react";
import DictationEngine from "@/components/DictationEngine";
import { getDictationByLang } from "@/lib/content/dictation";
import type { DictationItem, DictationResult, Language } from "@/lib/types";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import NextStepCard from "@/components/tool/NextStepCard";

export default function DictationPanel({
  initialLanguage = "en",
  lockLanguage = false,
  onLifecycleChange,
  syncPolicy = "local",
}: {
  initialLanguage?: Language;
  lockLanguage?: boolean;
  onLifecycleChange?: (state: TaskLifecycle) => void;
  syncPolicy?: "local" | "shared";
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
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900" role="group" aria-label="dictation language">
          {(["en", "id"] as const).map((l) => (
            <button type="button" key={l} onClick={() => { setLanguage(l); setClipIdx(0); setLastResult(null); }} aria-pressed={language === l} className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold ${language === l ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>
              {l === "en" ? "English" : "Bahasa Indonesia"}
            </button>
          ))}
        </div>
      )}

      {!lastResult && <ClipMeta clip={clip} index={clipIdx % clips.length} total={clips.length} />}

      <DictationEngine
        key={`${clip.id}-${clipIdx}`}
        item={clip}
        onComplete={setLastResult}
        onLifecycleChange={onLifecycleChange}
        syncPolicy={syncPolicy}
      />

      {lastResult && (
        <NextStepCard
          title="Keep the practice moving"
          body="Try another clip, then step up to a longer transcription sprint."
          steps={[{ href: "/transcription-practice", label: "Step up to Transcription" }]}
        >
          <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={nextClip} className="inline-flex min-h-11 items-center rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
            Next clip →
          </button>
          </div>
        </NextStepCard>
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

