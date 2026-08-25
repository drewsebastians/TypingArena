"use client";
// Multiplayer races on Supabase Realtime (presence + broadcast) with durable
// room rows for late joiners. Casual, latency-tolerant synchronization:
// the shared countdown timestamp is authoritative, not per-keystroke sync.
//
// Authority model:
//  - The room CREATOR receives a secret host token (server stores only its
//    hash). Starting and restarting the race require it — a random participant
//    cannot start someone else's room.
//  - Final results are derived server-side from evidence counts inside the
//    validated race window; claimed WPM from the browser is never trusted.
//  - Live opponent progress is advisory only (rate-limited broadcast), never
//    part of scoring.
import { useCallback, useEffect, useRef, useState } from "react";
import TypingEngine from "@/components/TypingEngine";
import { ENGLISH_SPRINT_POOL } from "@/lib/content/english";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import {
  createRoom,
  fetchRoom,
  fetchRoomResults,
  finishRoom,
  restartRoom,
  startRoom,
  type RoomRecord,
  type RoomResultRow,
} from "@/lib/remote";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getUsername } from "@/lib/history";
import { sanitizeDisplayName } from "@/lib/sanitize";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import type { TypingResult } from "@/lib/types";

function playerKey(): string {
  let k = sessionStorage.getItem("ta:mp_key");
  if (!k) {
    k = `p_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("ta:mp_key", k);
  }
  return k;
}

function hostTokenFor(code: string): string | null {
  return sessionStorage.getItem(`ta:mp_host:${code}`);
}

interface OpponentProgress {
  key: string;
  name: string;
  progressPct: number;
  liveWpm: number;
  finished: boolean;
}

type Phase = "menu" | "lobby" | "running" | "results";

export default function MultiplayerPanel() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [players, setPlayers] = useState<Array<{ key: string; name: string }>>([]);
  const [progress, setProgress] = useState<Record<string, OpponentProgress>>({});
  const [results, setResults] = useState<RoomResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [countdownEndsAt, setCountdownEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => () => void channelRef.current?.unsubscribe(), []);

  // Clock ticker while a race is live (effect-scoped impurity is allowed).
  useEffect(() => {
    if (phase !== "running") return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [phase]);

  const subscribe = useCallback(async (roomCode: string) => {
    if (!IS_REMOTE_CONFIGURED) return;
    const { getClient } = await import("@/lib/remote");
    channelRef.current?.unsubscribe();
    const ch = getClient()
      .channel(`room:${roomCode}`, { config: { presence: { key: playerKey() } } })
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState();
        setPlayers(
          Object.entries(state as unknown as Record<string, Array<{ name: string }>>).map(([key, metas]) => ({
            key,
            name: metas[0]?.name ?? "player",
          })),
        );
      })
      .on("broadcast", { event: "start" }, ({ payload }) => {
        setCountdownEndsAt(Date.parse(payload.endsAt as string));
        setPhase("running");
      })
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        const p = payload as { key?: string; name?: string; progressPct?: number; liveWpm?: number; finished?: boolean };
        if (!p.key || p.key === playerKey()) return;
        track("multiplayer_progress_connected", {});
        setProgress((prev) => ({
          ...prev,
          [p.key!]: {
            key: p.key!,
            name: p.name ?? "player",
            progressPct: Math.max(0, Math.min(100, Math.round(p.progressPct ?? 0))),
            liveWpm: Math.max(0, Math.round(p.liveWpm ?? 0)),
            finished: Boolean(p.finished),
          },
        }));
      })
      .subscribe();
    channelRef.current = ch;
    setTimeout(async () => {
      await ch.track({ name: sanitizeDisplayName(getUsername() ?? "player") });
    }, 300);
  }, []);

  const loadResults = useCallback(async (code: string) => {
    try {
      setResults(await fetchRoomResults(code));
    } catch {
      /* ignore */
    }
  }, []);

  const create = useCallback(async () => {
    setError(null);
    try {
      const { code, hostToken } = await createRoom({
        hostName: getUsername() ?? "host",
        language: "en",
        durationSec: 30,
      });
      // Host secret lives only in this tab's session storage.
      sessionStorage.setItem(`ta:mp_host:${code}`, hostToken);
      const r = await fetchRoom(code);
      setRoom(r);
      setProgress({});
      setPhase("lobby");
      void subscribe(code);
      track("multiplayer_room_created", { code });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    }
  }, [subscribe]);

  const join = useCallback(
    async (code: string) => {
      setError(null);
      try {
        const r = await fetchRoom(code);
        setRoom(r);
        setProgress({});
        setPhase(r.state === "lobby" ? "lobby" : r.state === "running" ? "running" : "results");
        if (r.state === "running" && r.ends_at && new Date(r.ends_at).getTime() > Date.now()) {
          setCountdownEndsAt(new Date(r.ends_at).getTime());
        }
        void subscribe(r.code);
        void loadResults(r.code);
        track("multiplayer_joined", { code: r.code });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to join room");
      }
    },
    [subscribe, loadResults],
  );

  const beginRace = useCallback(async () => {
    if (!room) return;
    const token = hostTokenFor(room.code);
    try {
      await startRoom(room.code, token ?? "");
      // Host also learns via broadcast echo; set local fallback timer.
      const endsAt = Date.now() + room.duration_sec * 1000;
      channelRef.current?.send({ type: "broadcast", event: "start", payload: { endsAt: new Date(endsAt).toISOString() } });
      setCountdownEndsAt(endsAt);
      setPhase("running");
      track("multiplayer_start", { code: room.code });
    } catch (e) {
      track("multiplayer_start_denied", { code: room.code });
      setError(e instanceof Error ? e.message : "Failed to start race");
    }
  }, [room]);

  const rematch = useCallback(async () => {
    if (!room) return;
    try {
      await restartRoom(room.code, hostTokenFor(room.code) ?? "");
      setResults([]);
      setProgress({});
      setRoom(await fetchRoom(room.code));
      setPhase("lobby");
      track("multiplayer_rematch", { code: room.code });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Only the host can restart the race");
    }
  }, [room]);

  const onComplete = useCallback(
    async (r: TypingResult) => {
      if (!room) return;
      try {
        await finishRoom(room.code, playerKey(), {
          displayName: getUsername() ?? "player",
          typedChars: r.typedChars,
          correctChars: r.correctChars,
          elapsedMs: r.elapsedMs,
        });
      } catch (e) {
        track("multiplayer_result_rejected", { code: room.code });
        setError(e instanceof Error ? e.message : "Result rejected");
      }
      await loadResults(room.code);
      setPhase("results");
      track("multiplayer_finished", { code: room.code });
    },
    [room, loadResults],
  );

  const onRaceProgress = useCallback(
    (p: { typedChars: number; correctChars: number; progressPct: number; liveWpm: number }) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "progress",
        payload: { key: playerKey(), name: sanitizeDisplayName(getUsername() ?? "player"), ...p },
      });
    },
    [],
  );

  if (!IS_REMOTE_CONFIGURED) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black">{t("mp.title")}</h1>
        <p className="mt-3 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">{t("common.backendRequired")}</p>
      </div>
    );
  }

  if (phase === "menu") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-black">{t("mp.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a room, share the code, and race the same deterministic passage in real time. Casual sync — tolerant of normal network lag. Only the room creator can start the race.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => void create()} className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
            {t("mp.createRoom")}
          </button>
          <div className="flex items-center gap-2">
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="CODE" maxLength={6} aria-label="room code" className="w-32 rounded-lg border px-3 py-2 font-mono uppercase dark:bg-zinc-800" />
            <button onClick={() => void join(joinCode)} disabled={joinCode.length < 4} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-40">
              {t("mp.joinRoom")}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if ((phase === "lobby" || phase === "running") && room) {
    // Ticking clock state keeps render pure; Date.now only inside effects.
    const canType = phase === "running" && countdownEndsAt !== null && now >= countdownEndsAt - room.duration_sec * 1000;
    const isHost = hostTokenFor(room.code) !== null;
    const opponents = Object.values(progress);
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-xl border-2 border-violet-400 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950">
          <span className="text-xs uppercase tracking-widest text-violet-700 dark:text-violet-200">Room code</span>
          <div className="font-mono text-3xl font-black tracking-[0.3em]">{room.code}</div>
          <p className="text-xs text-violet-700 dark:text-violet-200">Share this code — friends press Join on the Multiplayer page.</p>
        </div>

        {phase === "lobby" && (
          <>
            <h3 className="mt-6 font-bold">Players ({players.length})</h3>
            <ul className="mt-2 divide-y rounded-xl border bg-white dark:bg-zinc-900">
              {players.map((p) => (
                <li key={p.key} className="px-4 py-2 text-sm">👤 {p.name}{p.key === playerKey() ? " (you)" : ""}</li>
              ))}
              {players.length === 0 && <li className="px-4 py-2 text-sm text-zinc-500">Waiting for presence…</li>}
            </ul>
            {isHost ? (
              <button onClick={() => void beginRace()} className="mt-4 rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
                Start race ({room.duration_sec}s sprint)
              </button>
            ) : (
              <p className="mt-4 rounded-xl border bg-zinc-50 p-3 text-sm text-zinc-500 dark:bg-zinc-900" role="status">
                Waiting for the host to start the race…
              </p>
            )}
          </>
        )}

        {phase === "running" && opponents.length > 0 && (
          <section aria-label="Opponent progress" className="mt-4 rounded-xl border bg-white p-3 dark:bg-zinc-900">
            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">Live progress</h3>
            <ul className="mt-2 space-y-2">
              {opponents.map((o) => (
                <li key={o.key} className="text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{sanitizeDisplayName(o.name)}{o.finished ? " ✓ finished" : ""}</span>
                    <span className="font-mono">{o.liveWpm} wpm · {o.progressPct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className={`h-full rounded-full ${o.finished ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${o.finished ? 100 : o.progressPct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {canType && (
          <div className="mt-6">
            <TypingEngine
              pool={ENGLISH_SPRINT_POOL}
              language={room.language}
              mode="sprint"
              durationSec={room.duration_sec}
              // Deterministic per-room stream: every player gets identical text.
              exerciseId={`mp-${room.code}-${room.stream_seed}`}
              onComplete={(r) => void onComplete(r)}
              onProgress={onRaceProgress}
            />
          </div>
        )}
        {phase === "running" && !canType && (
          <p className="mt-8 text-center text-lg font-bold" aria-live="polite">Get ready…</p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (phase === "results" && room) {
    const isHost = hostTokenFor(room.code) !== null;
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-2xl font-black">Race results — {room.code}</h2>
        <ol className="mt-4 divide-y rounded-xl border bg-white dark:bg-zinc-900">
          {results.map((r, i) => (
            <li key={r.player_key} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="w-8 font-mono text-zinc-500">#{i + 1}</span>
              <span className="flex-1 font-semibold">{r.display_name}{r.player_key === playerKey() ? " (you)" : ""}</span>
              <span className="font-mono font-bold">{Number(r.wpm).toFixed(1)} WPM</span>
              <span className="ml-4 text-zinc-500">{Number(r.accuracy).toFixed(1)}%</span>
            </li>
          ))}
          {results.length === 0 && <li className="px-4 py-3 text-sm text-zinc-500">No finishers recorded yet.</li>}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {isHost && (
            <button onClick={() => void rematch()} className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">
              Rematch
            </button>
          )}
          <button onClick={() => { setPhase("menu"); setRoom(null); }} className="rounded-full border px-5 py-2 text-sm">Back</button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Casual race — final speeds are recomputed from typed evidence by the server.</p>
      </div>
    );
  }

  return null;
}
