"use client";
import { useEffect, useState } from "react";
import { loadTypingHistory, loadDictationHistory, getStreak, getXP } from "@/lib/history";
import { buildSkillMatrix, nextExerciseRecommendation, levelFromXP } from "@/lib/skillMatrix";
import Link from "next/link";

export default function SkillProfile() {
  const [history, setHistory] = useState<ReturnType<typeof loadTypingHistory>>([]);
  const [dictH, setDictH] = useState<ReturnType<typeof loadDictationHistory>>([]);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    setHistory(loadTypingHistory());
    setDictH(loadDictationHistory());
    setStreak(getStreak());
    setXp(getXP());
  }, []);

  const matrix = buildSkillMatrix(history);
  const rec = nextExerciseRecommendation(matrix, history.length);
  const lvl = levelFromXP(xp);

  const avgWpm = history.length ? Math.round(history.slice(0,10).reduce((a,b)=>a+b.wpm,0)/Math.min(10,history.length)) : 0;
  const avgAcc = history.length ? Math.round(history.slice(0,10).reduce((a,b)=>a+b.accuracy,0)/Math.min(10,history.length)*10)/10 : 0;

  const hasMultiSkill = history.length > 0 && dictH.length > 0;

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Your Skill Profile</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${hasMultiSkill ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>{hasMultiSkill ? "MULTI-SKILL" : "STARTER"}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"><div className="text-xs text-zinc-500">Level</div><div className="text-2xl font-black">{lvl.level}</div><div className="h-1.5 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-700"><div className="h-full bg-black dark:bg-white" style={{width: `${lvl.pct}%`}}/></div><div className="text-xs text-zinc-500">{xp} XP • {lvl.progress}/{lvl.needed}</div></div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"><div className="text-xs text-zinc-500">Avg WPM (10)</div><div className="text-2xl font-black">{avgWpm}</div><div className="text-xs text-zinc-500">{history.length} tests</div></div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"><div className="text-xs text-zinc-500">Avg Acc</div><div className="text-2xl font-black">{avgAcc}%</div><div className="text-xs text-zinc-500">{dictH.length} dictations</div></div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800"><div className="text-xs text-zinc-500">Streak</div><div className="text-2xl font-black">🔥 {streak}</div><div className="text-xs text-zinc-500">daily</div></div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Weak keys</div>
          <div className="text-sm font-mono">{matrix.weakKeys.length ? matrix.weakKeys.join("  ") : "— none yet (keep practicing!)"}</div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Weak bigrams</div>
          <div className="text-sm font-mono">{matrix.weakBigrams.length ? matrix.weakBigrams.join(", ") : "—"}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-black p-4 text-white dark:bg-white dark:text-black">
        <div className="text-xs uppercase tracking-widest opacity-60">Recommended next</div>
        <div className="text-lg font-bold">{rec.label}</div>
        <div className="text-sm opacity-80">{rec.reason}</div>
        <Link href={rec.href} className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black dark:bg-black dark:text-white">Start →</Link>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Deterministic adaptation — no runtime AI. Exercises selected from curated metadata: <span className="font-mono">priority = weakness + freshness + variety</span>.
      </div>
    </div>
  );
}
