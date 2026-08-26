"use client";
// Progress — private history + skill profile + optional account. (noindex)
import { useEffect, useState } from "react";
import Link from "next/link";
import { buildSkillMatrix, nextExerciseRecommendation } from "@/lib/skillMatrix";
import { getStreak, loadCareerHistory, loadDictationHistory, loadTranscriptionHistory, loadTypingHistory } from "@/lib/history";
import { flushQueue, pendingSyncCount } from "@/lib/sync";
import { track } from "@/lib/analytics";
import AccountPanel from "@/components/AccountPanel";
import PrivacyPanel from "@/components/PrivacyPanel";
import AdSlot from "@/components/AdSlot";

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
    // Honest sync state: never claim success when persistence is pending.
    setPending(pendingSyncCount());
    const id = window.setInterval(() => setPending(pendingSyncCount()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = () => {
    setTyping(loadTypingHistory());
    setDictation(loadDictationHistory());
    setTranscription(loadTranscriptionHistory());
    setCareer(loadCareerHistory());
    setPending(pendingSyncCount());
  };

  const syncNow = async () => {
    setSyncMsg(null);
    try {
      const r = await flushQueue();
      setPending(r.remaining);
      setSyncMsg(r.remaining === 0 ? "All results synced." : `${r.remaining} still waiting — will retry automatically.`);
    } catch (e) {
      setPending(pendingSyncCount());
      setSyncMsg(e instanceof Error ? e.message : "Sync failed — results stay safe locally and retry later.");
    }
  };

  const matrix = buildSkillMatrix(typing, dictation, transcription);
  const rec = nextExerciseRecommendation(matrix, typing.length);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">Your Progress</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Private by default — stored on this device until you sign in to sync.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Typing tests" value={String(typing.length)} />
        <Stat label="Dictations" value={String(dictation.length)} />
        <Stat label="Transcriptions" value={String(transcription.length)} />
        <Stat label="Streak" value={`${streak}d`} sub="Asia/Jakarta days" />
      </div>
      {career.length > 0 && (
        <p className="mt-2 text-xs text-zinc-500">
          {career.length} career assessment{career.length === 1 ? "" : "s"} on record — see the <Link href="/career" className="underline">Career page</Link>.
        </p>
      )}

      <AccountPanel onChanged={refresh} />

      {pending > 0 && (
        <div role="status" className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span>{pending} result{pending === 1 ? "" : "s"} saved locally and waiting to sync.</span>
          <button onClick={() => void syncNow()} className="rounded-full border px-3 py-1 font-semibold">Sync now</button>
          {syncMsg && <span>{syncMsg}</span>}
        </div>
      )}
      {pending === 0 && syncMsg && (
        <p role="status" className="mt-2 text-xs text-emerald-700">{syncMsg}</p>
      )}

      <div className="mt-6 rounded-xl bg-black p-4 text-white dark:bg-white dark:text-black">
        <div className="text-xs uppercase tracking-widest opacity-60">Recommended next</div>
        <div className="text-lg font-bold">{rec.label}</div>
        <div className="text-sm opacity-80">{rec.reason}</div>
        <Link href={rec.href} onClick={() => track("next_recommended_start", { label: rec.label })} className="mt-2 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black dark:bg-black dark:text-white">
          Start →
        </Link>
      </div>

      <div className="mt-6">
        <div className="flex gap-2">
          {(["typing", "dictation", "transcription"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${tab === t ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 divide-y rounded-xl border bg-white dark:bg-zinc-900">
          {tab === "typing" &&
            (typing.length === 0 ? (
              <Empty label="No typing tests yet" href="/typing-test" cta="Take a 30s sprint" />
            ) : (
              typing.slice(0, 25).map((r) => (
                <Row
                  key={r.id}
                  head={`${r.grossWpm} WPM • ${r.accuracy}%`}
                  sub={`${r.durationSec}s ${r.language} • ${new Date(r.timestamp).toLocaleString()} • errors fixed ${r.correctedErrors}/unfixed ${r.uncorrectedErrors}`}
                  badge={r.integrity}
                />
              ))
            ))}
          {tab === "dictation" &&
            (dictation.length === 0 ? (
              <Empty label="No dictations yet" href="/dictation" cta="Try English dictation" />
            ) : (
              dictation.slice(0, 25).map((r) => (
                <Row
                  key={r.id}
                  head={`${r.normalizedScore}% normalized • ${r.wordAccuracy}% words`}
                  sub={`${r.language} • replays ${r.playback.replayCount} • ratio ${r.playback.replayRatio ?? "—"}× • ${new Date(r.timestamp).toLocaleString()}`}
                  badge={r.integrity}
                />
              ))
            ))}
          {tab === "transcription" &&
            (transcription.length === 0 ? (
              <Empty label="No transcriptions yet" href="/transcription-practice" cta="Try Transcription Sprint" />
            ) : (
              transcription.slice(0, 25).map((r) => (
                <Row
                  key={r.id}
                  head={`${r.normalizedScore}% • ${r.effectiveWpm} eWPM`}
                  sub={`${r.language} ${r.difficulty} • ratio ${r.playback.replayRatio ?? "—"}× • pauses ${r.playback.pauseCount} • ${new Date(r.timestamp).toLocaleString()}`}
                  badge={r.integrity}
                />
              ))
            ))}
        </div>
      </div>

      <PrivacyPanel onDeleted={() => { setTyping([]); setDictation([]); setTranscription([]); setStreak(0); }} />

      <AdSlot slot="progress" className="mt-8" />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center dark:bg-zinc-900 border">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-black">{value}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function Row({ head, sub, badge }: { head: string; sub: string; badge: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <div className="text-sm font-semibold">{head}</div>
        <div className="text-xs text-zinc-500">{sub}</div>
      </div>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge === "ranked" ? "bg-emerald-100 text-emerald-800" : badge === "flagged" ? "bg-red-100 text-red-800" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>
        {badge}
      </span>
    </div>
  );
}

function Empty({ label, href, cta }: { label: string; href: string; cta: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-zinc-500">{label}</p>
      <Link href={href} className="mt-2 inline-block rounded-full bg-black px-5 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-black">{cta}</Link>
    </div>
  );
}
