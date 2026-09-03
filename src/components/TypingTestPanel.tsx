"use client";
// Shared typing test workspace used by /, /typing-test*, /tes-mengetik,
// /data-entry-test, /punctuation-typing-test.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import TypingEngine from "@/components/TypingEngine";
import ResultCard from "@/components/ResultCard";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import type { CorpusItem, Language, Mode, TypingResult } from "@/lib/types";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import { track } from "@/lib/analytics";

const DURATIONS = [15, 30, 60, 300] as const;
type Duration = (typeof DURATIONS)[number];

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "sprint", label: "Sprint" },
  { id: "copy-pro", label: "Copy Pro" },
  { id: "numbers", label: "Numbers" },
];

function poolFor(language: Language, mode: Mode): CorpusItem[] {
  const base = language === "en" ? ENGLISH_CORPUS : INDONESIAN_CORPUS;
  const filtered = base.filter((c) => c.mode === mode || (mode === "sprint" && c.mode === "punctuation"));
  return filtered.length > 0 ? filtered : base.filter((c) => c.mode === "sprint");
}

export default function TypingTestPanel({
  initialLanguage = "en",
  initialDuration = 30,
  initialMode = "sprint",
  onLifecycleChange,
  syncPolicy = "local",
  autoFocus = true,
}: {
  initialLanguage?: Language;
  initialDuration?: Duration;
  initialMode?: Mode;
  onLifecycleChange?: (state: TaskLifecycle) => void;
  syncPolicy?: "local" | "shared";
  autoFocus?: boolean;
}) {
  const params = useSearchParams();
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [duration, setDuration] = useState<Duration>(() => {
    const d = Number(params.get("duration"));
    return DURATIONS.includes(d as Duration) ? (d as Duration) : initialDuration;
  });
  const [mode, setMode] = useState<Mode>(() => {
    const m = params.get("mode");
    return m && MODES.some((x) => x.id === m) ? (m as Mode) : initialMode;
  });
  const [result, setResult] = useState<TypingResult | null>(null);
  const [sessionSeed, setSessionSeed] = useState(0);

  const pool = useMemo(() => poolFor(language, mode), [language, mode]);
  const nextExercise = useCallback(() => {
    setResult(null);
    setSessionSeed((s) => s + 1); // fresh deterministic stream per attempt
  }, []);

  const exerciseId = `${mode}-${language}-${duration}-${sessionSeed}`;

  useEffect(() => {
    track("task_configured", { task: "typing", language, mode, durationSec: duration });
  }, [duration, language, mode]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900" role="group" aria-label="test language">
          {(["en", "id"] as const).map((l) => (
            <button type="button" key={l} onClick={() => { setLanguage(l); nextExercise(); }} aria-pressed={language === l} className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold ${language === l ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>
              {l === "en" ? "English" : "Indonesia"}
            </button>
          ))}
        </div>
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900" role="group" aria-label="test duration">
          {DURATIONS.map((d) => (
            <button type="button" key={d} onClick={() => { setDuration(d); nextExercise(); }} aria-pressed={duration === d} className={`min-h-11 rounded-full px-3 py-1.5 text-sm font-semibold ${duration === d ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>
              {d === 300 ? "5 min" : `${d}s`}
            </button>
          ))}
        </div>
        <div className="flex rounded-full border bg-white p-1 dark:bg-zinc-900" role="group" aria-label="content mode">
          {MODES.map((m) => (
            <button type="button" key={m.id} onClick={() => { setMode(m.id); nextExercise(); }} aria-pressed={mode === m.id} className={`min-h-11 rounded-full px-3 py-1.5 text-xs font-semibold ${mode === m.id ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!result ? (
        <TypingEngine
          key={`${exerciseId}-${duration}`}
          pool={pool}
          language={language}
          mode={mode}
          durationSec={duration}
          exerciseId={exerciseId}
          onComplete={setResult}
          onLifecycleChange={onLifecycleChange}
          syncPolicy={syncPolicy}
          autoFocus={autoFocus}
        />
      ) : (
        <ResultCard result={result} onNext={nextExercise} />
      )}
    </div>
  );
}
