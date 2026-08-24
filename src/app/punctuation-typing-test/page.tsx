"use client";
import { Suspense } from "react";
import TypingTestPanel from "@/components/TypingTestPanel";
import SkillProfile from "@/components/SkillProfile";
import AdSlot from "@/components/AdSlot";

export default function PunctuationTestPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-center text-2xl font-black">Punctuation Typing Test</h1>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Copy Pro precision — commas, apostrophes, quotes, dashes, capitalization and realistic business text.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Loading…</div>}>
          <TypingTestPanel initialMode="copy-pro" />
        </Suspense>
      </div>
      <div className="mt-10 flex flex-col items-center gap-6">
        <SkillProfile />
        <AdSlot slot="punctuation" />
      </div>
    </div>
  );
}
