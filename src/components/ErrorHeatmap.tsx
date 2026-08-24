"use client";
import type { TypingResult } from "@/lib/types";
import { track } from "@/lib/analytics";
import { useEffect } from "react";

// QWERTY heatmap — blueprint MVP+ error heatmap
const ROWS = [
  "qwertyuiop".split(""),
  "asdfghjkl".split(""),
  "zxcvbnm".split(""),
];
const ROW_OFFSET = [0, 0.5, 1]; // visual stagger

function heatColor(rate: number): string {
  if (rate >= 0.4) return "bg-red-600 text-white";
  if (rate >= 0.25) return "bg-red-500 text-white";
  if (rate >= 0.15) return "bg-orange-400 text-white";
  if (rate >= 0.08) return "bg-amber-300 text-zinc-900";
  if (rate >= 0.03) return "bg-yellow-100 text-zinc-700 border-yellow-300";
  return "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
}

export default function ErrorHeatmap({ result, compact }: { result: TypingResult; compact?: boolean }) {
  useEffect(() => { track("heatmap_viewed", { wpm: result.grossWpm, accuracy: result.accuracy }); }, [result.id, result.grossWpm, result.accuracy]);

  // include number row + punctuation hint
  const numbers = "1234567890".split("");

  return (
    <div className={`w-full rounded-xl border bg-white p-4 dark:bg-zinc-900 ${compact ? "p-3" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold">Error Heatmap</h4>
        <span className="text-xs text-zinc-500">per-key error rate • darker = worse</span>
      </div>

      {/* numbers */}
      <div className="flex justify-center gap-1">
        {numbers.map(ch => {
          const r = result.perKeyErrors[ch]?.rate ?? result.perKeyErrors[ch.toLowerCase()]?.rate ?? 0;
          return (
            <div key={ch} className={`flex h-8 w-8 items-center justify-center rounded border text-xs font-mono font-bold ${heatColor(r)}`} title={`${ch}: ${(r*100).toFixed(1)}%`}>
              {ch}
            </div>
          );
        })}
      </div>

      {/* QWERTY */}
      <div className="mt-1.5 flex flex-col items-center gap-1.5">
        {ROWS.map((row, idx) => (
          <div key={idx} className="flex gap-1" style={{ marginLeft: `${ROW_OFFSET[idx] * 16}px` }}>
            {row.map(ch => {
              const rate = result.perKeyErrors[ch]?.rate ?? result.perKeyErrors[ch.toUpperCase()]?.rate ?? 0;
              const upperRate = result.perKeyErrors[ch.toUpperCase()]?.rate ?? 0;
              const r = Math.max(rate, upperRate);
              return (
                <div key={ch} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold uppercase ${heatColor(r)}`} title={`${ch}: ${(r*100).toFixed(1)}% err`}>
                  {ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* punctuation row */}
      <div className="mt-2 flex flex-wrap justify-center gap-1">
        { [",", ".", "'", '"', ";", ":", "!", "?", "-", "—", "(", ")"].map(ch => {
          const r = result.perKeyErrors[ch]?.rate ?? 0;
          return <div key={ch} className={`rounded border px-2 py-1 font-mono text-xs font-bold ${heatColor(r)}`} title={`${ch}: ${(r*100).toFixed(1)}%`}>{ch}</div>;
        })}
      </div>

      {/* legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="h-3 w-3 rounded bg-red-600" /> ≥40%
        <span className="h-3 w-3 rounded bg-orange-400" /> ≥15%
        <span className="h-3 w-3 rounded bg-amber-300" /> ≥8%
        <span className="h-3 w-3 rounded bg-yellow-100 border" /> ≥3%
        <span className="h-3 w-3 rounded bg-zinc-100 border" /> &lt;3%
      </div>

      {Object.entries(result.bigramErrors).length > 0 && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Worst bigrams</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(result.bigramErrors).sort((a,b)=> (b[1].errors/(b[1].exposures||1)) - (a[1].errors/(a[1].exposures||1))).slice(0,6).map(([bg, v])=>(
              <span key={bg} className="rounded-full bg-white px-2 py-1 font-mono text-xs font-bold dark:bg-zinc-900">{bg} <span className="font-normal text-zinc-500">{v.errors}/{v.exposures}</span></span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

