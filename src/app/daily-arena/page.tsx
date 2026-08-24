"use client";
// Daily Arena — one deterministic challenge per product-day (Asia/Jakarta).
//
// Shared board comes from the central backend when configured and the user is
// signed in. Without a backend the page degrades HONESTLY: your attempt is
// still scored and kept locally, and the board area explains what is missing.
// No fake competitor rows are ever shown.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDailyChallenge, formatDailyTitle } from "@/lib/daily";
import { arenaDateString } from "@/lib/datetime";
import TypingEngine from "@/components/TypingEngine";
import DictationPanel from "@/components/DictationPanel";
import AdSlot from "@/components/AdSlot";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import {
  fetchDailyBoard,
  getCurrentUser,
  submitAttempt,
  type DailyBoardRow,
} from "@/lib/remote";
import { track } from "@/lib/analytics";
import type { DailyChallenge } from "@/lib/daily";
import type { TypingResult } from "@/lib/types";

export default function DailyArena() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [iso, setIso] = useState<string | null>(null);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [board, setBoard] = useState<DailyBoardRow[]>([]);
  const [boardState, setBoardState] = useState<"loading" | "ready" | "unconfigured" | "error" | "signed-out">(
    () => (IS_REMOTE_CONFIGURED ? "loading" : "unconfigured"),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"typing" | "dictation">("typing");

  // Challenge identity is time-dependent → computed after mount to keep
  // SSR/hydration deterministic.
  useEffect(() => {
    const c = getDailyChallenge();
    const today = arenaDateString(Date.now());
    setChallenge(c);
    setIso(today);
    track("daily_arena_start", { date: today });
    if (!IS_REMOTE_CONFIGURED) return;
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        if (!user) {
          setBoardState("signed-out");
          return;
        }
        return fetchDailyBoard(today)
          .then((rows) => {
            if (cancelled) return;
            setBoard(rows);
            setBoardState("ready");
          })
          .catch((e: unknown) => {
            if (cancelled) return;
            setBoardState("error");
            setErrorMsg(e instanceof Error ? e.message : "Failed to load board");
          });
      })
      .catch(() => {
        if (!cancelled) setBoardState("unconfigured");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleComplete = useCallback(
    async (r: TypingResult) => {
      setResult(r);
      track("daily_arena_complete", { date: iso, wpm: r.grossWpm, accuracy: r.accuracy, integrity: r.integrity });
      if (!IS_REMOTE_CONFIGURED || r.integrity !== "ranked") return;
      try {
        await submitAttempt({
          exerciseId: `daily:${iso}:${r.exerciseId}`,
          exerciseVersion: r.exerciseVersion,
          scoringVersion: r.scoringVersion,
          mode: "daily",
          language: r.language,
          durationSec: r.durationSec,
          elapsedMs: r.elapsedMs,
          wpm: r.grossWpm,
          accuracy: r.accuracy,
          integrity: r.integrity,
          typedChars: r.typedChars,
          uncorrectedErrors: r.uncorrectedErrors,
          challengeDate: iso ?? undefined,
          challengeVersion: "v2",
        });
        const rows = await fetchDailyBoard(iso ?? "");
        setBoard(rows);
        setBoardState("ready");
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Submission failed");
      }
    },
    [iso],
  );

  if (!challenge || !iso) {
    return <div className="py-16 text-center text-sm text-zinc-500">Loading today&apos;s arena…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white">
        <div className="text-xs uppercase tracking-widest opacity-80">Daily Arena • {iso} • resets midnight Asia/Jakarta</div>
        <h1 className="mt-1 text-2xl font-black">{formatDailyTitle(challenge.iso)} Challenge</h1>
        <p className="mt-1 text-sm opacity-90">Everyone gets the same standardized test today. Sign in to enter the shared board.</p>
        <div className="mt-2 text-xs opacity-75">Only clean attempts (no paste, no impossible bursts) enter the ranked board.</div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button onClick={() => setTab("typing")} className={`rounded-full px-5 py-1.5 text-sm font-semibold ${tab === "typing" ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>Typing</button>
        <button onClick={() => setTab("dictation")} className={`rounded-full px-5 py-1.5 text-sm font-semibold ${tab === "dictation" ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>Dictation</button>
      </div>

      <div className="mt-6">
        {tab === "typing" ? (
          !result ? (
            <TypingEngine
              key={challenge.iso}
              pool={[challenge.typing]}
              language={challenge.typing.language}
              mode="daily"
              durationSec={30}
              exerciseId={`daily-${challenge.iso}`}
              challengeDate={challenge.iso}
              onComplete={(r) => void handleComplete(r)}
            />
          ) : (
            <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
              <h3 className="font-bold">Your Daily Score</h3>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <Stat label="WPM" value={String(result.grossWpm)} />
                <Stat label="Accuracy" value={`${result.accuracy}%`} />
                <Stat label="Integrity" value={result.integrity.toUpperCase()} />
              </div>
              {result.integrity !== "ranked" && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{result.integrity === "flagged" ? "Flagged attempts don't enter the ranked board." : "Practice results stay off the ranked board."}</p>
              )}
              {!IS_REMOTE_CONFIGURED && <p className="mt-2 text-xs text-zinc-500">Saved to this device. Shared boards require backend configuration (see README).</p>}
            </div>
          )
        ) : (
          <DictationPanel initialLanguage={challenge.dictation.language} lockLanguage />
        )}
      </div>

      {/* Board */}
      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h3 className="font-bold">Ranked board — {iso}</h3>
        {boardState === "loading" && <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>}
        {boardState === "unconfigured" && (
          <p className="py-4 text-center text-sm text-zinc-500">
            The shared board needs the competition backend. Your attempt is still scored and saved locally. Operators: see <code>supabase/migrations</code> in the repo README.
          </p>
        )}
        {boardState === "signed-out" && (
          <p className="py-4 text-center text-sm text-zinc-500">
            <Link href="/progress" className="underline">Sign in</Link> to publish your daily attempt and see today&apos;s ranked competitors.
          </p>
        )}
        {boardState === "error" && <p className="py-4 text-center text-sm text-red-600">Could not load board: {errorMsg}</p>}
        {boardState === "ready" && board.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No ranked entries yet today — be the first.</p>}
        {board.length > 0 && (
          <ol className="mt-2 divide-y">
            {board.map((e, i) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs text-zinc-500">#{i + 1}</span>
                <span className="flex-1 px-3 font-semibold">@{e.username ?? e.user_id.slice(0, 8)}</span>
                <span className="font-mono font-bold">{Number(e.wpm).toFixed(1)} WPM</span>
                <span className="ml-3 text-xs text-zinc-500">{Number(e.accuracy).toFixed(1)}%</span>
              </li>
            ))}
          </ol>
        )}
        <Link href="/leaderboard" className="mt-3 inline-block text-sm underline">All-time leaderboard →</Link>
      </div>
      <AdSlot slot="daily-arena" className="mt-6" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
