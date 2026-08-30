"use client";
import CustomPanel from "@/components/CustomPanel";
import FeaturePageShell from "@/components/FeaturePageShell";
import { FEATURE_COPY } from "@/components/pageCopy";

export default function CustomPage() {
  return (
    <FeaturePageShell routePath="/custom" slot="custom" copy={FEATURE_COPY.custom}>
      <CustomPanel />
    </FeaturePageShell>
  );
}
