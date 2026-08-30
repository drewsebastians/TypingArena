"use client";

import type { GoalDefinition } from "@/lib/goals";

export default function GoalCard({
  goal,
  locale,
  selected,
  onSelect,
}: {
  goal: GoalDefinition;
  locale: "en" | "id";
  selected: boolean;
  onSelect: (id: GoalDefinition["id"]) => void;
}) {
  const title = goal.title[locale];
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-goal-id={goal.id}
      onClick={() => onSelect(goal.id)}
      className={`group min-h-[132px] rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${selected ? "border-black bg-black text-white shadow-lg dark:border-white dark:bg-white dark:text-black" : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"}`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black ${selected ? "bg-white/15 dark:bg-black/10" : "bg-zinc-100 dark:bg-zinc-800"}`} aria-hidden>
        {goal.icon}
      </span>
      <span className="mt-3 block text-base font-black">{title}</span>
      <span className={`mt-1 block text-sm leading-snug ${selected ? "text-white/75 dark:text-black/70" : "text-zinc-600 dark:text-zinc-400"}`}>
        {goal.subtitle[locale]}
      </span>
      <span className={`mt-3 block text-xs font-bold uppercase tracking-wide ${selected ? "text-amber-200 dark:text-amber-700" : "text-zinc-500"}`}>
        {goal.cta[locale]} →
      </span>
    </button>
  );
}
