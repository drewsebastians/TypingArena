"use client";
import AssessmentsPanel from "@/components/AssessmentsPanel";
import FeaturePageShell from "@/components/FeaturePageShell";
import { FEATURE_COPY } from "@/components/pageCopy";

export default function AssessmentsPage() {
  return (
    <FeaturePageShell routePath="/assessments" slot="assessments" copy={FEATURE_COPY.assessments}>
      <AssessmentsPanel />
    </FeaturePageShell>
  );
}
