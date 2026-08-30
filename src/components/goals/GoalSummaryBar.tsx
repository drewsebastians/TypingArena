"use client";

import type { GoalDefinition } from "@/lib/goals";

export default function GoalSummaryBar({ goal, locale }: { goal: GoalDefinition; locale: "en" | "id" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{locale === "en" ? "Selected goal" : "Tujuan dipilih"}</p>
        <h2 className="mt-1 text-xl font-black">{goal.title[locale]}</h2>
      </div>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{goal.subtitle[locale]}</p>
    </div>
  );
}
