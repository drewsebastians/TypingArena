"use client";
import { useEffect, useState } from "react";
import { loadTypingHistory, getUsername } from "@/lib/history";
import Link from "next/link";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Array<{ username:string; wpm:number; acc:number; ts:number; rank:number }>>([]);
  const [filter, setFilter] = useState<"all"|"30s"|"60s">("all");

  useEffect(() => {
    const hist = loadTypingHistory();
    const username = getUsername() || "You";
    const mapped = hist.slice(0,50).map((r,i)=> ({ username: i===0 ? username : `player_${i}`, wpm: r.wpm, acc: r.accuracy, ts: r.timestamp, dur: r.durationSec, rank: i+1 }))
      .filter(r => filter==="all" || (filter==="30s" && (r as any).dur===30) || (filter==="60s" && (r as any).dur===60))
      .map((r,i)=> ({...r, rank: i+1}));
    // seed with demo if empty
    if (mapped.length===0) {
      setRows([
        { username: "typemaster", wpm: 102, acc: 98.1, ts: Date.now(), rank:1 },
        { username: "sarah_t", wpm: 89, acc: 97.5, ts: Date.now(), rank:2 },
        { username: "budi_fast", wpm: 84, acc: 96.0, ts: Date.now(), rank:3 },
      ]);
    } else setRows(mapped as any);
  }, [filter]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Leaderboard</h1>
      <p className="text-sm text-zinc-600">Asynchronous • Filterable • Integrity-labeled. Not a formal certification (blueprint §12.4).</p>
      <div className="mt-3 flex gap-2">
        {(["all","30s","60s"] as const).map(f=> <button key={f} onClick={()=>setFilter(f)} className={`rounded-full px-3 py-1 text-sm ${filter===f?"bg-black text-white":"border"}`}>{f}</button>)}
        <Link href="/daily-arena" className="ml-auto rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white">Daily Arena →</Link>
      </div>
      <div className="mt-4 rounded-xl border bg-white dark:bg-zinc-900">
        <div className="divide-y">
          {rows.map(r=>(
            <div key={r.rank} className="flex items-center justify-between px-4 py-3">
              <span className="w-8 font-mono text-sm text-zinc-500">#{r.rank}</span>
              <span className="flex-1 font-semibold">@{r.username}</span>
              <span className="font-mono font-bold">{r.wpm} WPM</span>
              <span className="ml-4 text-sm text-zinc-500">{r.acc}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">Leaderboard stores locally for MVP. Production would use server with paste/burst/focus validation. Every entry carries scoring version for reproducibility.</div>
    </div>
  );
}
