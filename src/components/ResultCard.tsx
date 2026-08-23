"use client";
import type { TypingResult } from "@/lib/types";
import Link from "next/link";
import ErrorHeatmap from "./ErrorHeatmap";
import { track } from "@/lib/analytics";

export default function ResultCard({ result, onNext }: { result: TypingResult; onNext?: () => void }) {
  const shareText = `I typed ${result.wpm} WPM at ${result.accuracy}% accuracy on TypingArena (${result.durationSec}s ${result.language}) — try to beat me!`;
  const weakKeys = Object.entries(result.perKeyErrors)
    .filter(([, v]) => v.rate > 0.2)
    .sort((a,b)=>b[1].rate - a[1].rate)
    .slice(0,5);

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-lg font-bold">Your Result</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${result.integrity === "ranked" ? "bg-emerald-100 text-emerald-800" : result.integrity === "flagged" ? "bg-red-100 text-red-800" : "bg-zinc-100 text-zinc-600"}`}>{result.integrity.toUpperCase()}</span>
        <span className="ml-auto text-xs text-zinc-500">{new Date(result.timestamp).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
        <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
          <div className="text-xs uppercase tracking-widest text-zinc-500">WPM</div>
          <div className="text-3xl font-black">{result.wpm}</div>
          <div className="text-xs text-zinc-500">CPM {result.cpm}</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Accuracy</div>
          <div className="text-3xl font-black">{result.accuracy}%</div>
          <div className="text-xs text-zinc-500">{result.uncorrectedErrors} errors</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Corrections</div>
          <div className="text-3xl font-black">{result.correctedErrors}</div>
          <div className="text-xs text-zinc-500">{result.correctionLatencyMsAvg ? `${result.correctionLatencyMsAvg}ms avg` : "—"}</div>
        </div>
        <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Time</div>
          <div className="text-3xl font-black">{(result.elapsedMs/1000).toFixed(1)}s</div>
          <div className="text-xs text-zinc-500">of {result.durationSec}s</div>
        </div>
      </div>

      {weakKeys.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">Weak keys: {weakKeys.map(([k]) => `"${k}"`).join(" ")}</div>
          <div className="text-xs text-amber-800 dark:text-amber-300">We&apos;ll prioritize exercises targeting these characters next. This is deterministic — no AI generation.</div>
        </div>
      )}

      <ErrorHeatmap result={result} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => { track("share_card_created", { wpm: result.wpm }); if (navigator.share) navigator.share({ title: "TypingArena", text: shareText }).catch(()=>{}); else navigator.clipboard.writeText(shareText); track("share_clicked", { wpm: result.wpm }); }} className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">Share result</button>
        <Link href="/dictation" onClick={()=>track("next_recommended_start", { from: "typing", to: "dictation" })} className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700">Test listening accuracy →</Link>
        <Link href="/friends" className="rounded-full border border-violet-300 bg-violet-50 px-5 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100">Challenge friend →</Link>
        <Link href="/daily-arena" className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Join Daily Arena</Link>
        {onNext && <button onClick={onNext} className="rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold dark:bg-zinc-800">Next exercise</button>}
      </div>

      <details className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
        <summary className="cursor-pointer font-medium">Show typed vs target</summary>
        <div className="mt-2 grid gap-2">
          <div><span className="font-semibold">Target:</span> <span className="font-mono">{result.text}</span></div>
          <div><span className="font-semibold">Typed:</span> <span className="font-mono">{result.typed}</span></div>
        </div>
      </details>
    </div>
  );
}
