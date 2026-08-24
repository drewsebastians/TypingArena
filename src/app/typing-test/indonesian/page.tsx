"use client";
import { Suspense } from "react";
import TypingTestPanel from "@/components/TypingTestPanel";
import SkillProfile from "@/components/SkillProfile";
import AdSlot from "@/components/AdSlot";

export default function IndonesianTypingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-center text-2xl font-black">Tes Mengetik — Bahasa Indonesia</h1>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Uji kecepatan dan akurasi mengetik dengan korpus Bahasa Indonesia. Tes berjalan sesuai durasi penuh.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Memuat…</div>}>
          <TypingTestPanel initialLanguage="id" />
        </Suspense>
      </div>
      <div className="mt-10 flex flex-col items-center gap-6">
        <SkillProfile />
        <AdSlot slot="typing-id" />
      </div>
    </div>
  );
}
