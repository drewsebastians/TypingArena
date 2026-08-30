"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildSkillMatrix, nextExerciseRecommendation } from "@/lib/skillMatrix";
import { getStreak, loadCareerHistory, loadDictationHistory, loadTranscriptionHistory, loadTypingHistory } from "@/lib/history";
import { getLocalNickname, setLocalNickname } from "@/lib/nickname";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { ensureSharedIdentity, updateNickname } from "@/lib/remote";
import { flushQueue, pendingSyncCount } from "@/lib/sync";
import { track } from "@/lib/analytics";
import PrivacyPanel from "@/components/PrivacyPanel";
import { SafeAdSlot } from "@/components/AdSlot";
import ToolPageShell from "@/components/tool/ToolPageShell";

export default function ProgressPage() {
  const [typing, setTyping] = useState(loadTypingHistory);
  const [dictation, setDictation] = useState(loadDictationHistory);
  const [transcription, setTranscription] = useState(loadTranscriptionHistory);
  const [career, setCareer] = useState(loadCareerHistory);
  const [streak, setStreak] = useState(0);
  const [pending, setPending] = useState(0);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"typing" | "dictation" | "transcription">("typing");

  useEffect(() => {
    track("history_viewed", { source: "progress" });
    setStreak(getStreak().current);
    setPending(pendingSyncCount());
    const id = window.setInterval(() => setPending(pendingSyncCount()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = () => {
    setTyping(loadTypingHistory());
    setDictation(loadDictationHistory());
    setTranscription(loadTranscriptionHistory());
    setCareer(loadCareerHistory());
    setStreak(getStreak().current);
    setPending(pendingSyncCount());
  };

  const syncNow = async () => {
    setSyncMsg(null);
    try {
      if (IS_REMOTE_CONFIGURED) await ensureSharedIdentity(getLocalNickname() ?? undefined);
      const result = await flushQueue();
      setPending(result.remaining);
      setSyncMsg(result.remaining === 0 ? "Shared results are up to date." : `${result.remaining} still waiting — we will retry automatically.`);
    } catch (e) {
      setPending(pendingSyncCount());
      setSyncMsg(e instanceof Error ? e.message : "Sync failed — results stay safe locally and retry later.");
    }
  };

  const matrix = buildSkillMatrix(typing, dictation, transcription);
  const rec = nextExerciseRecommendation(matrix, typing.length);

  return (
    <ToolPageShell title="Progress on this device" description="Your practice history, streak, and recommendations stay in this browser. Shared features are opt-in when you choose to publish or manage a workspace." width="max-w-3xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Typing tests" value={String(typing.length)} />
        <Stat label="Dictations" value={String(dictation.length)} />
        <Stat label="Transcriptions" value={String(transcription.length)} />
        <Stat label="Streak" value={`${streak}d`} sub="Asia/Jakarta days" />
      </div>
      {career.length > 0 && <p className="mt-2 text-xs text-zinc-500">{career.length} career assessment{career.length === 1 ? "" : "s"} on record — see the <Link href="/career" className="underline">Career page</Link>.</p>}

      <NicknamePanel />

      {pending > 0 && (
        <div role="status" className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span>{pending} shared result{pending === 1 ? "" : "s"} waiting to upload.</span>
          <button onClick={() => void syncNow()} className="min-h-11 rounded-full border px-3 py-1 font-semibold">Sync shared results</button>
          {syncMsg && <span>{syncMsg}</span>}
        </div>
      )}
      {pending === 0 && syncMsg && <p role="status" className="mt-2 text-xs text-emerald-700">{syncMsg}</p>}

      <div className="mt-6 rounded-2xl bg-black p-4 text-white dark:bg-white dark:text-black">
        <div className="text-xs uppercase tracking-widest opacity-60">Recommended next</div>
        <div className="text-lg font-bold">{rec.label}</div>
        <div className="text-sm opacity-80">{rec.reason}</div>
        <Link href={rec.href} onClick={() => track("next_recommended_start", { label: rec.label })} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black dark:bg-black dark:text-white">Start →</Link>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Progress history">
          {(["typing", "dictation", "transcription"] as const).map((item) => <button type="button" key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`min-h-11 rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${tab === item ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>{item}</button>)}
        </div>
        <div className="mt-3 divide-y rounded-xl border bg-white dark:bg-zinc-900">
          {tab === "typing" && (typing.length === 0 ? <Empty label="No typing tests yet" href="/typing-test" cta="Take a 30s sprint" /> : typing.slice(0, 25).map((r) => <Row key={r.id} head={`${r.grossWpm} WPM • ${r.accuracy}%`} sub={`${r.durationSec}s ${r.language} • ${new Date(r.timestamp).toLocaleString()} • errors fixed ${r.correctedErrors}/unfixed ${r.uncorrectedErrors}`} badge={r.integrity} />))}
          {tab === "dictation" && (dictation.length === 0 ? <Empty label="No dictations yet" href="/dictation" cta="Try English dictation" /> : dictation.slice(0, 25).map((r) => <Row key={r.id} head={`${r.normalizedScore}% normalized • ${r.wordAccuracy}% words`} sub={`${r.language} • replays ${r.playback.replayCount} • ratio ${r.playback.replayRatio ?? "—"}× • ${new Date(r.timestamp).toLocaleString()}`} badge={r.integrity} />))}
          {tab === "transcription" && (transcription.length === 0 ? <Empty label="No transcriptions yet" href="/transcription-practice" cta="Try Transcription Sprint" /> : transcription.slice(0, 25).map((r) => <Row key={r.id} head={`${r.normalizedScore}% • ${r.effectiveWpm} eWPM`} sub={`${r.language} ${r.difficulty} • ratio ${r.playback.replayRatio ?? "—"}× • pauses ${r.playback.pauseCount} • ${new Date(r.timestamp).toLocaleString()}`} badge={r.integrity} />))}
        </div>
      </div>

      <PrivacyPanel onDeleted={refresh} />
      <SafeAdSlot slot="progress" context="outside-task" className="mt-8" />
    </ToolPageShell>
  );
}

function NicknamePanel() {
  const [value, setValue] = useState(() => getLocalNickname() ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const nickname = setLocalNickname(value);
      if (IS_REMOTE_CONFIGURED) await updateNickname(nickname);
      setValue(nickname);
      setMessage("Nickname saved for shared boards.");
      track("nickname_set", {});
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Nickname could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border bg-white p-4 dark:bg-zinc-900">
      <label htmlFor="progress-nickname" className="text-sm font-bold">Nickname for shared boards</label>
      <p className="mt-1 text-xs text-zinc-500">Optional. This is the only public identity shown on ranked or shared features.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input id="progress-nickname" value={value} onChange={(e) => setValue(e.target.value)} maxLength={24} placeholder="e.g. steady typer" className="min-h-11 flex-1 rounded-lg border px-3 text-sm dark:bg-zinc-800" />
        <button type="button" disabled={saving} onClick={() => void save()} className="min-h-11 rounded-full bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-black">{saving ? "Saving…" : "Save nickname"}</button>
      </div>
      {message && <p role="status" className="mt-2 text-xs text-zinc-500">{message}</p>}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-lg border bg-white p-3 text-center dark:bg-zinc-900"><div className="text-xs text-zinc-500">{label}</div><div className="text-2xl font-black">{value}</div>{sub && <div className="text-xs text-zinc-500">{sub}</div>}</div>;
}

function Row({ head, sub, badge }: { head: string; sub: string; badge: string }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3"><div><div className="text-sm font-semibold">{head}</div><div className="text-xs text-zinc-500">{sub}</div></div><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge === "ranked" ? "bg-emerald-100 text-emerald-800" : badge === "flagged" ? "bg-red-100 text-red-800" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>{badge}</span></div>;
}

function Empty({ label, href, cta }: { label: string; href: string; cta: string }) {
  return <div className="p-8 text-center"><p className="text-sm text-zinc-500">{label}</p><Link href={href} className="mt-2 inline-flex min-h-11 items-center rounded-full bg-black px-5 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-black">{cta}</Link></div>;
}
