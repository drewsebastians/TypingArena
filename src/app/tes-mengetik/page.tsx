"use client";
import { Suspense } from "react";
import TypingTestPanel from "@/components/TypingTestPanel";
import SkillProfile from "@/components/SkillProfile";
import AdSlot from "@/components/AdSlot";

export default function TesMengetikPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-center text-2xl font-black">Tes Mengetik Cepat</h1>
      <p className="mx-auto mt-1 max-w-xl text-center text-sm text-zinc-600 dark:text-zinc-400">
        Ukur kecepatan (WPM) dan akurasi mengetik Anda. Gratis, tanpa pendaftaran. Tes berjalan sesuai durasi — teks terus mengalir sampai waktu habis.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="py-16 text-center text-sm text-zinc-500">Memuat…</div>}>
          <TypingTestPanel initialLanguage="id" />
        </Suspense>
      </div>
      <div className="mt-10 flex flex-col items-center gap-6">
        <SkillProfile />
        <AdSlot slot="tes-mengetik" />
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-xl border bg-white p-4 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        <strong>Cara kerja:</strong> WPM = karakter ÷ 5 ÷ menit. Akurasi dihitung dari teks yang benar-benar Anda ketik. Setiap hasil mencatat versi skoringnya sehingga riwayat selalu bisa dibandingkan.
      </div>
    </div>
  );
}
