"use client";
import DictationPanel from "@/components/DictationPanel";
import AdSlot from "@/components/AdSlot";
import SkillProfile from "@/components/SkillProfile";

export default function IndonesianDictationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-center text-2xl font-black">Dikte Bahasa Indonesia</h1>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Dengarkan klip audio dan ketik persis apa yang Anda dengar — tanda baca dan huruf kapital dihitung.
      </p>
      <div className="mt-8">
        <DictationPanel initialLanguage="id" lockLanguage />
      </div>
      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-6">
        <SkillProfile />
        <AdSlot slot="dictation-id" />
      </div>
    </div>
  );
}
