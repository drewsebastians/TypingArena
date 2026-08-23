"use client";
import { useState, useEffect } from "react";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import { track } from "@/lib/analytics";
import Link from "next/link";

function makeChallengeId() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export default function FriendsPage() {
  const [lang, setLang] = useState<"en"|"id">("en");
  const [cid, setCid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const challengeText = (lang==="en" ? ENGLISH_CORPUS : INDONESIAN_CORPUS)[0].text;

  useEffect(() => {
    const stored = localStorage.getItem("ta:friend_challenge");
    if (stored) setCid(stored);
  }, []);

  const create = () => {
    const id = makeChallengeId();
    localStorage.setItem("ta:friend_challenge", id);
    localStorage.setItem(`ta:friend:${id}`, JSON.stringify({ lang, text: challengeText, created: Date.now(), creator: localStorage.getItem("ta:username") || "You" }));
    setCid(id);
    track("friend_challenge_created", { id, lang });
  };

  const link = cid ? `${typeof window !== "undefined" ? window.location.origin : ""}/friends?challenge=${cid}` : "";

  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const incoming = urlParams?.get("challenge");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Friend Challenges</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Blueprint MVP+ — challenge a friend to the same passage. Async, shareable link, no server needed for MVP. Leaderboard per challenge stored locally; production moves to DB.</p>

      {incoming && (
        <div className="mt-4 rounded-xl border-2 border-violet-300 bg-violet-50 p-4 dark:bg-violet-950">
          <div className="text-sm font-bold text-violet-900 dark:text-violet-100">You were challenged! #{incoming}</div>
          <div className="mt-2 font-mono text-sm">“{(() => { try { return JSON.parse(localStorage.getItem(`ta:friend:${incoming}`) || "{}").text || challengeText; } catch { return challengeText; } })()}”</div>
          <Link href={`/typing-test?mode=copy-pro`} className="mt-3 inline-block rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white">Accept & type →</Link>
          <button onClick={()=>track("friend_challenge_completed", { id: incoming })} className="ml-2 rounded-full border bg-white px-4 py-2 text-sm">Mark done</button>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Create challenge</span>
          <div className="ml-auto flex rounded-full border p-1">
            {(["en","id"] as const).map(l=> <button key={l} onClick={()=>setLang(l)} className={`rounded-full px-3 py-1 text-xs font-semibold ${lang===l?"bg-black text-white":"text-zinc-600"}`}>{l}</button>)}
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 font-mono text-sm dark:bg-zinc-800">{challengeText}</div>
        <button onClick={create} className="mt-3 rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Create share link</button>

        {cid && (
          <div className="mt-4 rounded-lg border-2 border-dashed p-3">
            <div className="text-xs font-semibold">Share this link</div>
            <div className="mt-1 break-all rounded bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-800">{link}</div>
            <div className="mt-2 flex gap-2">
              <button onClick={async()=>{ await navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),1500); }} className="rounded-full border bg-white px-4 py-1.5 text-sm dark:bg-zinc-900">{copied ? "Copied!" : "Copy link"}</button>
              <button onClick={async()=>{ if (navigator.share) await navigator.share({ title: "TypingArena Challenge", text: `Beat my typing challenge ${cid}!`, url: link }); else await navigator.clipboard.writeText(link); track("share_clicked", { id: cid }); }} className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white">Share →</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">MVP stores challenges in localStorage — link only works on this device/browser. Production: persist to DB + `/challenge/[id]` route with OG image (share card).</div>
    </div>
  );
}
