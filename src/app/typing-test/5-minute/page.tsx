"use client";
import { TypingRoutePage } from "@/components/PracticeRoutePage";

export default function FiveMinutePage() {
  return <TypingRoutePage routePath="/typing-test/5-minute" slot="typing-5min" initialDuration={300} />;
}
