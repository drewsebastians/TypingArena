"use client";
// Leaderboard — real shared data only. Without a configured backend this page
// shows an honest setup notice; it NEVER fabricates competitor rows.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { RemoteUnavailableError, fetchLeaderboard, type PublicLeaderboardRow } from "@/lib/remote";
import { getUsername } from "@/lib/history";
import { track } from "@/lib/analytics";

type ModeFilter = "sprint" | "daily" | "all";
type LangFilter = "en" | "id" | "all";
type DurFilter = 30 | 60 | 300 | 0; // 0 = all

export default function LeaderboardPage() {
  const [rows, setRows] = useState<PublicLeaderboardRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unconfigured" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeFilter>("sprint");
  const [language, setLanguage] = useState<LangFilter>("all");
  const [durationSec, setDuration] = useState<DurFilter>(30);
  const [localName, setLocalName] = useState<string | null>(null);

  useEffect(() => {
    setLocalName(getUsername());
  }, []);

  const load = useCallback(async () => {
    if (!IS_REMOTE_CONFIGURED) {
      setState("unconfigured");
      return;
    }
    setState("loading");
    try {
      const data = await fetchLeaderboard({
        mode: mode === "all" ? undefined : mode,
        language: language === "all" ? undefined : language,
        durationSec: durationSec || undefined,
      });
      setRows(data);
      setState("ready");
    } catch (e) {
      if (e instanceof RemoteUnavailableError) setState("unconfigured");
      else {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
        setState("error");
      }
    }
  }, [mode, language, durationSec]);
  useEffect(() => {
    track("leaderboard_view", { mode, language, durationSec });
    void load();
  }, [load, mode, language, durationSec]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Leaderboard</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Ranked attempts only — pasted, burst-flagged or practice results never appear. Scores are comparable because every attempt records its scoring version.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Select label="Mode" value={mode} onChange={(v) => setMode(v as ModeFilter)} options={[["sprint", "Sprint"], ["daily", "Daily Arena"], ["all", "All modes"]]} />
        <Select label="Language" value={language} onChange={(v) => setLanguage(v as LangFilter)} options={[["all", "All"], ["en", "English"], ["id", "Indonesia"]]} />
        <Select label="Duration" value={String(durationSec)} onChange={(v) => setDuration(Number(v) as DurFilter)} options={[["30", "30s"], ["60", "60s"], ["300", "5 min"], ["0", "Any"]]} />
        <Link href="/daily-arena" className="ml-auto rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white">Daily Arena →</Link>
      </div>

      <div className="mt-4 rounded-xl border bg-white dark:bg-zinc-900">
        {state === "loading" && <p className="py-10 text-center text-sm text-zinc-500">Loading…</p>}
        {state === "unconfigured" && (
          <p className="p-6 text-center text-sm text-zinc-500">
            Shared leaderboards require the competition backend (Supabase). This deployment doesn&apos;t have it configured yet —
            complete tests locally and see your own history on <Link href="/progress" className="underline">Progress</Link>.
            Operators: run <code>supabase/migrations/0001_init.sql</code> and set <code>NEXT_PUBLIC_SUPABASE_URL</code> + <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        )}
        {state === "error" && <p className="p-6 text-center text-sm text-red-600">Could not load leaderboard: {error}</p>}
        {state === "ready" && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">
            No ranked entries for this filter yet. Complete a clean sprint and sign in to claim the top spot.
          </p>
        )}
        {rows.length > 0 && (
          <ol className="divide-y">
            {rows.map((r, i) => (
              <li key={r.id} className={`flex items-center justify-between px-4 py-3 ${r.username && r.username === localName ? "bg-emerald-50/60 dark:bg-emerald-950/40" : ""}`}>
                <span className="w-8 font-mono text-sm text-zinc-500">#{i + 1}</span>
                <span className="flex-1 font-semibold">@{r.username ?? "typer"}</span>
                <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">{r.mode} • {r.language} • {r.duration_sec}s</span>
                <span className="ml-4 font-mono font-bold">{Number(r.wpm).toFixed(1)} WPM</span>
                <span className="ml-4 text-sm text-zinc-500">{Number(r.accuracy).toFixed(1)}%</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Integrity: only server-visible ranked attempts are listed. Heuristic signals (paste/burst/focus) exclude results client-side and are re-checked at submission time.
      </p>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="flex items-center gap-1 text-sm">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
