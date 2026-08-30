"use client";
import type { TypingResult } from "@/lib/types";
import Link from "next/link";
import ErrorHeatmap from "./ErrorHeatmap";
import { track } from "@/lib/analytics";
import { INTEGRITY_EXPLANATIONS } from "@/lib/integrity";

export default function ResultCard({ result, onNext }: { result: TypingResult; onNext?: () => void }) {
  const shareText = `I typed ${result.grossWpm} WPM at ${result.accuracy}% accuracy on TypingArena (${result.durationSec}s ${result.language}) — try to beat me!`;
  const weakKeys = Object.entries(result.perKeyErrors)
    .filter(([, v]) => v.rate > 0.2 && v.exposures >= 3)
    .sort((a, b) => b[1].rate - a[1].rate)
    .slice(0, 5);

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-lg font-bold">Your Result</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${result.integrity === "ranked" ? "bg-emerald-100 text-emerald-800" : result.integrity === "flagged" ? "bg-red-100 text-red-800" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>
          {result.integrity.toUpperCase()}
        </span>
        <span className="ml-auto text-xs text-zinc-500">{new Date(result.timestamp).toLocaleString()}</span>
      </div>
      <p className="text-xs text-zinc-500">{INTEGRITY_EXPLANATIONS[result.integrity]}</p>

      {/* Primary metric hierarchy */}
      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="rounded-xl bg-zinc-50 p-5 text-center dark:bg-zinc-800">
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Words per minute</div>
          <div className="font-mono text-4xl font-black">{result.grossWpm}</div>
          <div className="mt-1 text-xs text-zinc-500">net {result.netWpm} • {result.cpm} CPM</div>
        </div>
        <Stat label="Accuracy" main={`${result.accuracy}%`} sub={`${result.correctChars}/${result.typedChars}`} />
        <Stat label="Time" main={`${(result.elapsedMs / 1000).toFixed(1)}s`} sub={`of ${result.durationSec}s • ${result.uncorrectedErrors} left unfixed`} />
      </div>

      {weakKeys.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Focus next: {weakKeys.map(([k]) => (k === " " ? "space" : `"${k}"`)).join(" ")}
          </div>
          <div className="text-xs text-amber-800 dark:text-amber-300">We’ll bias upcoming passages toward these characters.</div>
        </div>
      )}

      <details className="mt-4 rounded-lg border bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <summary className="cursor-pointer list-none text-sm font-semibold">Details — corrections & heatmap</summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white p-3 dark:bg-zinc-900">
              <div className="font-semibold">Corrections</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                {result.correctedErrors} fixed • {result.rawErrorEvents} raw events • {result.backspaceActions} backspaces
              </div>
              {result.correctionLatencyMsAvg !== null && (
                <div className="mt-1 text-zinc-500">Avg latency {result.correctionLatencyMsAvg}ms</div>
              )}
            </div>
            <div className="rounded-lg bg-white p-3 dark:bg-zinc-900">
              <div className="font-semibold">Scope</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-400">Typed {result.typedChars} chars • accuracy over typed scope only</div>
            </div>
          </div>
          <ErrorHeatmap result={result} />
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            track("share_card_created", { wpm: result.grossWpm });
            if (navigator.share) navigator.share({ title: "TypingArena", text: shareText }).catch(() => {});
            else navigator.clipboard.writeText(shareText).catch(() => {});
            track("share_clicked", { wpm: result.grossWpm });
          }}
          className="min-h-11 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Share result
        </button>
        <Link href="/dictation" onClick={() => { track("next_recommended_start", { from: "typing", to: "dictation" }); track("result_next_action_clicked", { to: "/dictation" }); }} className="min-h-11 rounded-full border border-amber-400 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Test your listening →
        </Link>
        <Link href="/friends" onClick={() => track("result_next_action_clicked", { to: "/friends" })} className="min-h-11 rounded-full border border-violet-300 bg-violet-50 px-5 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200">Challenge friend</Link>
        <Link href="/daily-arena" onClick={() => track("result_next_action_clicked", { to: "/daily-arena" })} className="min-h-11 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Daily Arena</Link>
        {onNext && <button onClick={() => { track("result_next_action_clicked", { to: "next-exercise" }); onNext(); }} className="min-h-11 rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold dark:bg-zinc-800">Next exercise</button>}
      </div>
    </div>
  );
}

function Stat({ label, main, sub }: { label: string; main: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
      <div className="text-xs uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="text-3xl font-black">{main}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}
