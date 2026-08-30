"use client";

import TranscriptionPanel from "@/components/TranscriptionPanel";
import { SafeAdSlot } from "@/components/AdSlot";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import { getRouteByPath } from "@/lib/routeRegistry";

const TRANSCRIPTION_ROUTE = getRouteByPath("/transcription-practice");

export default function TranscriptionPracticePage() {
  return (
    <ToolPageShell
      eyebrow="Practice"
      title="Transcription Sprint"
      description="Full-length clips (30s+). Type words, punctuation, and numbers. Replays, pauses, and seeks are measured so you can improve deliberate listening."
    >
      <TranscriptionPanel />
      <SafeAdSlot slot="transcription" context="outside-task" className="mt-8" />
      {TRANSCRIPTION_ROUTE && <RelatedTools route={TRANSCRIPTION_ROUTE} />}
    </ToolPageShell>
  );
}
