"use client";
import MultiplayerPanel from "@/components/MultiplayerPanel";
import FeaturePageShell from "@/components/FeaturePageShell";
import { FEATURE_COPY } from "@/components/pageCopy";

export default function MultiplayerPage() {
  return (
    <FeaturePageShell routePath="/multiplayer" slot="multiplayer" copy={FEATURE_COPY.multiplayer}>
      <MultiplayerPanel />
    </FeaturePageShell>
  );
}
