"use client";
import TeamsPanel from "@/components/TeamsPanel";
import FeaturePageShell from "@/components/FeaturePageShell";
import { FEATURE_COPY } from "@/components/pageCopy";

export default function TeamsPage() {
  return (
    <FeaturePageShell routePath="/teams" slot="teams" copy={FEATURE_COPY.teams}>
      <TeamsPanel />
    </FeaturePageShell>
  );
}
