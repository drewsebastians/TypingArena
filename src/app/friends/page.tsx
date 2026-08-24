"use client";
// Friend challenges — REAL cross-device flow backed by central storage.
//
// 1. Creator picks language/duration; the exact corpus exercise is stored
//    centrally under an unguessable 10-char id.
// 2. The share link works on any device/browser: the recipient fetches the
//    same immutable payload and types the identical text.
// 3. Both results are stored against the challenge for comparison.
//
// Without a configured backend this page explains what is missing instead of
// pretending localStorage links work across devices.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TypingEngine from "@/components/TypingEngine";
import { ENGLISH_CORPUS, ENGLISH_SPRINT_POOL } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import {
  createFriendChallenge,
  fetchFriendChallenge,
  fetchFriendResults,
  submitFriendResult,
  type FriendChallengeRecord,
  type FriendChallengeResultRow,
} from "@/lib/remote";
import { getUsername } from "@/lib/history";
import { track } from "@/lib/analytics";
import type { CorpusItem, Language, TypingResult } from "@/lib/types";

function findCorpusItem(id: string): CorpusItem | undefined {
  return [...ENGLISH_CORPUS, ...INDONESIAN_CORPUS].find((c) => c.id === id);
}

function FriendsInner() {
  const params = useSearchParams();
  const incomingId = params.get("challenge");

  const [language, setLanguage] = useState<Language>("en");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const challenge = incomingId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Friend Challenges</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Send a link — your friend gets <em>exactly</em> the same passage on their own device, then you compare scores.
      </p>

      {!IS_REMOTE_CONFIGURED && (
        <div className="mt-4 rounded-xl border border-zinc-300 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          Cross-device challenges need the shared backend (Supabase) which isn&apos;t configured in this deployment.
          Operators: see README → “Shared competition setup”.
        </div>
      )}

      {challenge ? (
        <AcceptChallenge challengeId={challenge} />
      ) : (
        !IS_REMOTE_CONFIGURED && (
          <div className="mt-6 rounded-xl border bg-white p-4 text-sm text-zinc-500 dark:bg-zinc-900">
            Create-a-challenge unlocks once the backend is configured — links must resolve centrally to work across devices.
          </div>
        )
      )}

      {!challenge && IS_REMOTE_CONFIGURED && (
        <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Create a challenge</span>
            <div className="ml-auto flex rounded-full border p-1">
              {(["en", "id"] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)} className={`rounded-full px-3 py-1 text-xs font-semibold ${language === l ? "bg-black text-white" : "text-zinc-600"}`}>
                  {l === "en" ? "English" : "Indonesia"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              setCreating(true);
              setError(null);
              try {
                const pool = language === "en" ? ENGLISH_SPRINT_POOL : INDONESIAN_CORPUS.filter((c) => c.mode === "sprint");
                const exercise = pool[Math.floor(Math.random() * pool.length)];
                const displayName = getUsername() ?? "challenger";
                const id = await createFriendChallenge({
                  creatorName: displayName,
                  payload: {
                    exerciseId: exercise.id,
                    language,
                    mode: "sprint",
                    durationSec: 30,
                    createdAt: Date.now(),
                  },
                });
                setCreatedId(id);
                track("friend_challenge_created", { id, language });
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to create challenge");
              } finally {
                setCreating(false);
              }
            }}
            disabled={creating}
            className="mt-3 rounded-full bg-black px-6 py-2 text-sm font-bold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {creating ? "Creating…" : "Create 30s sprint challenge"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          {createdId && <ShareLink challengeId={createdId} />}
        </div>
      )}
    </div>
  );
}

function ShareLink({ challengeId }: { challengeId: string }) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    // Resolved after mount so SSR output stays deterministic.
    setLink(`${window.location.origin}${window.location.pathname}?challenge=${challengeId}`);
  }, [challengeId]);

  return (
    <div className="mt-4 rounded-lg border-2 border-dashed p-3">
      <div className="text-xs font-semibold">Share this link — works on any device</div>
      <div className="mt-1 break-all rounded bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-800">{link || "…"}</div>
      <div className="mt-2 flex gap-2">
        <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} disabled={!link} className="rounded-full border bg-white px-4 py-1.5 text-sm dark:bg-zinc-900">
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          onClick={async () => {
            track("share_clicked", { id: challengeId });
            if (navigator.share) await navigator.share({ title: "TypingArena Challenge", text: `Beat my typing challenge!`, url: link }).catch(() => {});
            else await navigator.clipboard.writeText(link);
          }}
          className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white"
        >
          Share →
        </button>
      </div>
    </div>
  );
}

function AcceptChallenge({ challengeId }: { challengeId: string }) {
  const [record, setRecord] = useState<FriendChallengeRecord | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<FriendChallengeResultRow[]>([]);
  const [myResult, setMyResult] = useState<TypingResult | null>(null);

  useEffect(() => {
    track("friend_challenge_opened", { id: challengeId });
    fetchFriendChallenge(challengeId)
      .then((r) => {
        setRecord(r);
        setState("ready");
        return fetchFriendResults(challengeId).then(setResults).catch(() => undefined);
      })
      .catch((e: unknown) => {
        setState("error");
        setError(e instanceof Error ? e.message : "Failed to load challenge");
      });
  }, [challengeId]);

  const onComplete = useCallback(
    async (r: TypingResult) => {
      setMyResult(r);
      try {
        await submitFriendResult(challengeId, {
          displayName: getUsername() ?? "guest",
          wpm: r.grossWpm,
          accuracy: r.accuracy,
        });
        const updated = await fetchFriendResults(challengeId);
        setResults(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save your result");
      }
      setState("done");
      track("friend_challenge_completed", { id: challengeId, wpm: r.grossWpm });
    },
    [challengeId],
  );

  if (state === "loading") return <p className="mt-6 text-center text-sm text-zinc-500">Loading challenge…</p>;
  if (state === "error") return <p className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>;

  const item = record ? findCorpusItem(record.payload.exerciseId) : undefined;
  if (record && !item) {
    return <p className="mt-6 text-center text-sm text-red-600">This challenge references content missing from this deployment (version mismatch).</p>;
  }

  return (
    <div className="mt-6">
      {record && (
        <div className="mb-4 rounded-xl border-2 border-violet-300 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950">
          <div className="text-sm font-bold text-violet-900 dark:text-violet-100">
            @{record.creator_name} challenged you — {record.payload.durationSec}s sprint ({record.payload.language === "en" ? "English" : "Indonesia"})
          </div>
          <div className="text-xs text-violet-700 dark:text-violet-200">Challenge #{record.id} • version {record.challenge_version}</div>
        </div>
      )}

      {item && state === "ready" && !myResult && (
        <TypingEngine
          key={record!.id}
          pool={[item]}
          language={item.language}
          mode="sprint"
          durationSec={record!.payload.durationSec}
          exerciseId={`friend-${record!.id}`}
          onComplete={(r) => void onComplete(r)}
        />
      )}

      {state === "done" && myResult && (
        <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
          <h3 className="font-bold">Your attempt: {myResult.grossWpm} WPM • {myResult.accuracy}%</h3>
          <h4 className="mt-4 text-sm font-semibold">Challenge board</h4>
          <ol className="mt-1 divide-y">
            {results.map((res, i) => (
              <li key={res.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-xs text-zinc-500">#{i + 1}</span>
                <span className="flex-1 px-3 font-semibold">@{res.display_name}</span>
                <span className="font-mono font-bold">{Number(res.wpm).toFixed(1)} WPM</span>
                <span className="ml-3 text-xs text-zinc-500">{Number(res.accuracy).toFixed(1)}%</span>
              </li>
            ))}
          </ol>
          <ShareLinkSmall challengeId={challengeId} />
        </div>
      )}
    </div>
  );
}

function ShareLinkSmall({ challengeId }: { challengeId: string }) {
  const [link, setLink] = useState("");
  useEffect(() => {
    setLink(`${window.location.origin}${window.location.pathname}?challenge=${challengeId}`);
  }, [challengeId]);
  return (
    <button onClick={() => navigator.clipboard.writeText(link)} disabled={!link} className="mt-3 rounded-full border px-4 py-1.5 text-xs">
      Copy invite link for more friends
    </button>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Loading…</div>}>
      <FriendsInner />
    </Suspense>
  );
}
