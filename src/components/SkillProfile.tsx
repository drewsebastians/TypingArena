"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadTypingHistory, loadDictationHistory, loadTranscriptionHistory, getStreak } from "@/lib/history";
import { buildSkillMatrix, nextExerciseRecommendation, xpFromResults, levelFromXP } from "@/lib/skillMatrix";
import { track } from "@/lib/analytics";

export default function SkillProfile() {
  const [typing, setTyping] = useState<ReturnType<typeof loadTypingHistory>>([]);
  const [dictation, setDictation] = useState<ReturnType<typeof loadDictationHistory>>([]);
  const [transcription, setTranscription] = useState<ReturnType<typeof loadTranscriptionHistory>>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setTyping(loadTypingHistory());
    setDictation(loadDictationHistory());
    setTranscription(loadTranscriptionHistory());
    setStreak(getStreak().current);
    track("history_viewed", { source: "skill-profile" });
  }, []);

  const matrix = buildSkillMatrix(typing, dictation, transcription);
  const rec = nextExerciseRecommendation(matrix, typing.length);
  const xp = xpFromResults(typing, dictation, transcription);
  const lvl = levelFromXP(xp);
  const hasMultiSkill = dictation.length > 0 || transcription.length > 0;

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Your Skill Profile</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${hasMultiSkill ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>
          {hasMultiSkill ? "MULTI-SKILL" : "STARTER"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card title="Level">
          <div className="text-2xl font-black">{lvl.level}</div>
          <div className="h-1.5 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-700"><div className="h-full bg-black dark:bg-white" style={{ width: `${lvl.pct}%` }} /></div>
          <div className="text-xs text-zinc-500">{xp} XP • {lvl.progress}/{lvl.needed}</div>
        </Card>
        <Card title="Typing WPM (20)">
          <div className="text-2xl font-black">{matrix.typing.avgGrossWpm ?? "—"}</div>
          <div className="text-xs text-zinc-500">acc {matrix.typing.avgAccuracy ?? "—"}% • {matrix.typing.attempts} tests</div>
        </Card>
        <Card title="Listening">
          {matrix.dictation.attempts === 0 ? (
            <>
              <div className="text-2xl font-black">?</div>
              <div className="text-xs text-zinc-500">try dictation</div>
            </>
          ) : (
            <>
              <div className={`text-2xl font-black ${matrix.dictation.listeningWeak ? "text-amber-600" : ""}`}>{matrix.dictation.avgNormalized ?? "—"}</div>
              <div className="text-xs text-zinc-500">
                norm % • {matrix.dictation.byLanguage.en.attempts}EN/{matrix.dictation.byLanguage.id.attempts}ID
                {matrix.dictation.listeningWeak ? " • weak" : ""}
              </div>
            </>
          )}
        </Card>
        <Card title="Streak">
          <div className="text-2xl font-black">{streak}</div>
          <div className="text-xs text-zinc-500">days (UTC+7)</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Weak keys / bigrams</div>
          <div className="mt-1 text-sm font-mono">
            {matrix.typing.weakKeys.length ? matrix.typing.weakKeys.map((k) => (k === " " ? "␣" : k)).join(" ") : "—"}
            {matrix.typing.weakBigrams.length ? ` | ${matrix.typing.weakBigrams.join(", ")}` : ""}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Transcription</div>
          <div className="mt-1 text-sm">
            {matrix.transcription.attempts === 0
              ? "Not tried yet"
              : `${matrix.transcription.attempts} clips • avg ${matrix.transcription.avgNormalized ?? "—"}% • replay ×${matrix.transcription.avgReplayRatio ?? "—"}`}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-black p-4 text-white dark:bg-white dark:text-black">
        <div className="text-xs uppercase tracking-widest opacity-60">Recommended next</div>
        <div className="text-lg font-bold">{rec.label}</div>
        <div className="text-sm opacity-80">{rec.reason}</div>
        <Link href={rec.href} onClick={() => track("next_recommended_start", { label: rec.label })} className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black dark:bg-black dark:text-white">
          Start →
        </Link>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Deterministic adaptation from your multi-mode history — transparent thresholds, no runtime AI.
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
      <div className="text-xs text-zinc-500">{title}</div>
      {children}
    </div>
  );
}
