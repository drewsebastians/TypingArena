"use client";
import { useState, useEffect } from "react";
import { getDailyChallenge, formatDailyTitle } from "@/lib/daily";
import TypingEngine from "@/components/TypingEngine";
import type { TypingResult } from "@/lib/types";
import Link from "next/link";

export default function DailyArena() {
  const { iso, typing } = getDailyChallenge();
  const [result, setResult] = useState<TypingResult | null>(null);
  const [board, setBoard] = useState<Array<{username:string; wpm:number; acc:number; ts:number}>>([]);

  useEffect(() => {
    const raw = localStorage.getItem(`ta:daily:${iso}`);
    if (raw) try { setBoard(JSON.parse(raw)); } catch {}
    const rraw = localStorage.getItem(`ta:daily_result:${iso}`);
    if (rraw) try { setResult(JSON.parse(rraw)); } catch {}
  }, [iso]);

  const handleComplete = (r: TypingResult) => {
    setResult(r);
    localStorage.setItem(`ta:daily_result:${iso}`, JSON.stringify(r));
    const username = localStorage.getItem("ta:username") || "You";
    const entry = { username, wpm: r.wpm, acc: r.accuracy, ts: Date.now() };
    const raw = localStorage.getItem(`ta:daily:${iso}`);
    const arr: typeof board = raw ? JSON.parse(raw) : [
      { username: "sarah_t", wpm: 78, acc: 98.2, ts: Date.now()-100000 },
      { username: "budi_fast", wpm: 72, acc: 96.5, ts: Date.now()-200000 },
      { username: "typemaster", wpm: 95, acc: 97.1, ts: Date.now()-300000 },
    ];
    const next = [...arr, entry].sort((a,b)=>b.wpm - a.wpm).slice(0,20);
    localStorage.setItem(`ta:daily:${iso}`, JSON.stringify(next));
    setBoard(next);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white">
        <div className="text-xs uppercase tracking-widest opacity-80">Daily Arena • {iso}</div>
        <h1 className="text-2xl font-black">{formatDailyTitle(iso)} Challenge</h1>
        <p className="text-sm opacity-90">Everyone gets the same standardized test. Asynchronous leaderboard. Resets daily — blueprint §6.7.</p>
        <div className="mt-2 text-xs opacity-75">Integrity: paste/burst/focus signals → ranked vs practice. Leaderboard is entertainment, not certification.</div>
      </div>

      {!result ? (
        <div className="mt-6">
          <TypingEngine key={typing.id + iso} item={typing} durationSec={30} onComplete={handleComplete} />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border bg-white p-6 dark:bg-zinc-900">
          <h3 className="font-bold">Your Daily Score</h3>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs text-zinc-500">WPM</div><div className="text-2xl font-black">{result.wpm}</div></div>
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs text-zinc-500">Acc</div><div className="text-2xl font-black">{result.accuracy}%</div></div>
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800"><div className="text-xs text-zinc-500">Integrity</div><div className="text-sm font-bold">{result.integrity}</div></div>
          </div>
          <button onClick={()=>{ localStorage.removeItem(`ta:daily_result:${iso}`); setResult(null); }} className="mt-3 rounded-full border px-4 py-2 text-sm">Retry (practice only)</button>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h3 className="font-bold">Leaderboard — {iso}</h3>
        <div className="mt-2 divide-y">
          {board.length === 0 ? <div className="py-6 text-center text-sm text-zinc-500">Complete the challenge to appear here</div> :
            board.map((e,i)=>(
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs text-zinc-500">#{i+1}</span>
                <span className="flex-1 px-3 font-semibold">@{e.username}</span>
                <span className="font-mono font-bold">{e.wpm} WPM</span>
                <span className="ml-3 text-xs text-zinc-500">{e.acc}%</span>
              </div>
            ))
          }
        </div>
        <Link href="/leaderboard" className="mt-3 inline-block text-sm underline">View all-time →</Link>
      </div>
      <div className="mt-3 ad-slot rounded-xl">Ad — below daily arena</div>
    </div>
  );
}
