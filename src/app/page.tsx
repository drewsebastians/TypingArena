"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import TypingTestPanel from "@/components/TypingTestPanel";
import SkillProfile from "@/components/SkillProfile";
import AdSlot from "@/components/AdSlot";
import { track } from "@/lib/analytics";

const PRACTICE = [
  { href: "/typing-test", title: "Typing Speed Test", desc: "15/30/60s & 5-minute WPM" },
  { href: "/typing-test/1-minute", title: "1 Minute Test", desc: "The classic 60s sprint" },
  { href: "/typing-test/5-minute", title: "5 Minute Test", desc: "True endurance" },
  { href: "/tes-mengetik", title: "Tes Mengetik Cepat", desc: "Uji kecepatan (ID)" },
  { href: "/dictation/english", title: "English Dictation", desc: "Listen → type exactly" },
  { href: "/dictation/indonesian", title: "Dikte Indonesia", desc: "Latihan mendengar & menulis" },
  { href: "/transcription-practice", title: "Transcription", desc: "30–120s clips, replay analytics" },
  { href: "/transcription-library", title: "Library", desc: "Browse all EN/ID clips" },
  { href: "/data-entry-test", title: "Data Entry", desc: "Numbers, dates, codes" },
  { href: "/punctuation-typing-test", title: "Punctuation", desc: "Precision with symbols" },
  { href: "/noise-challenge", title: "Noise Challenge", desc: "Dictation under noise" },
] as const;
const COMPETE = [
  { href: "/daily-arena", title: "Daily Arena", desc: "Same challenge for everyone, daily" },
  { href: "/leaderboard", title: "Leaderboard", desc: "Ranked results by mode" },
  { href: "/seasons", title: "Ranked Seasons", desc: "Monthly ladders & archives" },
  { href: "/multiplayer", title: "Multiplayer Race", desc: "Real-time rooms with friends" },
  { href: "/friends", title: "Friend Challenges", desc: "Async share links" },
] as const;
const WORK = [
  { href: "/teams", title: "Teams & Classrooms", desc: "Assignments + dashboards" },
  { href: "/career", title: "Career Mode", desc: "Practice assessments, score bands" },
  { href: "/custom", title: "Custom Tests", desc: "Your passages, shareable links" },
  { href: "/assessments", title: "Assessments", desc: "Invite-based skills checks" },
] as const;

export default function Home() {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    track("landing_view", {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Train and prove how quickly you turn what you <span className="underline decoration-amber-400 decoration-4">see or hear</span> into text.
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          One arena for <strong>typing, dictation &amp; transcription</strong>. No login required. Timed tests run the full clock. English + Bahasa Indonesia.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">Free • No signup to start</span>
          <span className="rounded-full border bg-white px-3 py-1 dark:bg-zinc-900">English + Indonesia</span>
          <span className="rounded-full border bg-white px-3 py-1 dark:bg-zinc-900">Deterministic scoring • no AI at runtime</span>
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Loading…</div>}>
          <TypingTestPanel />
        </Suspense>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-6">
        <SkillProfile />
        <AdSlot slot="home-results" />
      </div>

      {/* Grouped discovery — progressive disclosure keeps first action obvious */}
      <div className="mx-auto mt-10 w-full max-w-3xl">
        <section aria-labelledby="explore-practice">
          <h2 id="explore-practice" className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            Practice — type, listen, transcribe
          </h2>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            {PRACTICE.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-xl border bg-white p-4 transition hover:border-black dark:bg-zinc-900 dark:hover:border-white">
                <div className="font-bold">{c.title}</div>
                <div className="text-xs text-zinc-500">{c.desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {showAll ? (
          <>
            <section aria-labelledby="explore-compete" className="mt-8">
              <h2 id="explore-compete" className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Compete — daily, ranked, and social
              </h2>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {COMPETE.map((c) => (
                  <Link key={c.href} href={c.href} className="rounded-xl border bg-white p-4 transition hover:border-black dark:bg-zinc-900 dark:hover:border-white">
                    <div className="font-bold">{c.title}</div>
                    <div className="text-xs text-zinc-500">{c.desc}</div>
                  </Link>
                ))}
              </div>
            </section>
            <section aria-labelledby="explore-work" className="mt-8">
              <h2 id="explore-work" className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                Teams & creation — classrooms and custom work
              </h2>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {WORK.map((c) => (
                  <Link key={c.href} href={c.href} className="rounded-xl border bg-white p-4 transition hover:border-black dark:bg-zinc-900 dark:hover:border-white">
                    <div className="font-bold">{c.title}</div>
                    <div className="text-xs text-zinc-500">{c.desc}</div>
                  </Link>
                ))}
              </div>
            </section>
            <div className="mt-4 text-center">
              <button onClick={() => setShowAll(false)} className="rounded-full border px-5 py-2 text-sm">
                Show less
              </button>
            </div>
          </>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowAll(true);
                track("explore_all_tools", {});
              }}
              className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Explore all tools — compete, teams & more
            </button>
          </div>
        )}
      </div>

      <details className="mx-auto mt-6 w-full max-w-3xl rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <summary className="cursor-pointer list-none text-sm font-semibold">How scoring and content work</summary>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          Every exercise comes from a reviewed, versioned corpus — nothing is generated on the fly. Scoring is deterministic (gross/net WPM, typed-scope
          accuracy, aligned per-key and bigram analysis, correction latency) and each result records its scoring version. The next exercise recommendation is
          rule-based on your own history.
        </p>
      </details>
    </div>
  );
}
