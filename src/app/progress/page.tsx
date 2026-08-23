"use client";
import { useEffect, useState } from "react";
import { loadTypingHistory, loadDictationHistory, clearHistory, getStreak, getXP } from "@/lib/history";
import SkillProfile from "@/components/SkillProfile";
import ErrorHeatmap from "@/components/ErrorHeatmap";
import { levelFromXP } from "@/lib/skillMatrix";
import { track, getQueue } from "@/lib/analytics";
import type { TypingResult, DictationResult } from "@/lib/types";

export default function ProgressPage() {
  const [typing, setTyping] = useState<TypingResult[]>([]);
  const [dict, setDict] = useState<DictationResult[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const refresh = () => {
    setTyping(loadTypingHistory());
    setDict(loadDictationHistory());
    setXp(getXP());
    setStreak(getStreak());
  };
  useEffect(()=>{ refresh(); track("history_viewed", {}); }, []);
  const lvl = levelFromXP(xp);

  // simple SVG sparkline for WPM
  const wpmPoints = typing.slice(0,20).reverse().map(r=>r.wpm);
  const maxWpm = Math.max(...wpmPoints, 60);
  const spark = wpmPoints.length > 1 ? wpmPoints.map((v,i)=> `${(i/(wpmPoints.length-1))*100},${100 - (v/maxWpm)*80 - 10}`).join(" ") : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Progress</h1>
      <p className="text-sm text-zinc-600">Session history, D1/D7/D30-ready event model, skill matrix. Blueprint §16 KPIs: test completions, streak, dictation adoption.</p>

      <div className="mt-4 grid gap-4">
        <SkillProfile />
        {typing[0] && <ErrorHeatmap result={typing[0]} />}

        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">WPM Trend (last 20)</h3>
            <span className="text-xs text-zinc-500">Level {lvl.level} • {xp} XP • 🔥 {streak} days</span>
          </div>
          {wpmPoints.length > 1 ? (
            <svg viewBox="0 0 100 100" className="mt-2 h-24 w-full">
              <polyline fill="none" stroke="currentColor" strokeWidth="2" points={spark} className="text-black dark:text-white" />
            </svg>
          ) : <div className="py-8 text-center text-sm text-zinc-500">Complete a test to see your trend</div>}
          <div className="mt-1 flex justify-between text-xs text-zinc-500"><span>{wpmPoints[0] ?? 0} WPM</span><span>{wpmPoints[wpmPoints.length-1] ?? 0} WPM</span></div>
        </div>

        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <h3 className="font-bold">Typing History</h3>
          {typing.length===0 ? <div className="py-6 text-center text-sm text-zinc-500">No tests yet — <a href="/typing-test" className="underline">start a sprint</a></div> : (
            <div className="mt-2 divide-y text-sm">
              {typing.slice(0,20).map(r=>(
                <div key={r.id} className="flex items-center justify-between py-2">
                  <span className="text-xs text-zinc-500">{new Date(r.timestamp).toLocaleDateString()} • {r.durationSec}s • {r.language}</span>
                  <span className="font-mono font-bold">{r.wpm} WPM</span>
                  <span className="text-xs">{r.accuracy}%</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${r.integrity==="ranked"?"bg-emerald-100":"bg-zinc-100"}`}>{r.integrity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <h3 className="font-bold">Dictation History</h3>
          {dict.length===0 ? <div className="py-6 text-center text-sm text-zinc-500">No dictations yet</div> : (
            <div className="mt-2 divide-y text-sm">
              {dict.slice(0,20).map(r=>(
                <div key={r.id} className="flex items-center justify-between py-2">
                  <span className="text-xs text-zinc-500">{new Date(r.timestamp).toLocaleDateString()} • {r.language}</span>
                  <span className="font-mono font-bold">{r.normalizedScore}% norm</span>
                  <span className="text-xs">{r.strictScore}% strict</span>
                  <span className="text-xs text-zinc-500">↻ {r.replayCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <h3 className="font-bold">Analytics queue (local, blueprint §16)</h3>
          <div className="mt-2 max-h-40 overflow-auto rounded bg-zinc-950 p-2 font-mono text-xs text-emerald-300">
            <pre>{JSON.stringify(getQueue().slice(-8), null, 2)}</pre>
          </div>
          <div className="mt-1 text-xs text-zinc-500">Events: landing_view, test_start, typing_test_complete, dictation_complete, focus_lost, paste_detected, etc. Swap adapter to PostHog/GA4 via env.</div>
        </div>

        <div className="flex gap-2">
          <button onClick={()=>{clearHistory(); refresh();}} className="rounded-full border px-4 py-2 text-sm">Clear local history</button>
          <span className="self-center text-xs text-zinc-500">North-star: meaningful completed sessions per returning user • Audio-mode repeat ratio</span>
        </div>
      </div>
    </div>
  );
}
