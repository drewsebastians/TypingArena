"use client";

import { GOALS, type GoalDefinition, type GoalId } from "@/lib/goals";
import GoalCard from "./GoalCard";

export default function GoalGrid({
  selected,
  locale,
  onSelect,
}: {
  selected: GoalId;
  locale: "en" | "id";
  onSelect: (id: GoalId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Choose a goal">
      {GOALS.map((goal: GoalDefinition) => (
        <GoalCard key={goal.id} goal={goal} locale={locale} selected={goal.id === selected} onSelect={onSelect} />
      ))}
    </div>
  );
}
