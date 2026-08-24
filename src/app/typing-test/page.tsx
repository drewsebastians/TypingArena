"use client";
import { Suspense } from "react";
import TypingTestPanel from "@/components/TypingTestPanel";
import SkillProfile from "@/components/SkillProfile";
import AdSlot from "@/components/AdSlot";

export default function TypingTestPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-center text-2xl font-black">Typing Speed Test</h1>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Timed tests run the full clock — passages keep coming until time expires. Accuracy counts only what you actually typed.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Loading…</div>}>
          <TypingTestPanel />
        </Suspense>
      </div>
      <div className="mt-10 flex flex-col items-center gap-6">
        <SkillProfile />
        <AdSlot slot="typing-test" />
      </div>
    </div>
  );
}
