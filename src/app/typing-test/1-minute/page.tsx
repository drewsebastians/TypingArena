"use client";
import { TypingRoutePage } from "@/components/PracticeRoutePage";

export default function OneMinutePage() {
  return <TypingRoutePage routePath="/typing-test/1-minute" slot="typing-1min" initialDuration={60} />;
}
