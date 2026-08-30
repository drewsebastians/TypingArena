"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import TypingTestPanel from "@/components/TypingTestPanel";
import GoalGrid from "@/components/goals/GoalGrid";
import GoalSummaryBar from "@/components/goals/GoalSummaryBar";
import ActiveTaskBoundary from "@/components/tool/ActiveTaskBoundary";
import { SafeAdSlot } from "@/components/AdSlot";
import { useLocale } from "@/components/LocaleProvider";
import { getGoal, type GoalId } from "@/lib/goals";
import type { TaskLifecycle } from "@/lib/taskLifecycle";
import { track } from "@/lib/analytics";

// Keep the first typing workspace in the initial route bundle. Audio-heavy
// workspaces are loaded only after the visitor chooses those goals.
const HomeDictationPanel = dynamic(() => import("@/components/DictationPanel"), {
  ssr: false,
  loading: () => <WorkspaceLoading />,
});
const HomeTranscriptionPanel = dynamic(() => import("@/components/TranscriptionPanel"), {
  ssr: false,
  loading: () => <WorkspaceLoading />,
});

export default function Home() {
  const { locale } = useLocale();
  const [selected, setSelected] = useState<GoalId>("type-faster");
  const [lifecycle, setLifecycle] = useState<TaskLifecycle>("ready");
  const goal = getGoal(selected);

  useEffect(() => {
    track("landing_view", {});
    track("goal_first_view", { goal: "type-faster" });
  }, []);

  useEffect(() => {
    setLifecycle("ready");
    track("goal_workspace_ready", { goal: goal.id, workspace: goal.workspace });
  }, [goal.id, goal.workspace]);

  const chooseGoal = (id: GoalId) => {
    if (id === selected) return;
    setLifecycle("configuring");
    setSelected(id);
    track("goal_selected", { goal: id });
  };

  const openGoalRoute = () => {
    track("goal_to_route_click", { goal: goal.id, to: goal.destination });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <section className="mx-auto max-w-3xl text-center" aria-labelledby="home-title">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">TypingArena · goal-first practice</p>
        <h1 id="home-title" className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
          What do you want to improve today?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Choose one goal and start with a real exercise. Your practice stays on this device by default; shared challenges use the same deterministic engines and server-validated scores.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Start free · no setup</span>
          <span className="rounded-full border bg-white px-3 py-1.5 dark:bg-zinc-900">English + Bahasa Indonesia</span>
          <span className="rounded-full border bg-white px-3 py-1.5 dark:bg-zinc-900">Deterministic scoring · no runtime AI</span>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl" aria-labelledby="goal-heading">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Step 1</p>
            <h2 id="goal-heading" className="mt-1 text-xl font-black">Choose your goal</h2>
          </div>
          <span className="hidden text-sm text-zinc-500 sm:inline">You can switch goals anytime.</span>
        </div>
        <div className="mt-4">
          <GoalGrid selected={selected} locale={locale} onSelect={chooseGoal} />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-5xl rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6" aria-labelledby="workspace-heading">
        <GoalSummaryBar goal={goal} locale={locale} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p id="workspace-heading" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Step 2 · your workspace</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Start here, or open the full tool when you want more options.</p>
          </div>
          <Link
            href={goal.destination}
            onClick={openGoalRoute}
            className="min-h-11 rounded-full border border-zinc-300 px-4 py-2 text-sm font-bold hover:border-black dark:border-zinc-700 dark:hover:border-white"
          >
            Open full workspace →
          </Link>
        </div>

        <ActiveTaskBoundary key={goal.id} state={lifecycle} className="mt-5">
          <GoalWorkspace goal={goal.id} onLifecycleChange={setLifecycle} />
        </ActiveTaskBoundary>
      </section>

      <div className="mx-auto mt-8 max-w-5xl">
        <SafeAdSlot slot="home-discovery" context="discovery" />
      </div>

      <details className="mx-auto mt-8 max-w-5xl rounded-2xl border bg-white p-4 dark:bg-zinc-900">
        <summary className="cursor-pointer list-none text-sm font-bold">How TypingArena works</summary>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Exercises come from reviewed, versioned English and Indonesian content. Typing, dictation, and transcription results are scored locally with transparent rules. The next step is always visible after a result, so a practice session can keep moving without setup friction.
        </p>
      </details>
    </div>
  );
}

function GoalWorkspace({ goal, onLifecycleChange }: { goal: GoalId; onLifecycleChange: (state: TaskLifecycle) => void }) {
  if (goal === "type-faster") {
    return (
      <Suspense fallback={<WorkspaceLoading />}>
        <TypingTestPanel autoFocus={false} onLifecycleChange={onLifecycleChange} />
      </Suspense>
    );
  }
  if (goal === "listen-better") return <HomeDictationPanel onLifecycleChange={onLifecycleChange} />;
  if (goal === "transcribe-accurately") return <HomeTranscriptionPanel onLifecycleChange={onLifecycleChange} />;

  const content = {
    "prepare-for-work": {
      eyebrow: "Career workspace",
      title: "Build job-ready accuracy",
      body: "Use practical data-entry, punctuation, and transcription modules with transparent score bands.",
      primary: ["Explore Career Mode", "/career"],
      secondary: [["Data Entry Test", "/data-entry-test"], ["Punctuation Test", "/punctuation-typing-test"]],
    },
    compete: {
      eyebrow: "Arena workspace",
      title: "Take today’s shared challenge",
      body: "Everyone gets the same standardized challenge. Your score is saved locally and shared submissions are validated by the backend.",
      primary: ["Enter Daily Arena", "/daily-arena"],
      secondary: [["Leaderboard", "/leaderboard"], ["Multiplayer", "/multiplayer"]],
    },
    "teach-assess": {
      eyebrow: "Teaching workspace",
      title: "Set up structured practice",
      body: "Create a team, custom test, or candidate assessment. Management links keep resources recoverable without contact details.",
      primary: ["Open Teams", "/teams"],
      secondary: [["Custom Tests", "/custom"], ["Assessments", "/assessments"]],
    },
  }[goal];

  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-950">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{content.eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black">{content.title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">{content.body}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link href={content.primary[1]} className="min-h-11 rounded-full bg-black px-5 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">{content.primary[0]} →</Link>
        {content.secondary.map(([label, href]) => <Link key={href} href={href} className="min-h-11 rounded-full border px-4 py-2 text-sm font-semibold hover:border-black dark:border-zinc-700 dark:hover:border-white">{label}</Link>)}
      </div>
    </div>
  );
}

function WorkspaceLoading() {
  return <div className="rounded-2xl border p-8 text-center text-sm text-zinc-500">Loading workspace…</div>;
}
