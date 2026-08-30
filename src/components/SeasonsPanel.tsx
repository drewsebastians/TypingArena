"use client";
// Ranked Seasons — deterministic monthly ladders over server-accepted ranked
// attempts. Season identity is pure date math (see lib/seasons.ts), so archives
// can never be rewritten.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { currentSeason, recentSeasons } from "@/lib/seasons";
import type { Season } from "@/lib/seasons";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { fetchLeaderboard, getCurrentUser, type PublicLeaderboardRow } from "@/lib/remote";
import { SafeAdSlot } from "@/components/AdSlot";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";

type ModeFilter = "all" | "sprint" | "daily";

export default function SeasonsPanel() {
  const [season, setSeason] = useState<Season>(currentSeason);
  const [mode, setMode] = useState<ModeFilter>("all");
  const [rows, setRows] = useState<PublicLeaderboardRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unconfigured">("loading");
  const [me, setMe] = useState<string | null>(null);
  const seasons = recentSeasons(6);

  useEffect(() => {
    track("leaderboard_view", { source: "seasons", season: season.id });
    if (IS_REMOTE_CONFIGURED) void getCurrentUser().then((u) => setMe(u?.id ?? null));
  }, [season.id]);

  const load = useCallback(async () => {
    if (!IS_REMOTE_CONFIGURED) {
      setState("unconfigured");
      return;
    }
    setState("loading");
    try {
      const data = await fetchLeaderboard({ limit: 200 });
      setRows(data.filter((r) => new Date(r.scored_at).getTime() >= Date.parse(`${season.startDay}T00:00:00+07:00`)));
      setState("ready");
    } catch {
      setState("unconfigured");
    }
  }, [season]);

  useEffect(() => {
    void load();
  }, [load, mode]);

  const filtered = rows.filter((r) => mode === "all" || r.mode === mode);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mt-4 flex flex-wrap gap-2">
        {seasons.map((s) => (
          <button type="button" key={s.id} onClick={() => setSeason(s)} aria-pressed={season.id === s.id} className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold ${season.id === s.id ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>
            {s.label}{s.id === currentSeason().id ? " • live" : ""}
          </button>
        ))}
        <select value={mode} onChange={(e) => setMode(e.target.value as ModeFilter)} className="ml-auto min-h-11 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800" aria-label="season mode filter">
          <option value="all">All modes</option>
          <option value="sprint">Sprint</option>
          <option value="daily">Daily Arena</option>
        </select>
      </div>

      <div className="mt-4 rounded-xl border bg-white dark:bg-zinc-900">
        {state === "loading" && <p className="py-10 text-center text-sm text-zinc-500">{t("common.loading")}</p>}
        {state === "unconfigured" && <p className="p-6 text-center text-sm text-zinc-500">{t("common.backendRequired")}</p>}
        {state === "ready" && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">
            No ranked entries yet this season{season.id !== currentSeason().id ? " — archived seasons keep whatever was earned" : ""}. Complete a clean ranked test to appear.
          </p>
        )}
        {filtered.length > 0 && (
          <ol className="divide-y">
            {filtered.map((r, i) => (
              <li key={r.id} className={`flex items-center justify-between px-4 py-3 ${me && r.user_id === me ? "bg-emerald-50/60 dark:bg-emerald-950/40" : ""}`}>
                <span className="w-8 font-mono text-sm text-zinc-500">#{i + 1}</span>
                <span className="flex-1 font-semibold">@{r.username ?? "typer"}</span>
                <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">{r.mode} · {r.language} · {r.duration_sec}s</span>
                <span className="ml-4 font-mono font-bold">{Number(r.wpm).toFixed(1)}</span>
                <span className="ml-4 text-sm text-zinc-500">{Number(r.accuracy).toFixed(1)}%</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Rules: monthly ladder on the Asia/Jakarta calendar; only attempts the backend verified and accepted as ranked count; one ranked Daily Arena entry per day; season rollover never deletes history.
      </p>
      <Link href="/daily-arena" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white">Play today&apos;s Daily Arena →</Link>
      <SafeAdSlot slot="seasons" context="outside-task" className="mt-8" />
    </div>
  );
}

