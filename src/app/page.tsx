"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TypingTestPanel from "@/components/TypingTestPanel";
import ActiveTaskBoundary from "@/components/tool/ActiveTaskBoundary";
import { SafeAdSlot } from "@/components/AdSlot";
import { useLocale } from "@/components/LocaleProvider";
import {
  getStreak,
  loadCareerHistory,
  loadDictationHistory,
  loadTranscriptionHistory,
  loadTypingHistory,
} from "@/lib/history";
import { buildSkillMatrix, nextExerciseRecommendation } from "@/lib/skillMatrix";
import type { CareerAssessmentResult } from "@/lib/career";
import type { DictationResult, TranscriptionResult, TypingResult } from "@/lib/types";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import { track } from "@/lib/analytics";

const COPY = {
  en: {
    eyebrow: "TypingArena · human input-performance practice",
    title: "Type what you see or hear — accurately and quickly.",
    support: "Start with a real 30-second typing sprint. No account or setup required.",
    typingEyebrow: "Typing workspace",
    typingTitle: "Start typing",
    typingHint: "Click the stream and type; the timer starts on your first key.",
    fullWorkspace: "Open full typing workspace →",
    exploreEyebrow: "Practice paths",
    exploreTitle: "Build the skill you need next",
    listeningTitle: "Listening",
    listeningBody: "Hear a reviewed clip, then type exactly what you heard.",
    listeningLink: "Try dictation",
    transcriptionTitle: "Transcription",
    transcriptionBody: "Work through longer clips with punctuation, replay, and focus feedback.",
    transcriptionLink: "Open transcription",
    workTitle: "Work Skills",
    workBody: "Practice data entry, punctuation precision, and structured career modules.",
    workLink: "Explore work skills",
    arenaEyebrow: "Compete when you want",
    arenaTitle: "Today’s Arena",
    arenaBody: "Take the same standardized challenge as everyone else. Local practice remains available if shared boards are offline.",
    arenaLink: "Enter Today’s Arena →",
    progressEyebrow: "Your local record",
    progressTitle: "Progress on this device",
    progressBody: "Your results stay in this browser by default. Keep building from your latest work.",
    progressLink: "View progress →",
    teamsEyebrow: "For teams",
    teamsTitle: "A simple workspace for practice groups",
    teamsBody: "Create custom tests, assign reviewed modules, and share results only when you choose.",
    teamsLink: "Explore For Teams →",
    trustTitle: "How TypingArena works",
    trustBody: "Typing, listening, and transcription use reviewed static content and transparent deterministic scoring. No runtime AI, account, or hidden setup is required; ordinary practice is saved locally.",
    loading: "Loading typing workspace…",
    tests: "typing tests",
    dictations: "dictations",
    transcriptions: "transcriptions",
    career: "career modules",
  },
  id: {
    eyebrow: "TypingArena · latihan performa input manusia",
    title: "Ketik yang kamu lihat atau dengar — akurat dan cepat.",
    support: "Mulai dengan sprint mengetik 30 detik yang nyata. Tanpa akun atau pengaturan.",
    typingEyebrow: "Ruang mengetik",
    typingTitle: "Mulai mengetik",
    typingHint: "Klik aliran teks dan ketik; waktu dimulai saat tombol pertama ditekan.",
    fullWorkspace: "Buka ruang mengetik lengkap →",
    exploreEyebrow: "Jalur latihan",
    exploreTitle: "Bangun keterampilan berikutnya",
    listeningTitle: "Menyimak",
    listeningBody: "Dengarkan klip terkurasi, lalu ketik persis yang kamu dengar.",
    listeningLink: "Coba dikte",
    transcriptionTitle: "Transkripsi",
    transcriptionBody: "Kerjakan klip lebih panjang dengan tanda baca, replay, dan umpan balik fokus.",
    transcriptionLink: "Buka transkripsi",
    workTitle: "Keterampilan Kerja",
    workBody: "Latih entri data, ketelitian tanda baca, dan modul karier terstruktur.",
    workLink: "Lihat keterampilan kerja",
    arenaEyebrow: "Bersaing saat siap",
    arenaTitle: "Arena Hari Ini",
    arenaBody: "Ikuti tantangan standar yang sama seperti semua orang. Latihan lokal tetap tersedia saat papan bersama offline.",
    arenaLink: "Masuk Arena Hari Ini →",
    progressEyebrow: "Catatan lokalmu",
    progressTitle: "Kemajuan di perangkat ini",
    progressBody: "Hasilmu tersimpan di browser ini secara default. Lanjutkan dari latihan terakhirmu.",
    progressLink: "Lihat kemajuan →",
    teamsEyebrow: "Untuk tim",
    teamsTitle: "Ruang sederhana untuk grup latihan",
    teamsBody: "Buat tes khusus, tugaskan modul terkurasi, dan bagikan hasil hanya saat kamu memilihnya.",
    teamsLink: "Lihat Untuk Tim →",
    trustTitle: "Cara kerja TypingArena",
    trustBody: "Mengetik, menyimak, dan transkripsi menggunakan konten statis terkurasi dan skoring deterministik yang transparan. Tanpa AI saat runtime, akun, atau pengaturan tersembunyi; latihan biasa tersimpan secara lokal.",
    loading: "Memuat ruang mengetik…",
    tests: "tes mengetik",
    dictations: "dikte",
    transcriptions: "transkripsi",
    career: "modul karier",
  },
} as const;

type HomeSnapshot = {
  typing: TypingResult[];
  dictation: DictationResult[];
  transcription: TranscriptionResult[];
  career: CareerAssessmentResult[];
  streak: number;
};

function readHomeSnapshot(): HomeSnapshot {
  return {
    typing: loadTypingHistory(),
    dictation: loadDictationHistory(),
    transcription: loadTranscriptionHistory(),
    career: loadCareerHistory(),
    streak: getStreak().current,
  };
}

export default function Home() {
  const { locale } = useLocale();
  const copy = COPY[locale];
  const [snapshot, setSnapshot] = useState<HomeSnapshot | null>(null);
  const [workspaceLifecycle, setWorkspaceLifecycle] = useState<TaskLifecycle>("ready");
  const workspaceStarted = useRef(false);

  useEffect(() => {
    track("landing_view", {});
    track("home_workspace_viewed", {});
    setSnapshot(readHomeSnapshot());
  }, []);

  const onWorkspaceLifecycle = (state: TaskLifecycle) => {
    setWorkspaceLifecycle(state);
    if (state === "result") setSnapshot(readHomeSnapshot());
    if (state === "active" && !workspaceStarted.current) {
      workspaceStarted.current = true;
      track("home_workspace_started", { durationSec: 30, mode: "sprint", language: "en" });
    }
  };

  const hasHistory = Boolean(snapshot && (snapshot.typing.length + snapshot.dictation.length + snapshot.transcription.length + snapshot.career.length > 0));
  const recommendation = snapshot && snapshot.typing.length > 0
    ? nextExerciseRecommendation(buildSkillMatrix(snapshot.typing, snapshot.dictation, snapshot.transcription), snapshot.typing.length)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
      <section className="mx-auto max-w-4xl" aria-labelledby="home-title">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">{copy.eyebrow}</p>
        <h1 id="home-title" className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">{copy.support}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Start free · no setup</span>
          <span className="rounded-full border bg-white px-3 py-1.5 dark:bg-zinc-900">English + Bahasa Indonesia</span>
          <span className="rounded-full border bg-white px-3 py-1.5 dark:bg-zinc-900">Deterministic scoring · no runtime AI</span>
        </div>
      </section>

      <section data-home-workspace className="mx-auto mt-8 max-w-5xl rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:mt-10 sm:p-6" aria-labelledby="home-workspace-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{copy.typingEyebrow}</p>
            <h2 id="home-workspace-title" className="mt-1 text-2xl font-black">{copy.typingTitle}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{copy.typingHint}</p>
          </div>
          <Link href="/typing-test" onClick={() => track("home_open_full_typing", { destination: "/typing-test" })} className="inline-flex min-h-11 items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-bold hover:border-black dark:border-zinc-700 dark:hover:border-white">{copy.fullWorkspace}</Link>
        </div>
        <ActiveTaskBoundary state={workspaceLifecycle} className="mt-5">
          <div data-home-typing-workspace>
            <Suspense fallback={<WorkspaceLoading label={copy.loading} />}>
              <TypingTestPanel autoFocus={false} onLifecycleChange={onWorkspaceLifecycle} />
            </Suspense>
          </div>
        </ActiveTaskBoundary>
      </section>

      {recommendation && (
        <section className="mx-auto mt-6 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40 sm:p-5" aria-labelledby="home-recommendation-title">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">Recommended next</p>
              <h2 id="home-recommendation-title" className="mt-1 text-xl font-black text-amber-950 dark:text-amber-100">{recommendation.label}</h2>
              <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">{recommendation.reason}</p>
            </div>
            <Link href={recommendation.href} onClick={() => { track("home_recommended_next_clicked", { destination: recommendation.href }); track("next_recommended_start", { label: recommendation.label }); }} className="inline-flex min-h-11 items-center rounded-full bg-black px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Start next →</Link>
          </div>
        </section>
      )}

      <section className="mx-auto mt-10 max-w-5xl" aria-labelledby="home-practice-title">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{copy.exploreEyebrow}</p>
        <h2 id="home-practice-title" className="mt-1 text-2xl font-black">{copy.exploreTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SkillLane title={copy.listeningTitle} body={copy.listeningBody} link={copy.listeningLink} href="/dictation" skill="listening" />
          <SkillLane title={copy.transcriptionTitle} body={copy.transcriptionBody} link={copy.transcriptionLink} href="/transcription-practice" skill="transcription" />
          <SkillLane title={copy.workTitle} body={copy.workBody} link={copy.workLink} href="/career" skill="work-skills" />
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-5xl gap-4 md:grid-cols-[1.3fr_1fr]" aria-labelledby="home-arena-title">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/40">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">{copy.arenaEyebrow}</p>
          <h2 id="home-arena-title" className="mt-2 text-2xl font-black text-violet-950 dark:text-violet-100">{copy.arenaTitle}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-violet-900/80 dark:text-violet-200/80">{copy.arenaBody}</p>
          <Link href="/daily-arena" onClick={() => track("home_skill_explored", { skill: "arena" })} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800">{copy.arenaLink}</Link>
        </div>
        {hasHistory && snapshot && (
          <div className="rounded-2xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="home-progress-title">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{copy.progressEyebrow}</p>
            <h2 id="home-progress-title" className="mt-2 text-xl font-black">{copy.progressTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{copy.progressBody}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <PreviewStat value={snapshot.typing.length} label={copy.tests} />
              <PreviewStat value={snapshot.dictation.length} label={copy.dictations} />
              <PreviewStat value={snapshot.transcription.length} label={copy.transcriptions} />
              <PreviewStat value={snapshot.streak} label="streak" />
            </div>
            {snapshot.typing[0] && <p className="mt-3 text-xs text-zinc-500">Latest sprint: {snapshot.typing[0].grossWpm} WPM at {snapshot.typing[0].accuracy}% accuracy.</p>}
            <Link href="/progress" onClick={() => track("home_skill_explored", { skill: "progress" })} className="mt-4 inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-bold hover:border-black dark:border-zinc-700 dark:hover:border-white">{copy.progressLink}</Link>
          </div>
        )}
      </section>

      <section className="mx-auto mt-6 max-w-5xl rounded-2xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900" aria-labelledby="home-teams-title">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{copy.teamsEyebrow}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 id="home-teams-title" className="text-xl font-black">{copy.teamsTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{copy.teamsBody}</p>
          </div>
          <Link href="/teams" onClick={() => track("home_skill_explored", { skill: "teams" })} className="inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-bold hover:border-black dark:border-zinc-700 dark:hover:border-white">{copy.teamsLink}</Link>
        </div>
      </section>

      <details className="mx-auto mt-6 max-w-5xl rounded-2xl border bg-white p-4 dark:bg-zinc-900">
        <summary className="cursor-pointer list-none text-sm font-bold">{copy.trustTitle}</summary>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">{copy.trustBody}</p>
      </details>

      <div className="mx-auto mt-8 max-w-5xl">
        <SafeAdSlot slot="home-discovery" context="discovery" />
      </div>
    </div>
  );
}

function SkillLane({ title, body, link, href, skill }: { title: string; body: string; link: string; href: string; skill: string }) {
  return (
    <article className="flex min-h-[190px] flex-col rounded-2xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{body}</p>
      <Link href={href} onClick={() => track("home_skill_explored", { skill })} className="mt-auto inline-flex min-h-11 items-center self-start pt-4 text-sm font-bold underline underline-offset-4">{link} →</Link>
    </article>
  );
}

function PreviewStat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800"><div className="text-xl font-black">{value}</div><div className="text-[11px] text-zinc-500">{label}</div></div>;
}

function WorkspaceLoading({ label }: { label: string }) {
  return <div className="rounded-2xl border p-8 text-center text-sm text-zinc-500">{label}</div>;
}
