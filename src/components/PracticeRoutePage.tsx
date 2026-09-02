"use client";

import { Suspense, useState } from "react";
import TypingTestPanel from "@/components/TypingTestPanel";
import DictationPanel from "@/components/DictationPanel";
import TranscriptionPanel from "@/components/TranscriptionPanel";
import SkillProfile from "@/components/SkillProfile";
import { SafeAdSlot } from "@/components/AdSlot";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import { getRouteByPath } from "@/lib/routeRegistry";
import { useLocale } from "@/components/LocaleProvider";
import type { Language, Mode } from "@/lib/types";
import PracticeFamilyNav from "@/components/PracticeFamilyNav";
import ActiveTaskBoundary from "@/components/tool/ActiveTaskBoundary";
import type { TaskLifecycle } from "@/lib/taskLifecycle";

type LocalizedCopy = {
  eyebrow: string;
  title: string;
  description: string;
  guidanceTitle: string;
  guidance: string;
  loading: string;
};

type CopyByLocale = { en: LocalizedCopy; id: LocalizedCopy };

const DEFAULT_TYPING_COPY: CopyByLocale = {
  en: {
    eyebrow: "Practice",
    title: "Typing Speed Test",
    description: "Timed tests run the full clock. Accuracy counts only what you actually typed, and every result explains what to practice next.",
    guidanceTitle: "How this typing test works",
    guidance: "Choose a language, duration, and content mode. Passages keep flowing until the clock ends, so a short result is a real measure of pace rather than a fixed paragraph finish.",
    loading: "Loading typing workspace…",
  },
  id: {
    eyebrow: "Latihan",
    title: "Tes Kecepatan Mengetik",
    description: "Tes berjalan sampai durasi penuh. Akurasi hanya menghitung teks yang benar-benar Anda ketik, lalu hasil memberi langkah latihan berikutnya.",
    guidanceTitle: "Cara kerja tes mengetik",
    guidance: "Pilih bahasa, durasi, dan mode teks. Teks terus mengalir sampai waktu habis, sehingga hasil singkat benar-benar mengukur kecepatan Anda.",
    loading: "Memuat ruang latihan mengetik…",
  },
};

const TYPING_ROUTE_COPY: Record<string, CopyByLocale> = {
  "/typing-test/1-minute": {
    en: { ...DEFAULT_TYPING_COPY.en, title: "1 Minute Typing Test", description: "A standard 60-second sprint with a full clock and continuous passages. See speed, accuracy, corrections, and your next training step.", guidance: "This route starts at 60 seconds. Type steadily until the clock expires; finishing a passage never ends the test early." },
    id: { ...DEFAULT_TYPING_COPY.id, title: "Tes Mengetik 1 Menit", description: "Sprint 60 detik dengan waktu penuh dan teks yang terus mengalir. Lihat kecepatan, akurasi, koreksi, dan langkah latihan berikutnya.", guidance: "Rute ini dimulai pada 60 detik. Ketik terus sampai waktu habis; menyelesaikan satu teks tidak mengakhiri tes lebih awal." },
  },
  "/typing-test/5-minute": {
    en: { ...DEFAULT_TYPING_COPY.en, title: "5 Minute Typing Test", description: "A true 300-second endurance test with continuous passages. Pace yourself and use the result to build reliable work stamina.", guidance: "This route starts at 300 seconds. The clock is the contract: passages keep coming until five minutes have elapsed." },
    id: { ...DEFAULT_TYPING_COPY.id, title: "Tes Mengetik 5 Menit", description: "Tes daya tahan 300 detik dengan teks yang terus mengalir. Atur ritme dan gunakan hasilnya untuk membangun stamina kerja.", guidance: "Rute ini dimulai pada 300 detik. Waktu adalah batasnya: teks terus muncul sampai lima menit berlalu." },
  },
  "/typing-test/indonesian": {
    en: { ...DEFAULT_TYPING_COPY.en, eyebrow: "Bahasa Indonesia", title: "Indonesian Typing Test", description: "Measure speed and accuracy against a reviewed Bahasa Indonesia corpus. No registration required; the full duration always applies.", guidanceTitle: "Indonesian typing practice", guidance: "The exercise uses Indonesian passages and keeps results on this device. Switch duration or content mode before starting a fresh attempt." },
    id: { ...DEFAULT_TYPING_COPY.id, eyebrow: "Bahasa Indonesia", title: "Tes Mengetik — Bahasa Indonesia", description: "Ukur kecepatan dan akurasi dengan korpus Bahasa Indonesia yang terkurasi. Tanpa pendaftaran; durasi penuh selalu berlaku.", guidanceTitle: "Latihan mengetik Bahasa Indonesia", guidance: "Latihan memakai teks Bahasa Indonesia dan menyimpan hasil di perangkat ini. Ubah durasi atau mode sebelum memulai percobaan baru." },
  },
  "/tes-mengetik": {
    en: { ...DEFAULT_TYPING_COPY.en, eyebrow: "Bahasa Indonesia", title: "Tes Mengetik Cepat", description: "Measure WPM and accuracy for free, without an account. The passage keeps flowing until the selected duration ends.", guidanceTitle: "How scoring works", guidance: "WPM = characters ÷ 5 ÷ minutes. Accuracy covers the text you actually typed, and each result records its scoring version for honest comparisons." },
    id: { ...DEFAULT_TYPING_COPY.id, eyebrow: "Latihan", title: "Tes Mengetik Cepat", description: "Ukur kecepatan (WPM) dan akurasi secara gratis tanpa pendaftaran. Teks terus mengalir sampai durasi yang dipilih habis.", guidanceTitle: "Cara kerja skoring", guidance: "WPM = karakter ÷ 5 ÷ menit. Akurasi menghitung teks yang benar-benar Anda ketik; setiap hasil menyimpan versi skoring agar perbandingan tetap jujur." },
  },
  "/data-entry-test": {
    en: { ...DEFAULT_TYPING_COPY.en, eyebrow: "Work readiness", title: "Data Entry Test", description: "Practice numbers, dates, phone numbers, item codes, and currency — the patterns real data-entry work demands.", guidanceTitle: "What this route trains", guidance: "The numbers mode emphasizes structured entries and punctuation. Accuracy matters first; use the result to repeat weak patterns before increasing speed." },
    id: { ...DEFAULT_TYPING_COPY.id, eyebrow: "Kesiapan kerja", title: "Tes Entri Data", description: "Latih angka, tanggal, nomor telepon, kode barang, dan mata uang — pola yang dibutuhkan pekerjaan entri data.", guidanceTitle: "Yang dilatih rute ini", guidance: "Mode angka menekankan entri terstruktur dan tanda baca. Utamakan akurasi; ulangi pola yang lemah sebelum menaikkan kecepatan." },
  },
  "/punctuation-typing-test": {
    en: { ...DEFAULT_TYPING_COPY.en, eyebrow: "Work readiness", title: "Punctuation Typing Test", description: "Build Copy Pro precision with commas, apostrophes, quotes, dashes, capitalization, and realistic business text.", guidanceTitle: "What this route trains", guidance: "Copy Pro keeps punctuation and capitalization visible in the score. Slow down enough to preserve exact text, then use the error heatmap for your next drill." },
    id: { ...DEFAULT_TYPING_COPY.id, eyebrow: "Kesiapan kerja", title: "Tes Mengetik Tanda Baca", description: "Bangun ketelitian Copy Pro dengan koma, apostrof, kutip, tanda pisah, kapitalisasi, dan teks bisnis yang realistis.", guidanceTitle: "Yang dilatih rute ini", guidance: "Copy Pro mempertahankan tanda baca dan kapitalisasi dalam skor. Ketik cukup pelan untuk menyalin teks dengan tepat, lalu gunakan heatmap kesalahan." },
  },
};

const DEFAULT_AUDIO_COPY: CopyByLocale = {
  en: {
    eyebrow: "Listen → type",
    title: "Dictation — Listen & Type Exactly",
    description: "Use reviewed static audio clips in English and Bahasa Indonesia. Strict and normalized scoring, word accuracy, and measured replays make listening progress visible.",
    guidanceTitle: "How audio practice works",
    guidance: "Play the clip, type what you hear, and submit when you are ready. The transcript stays hidden until the result, while replays and pauses remain part of the feedback.",
    loading: "Loading audio workspace…",
  },
  id: {
    eyebrow: "Dengar → ketik",
    title: "Dikte — Dengarkan & Ketik Tepat",
    description: "Gunakan klip audio statis yang terkurasi dalam Bahasa Inggris dan Bahasa Indonesia. Skor ketat, normalisasi, akurasi kata, dan replay membuat kemajuan menyimak terlihat.",
    guidanceTitle: "Cara kerja latihan audio",
    guidance: "Putar klip, ketik yang Anda dengar, lalu kirim saat siap. Transkrip tetap tersembunyi sampai hasil muncul; replay dan jeda menjadi bagian dari umpan balik.",
    loading: "Memuat ruang latihan audio…",
  },
};

const TRANSCRIPTION_COPY: CopyByLocale = {
  en: {
    eyebrow: "Listen → transcribe",
    title: "Transcription Sprint",
    description: "Work through full-length static clips with words, punctuation, and numbers. Replays, pauses, seeks, and active typing time become useful feedback.",
    guidanceTitle: "How transcription practice works",
    guidance: "Play a clip, transcribe everything you hear, and submit when ready. The reference stays hidden until the result so the exercise measures listening and transcription rather than recall.",
    loading: "Loading transcription workspace…",
  },
  id: {
    eyebrow: "Dengar → transkripsi",
    title: "Sprint Transkripsi",
    description: "Kerjakan klip statis berdurasi penuh dengan kata, tanda baca, dan angka. Replay, jeda, seek, dan waktu mengetik aktif menjadi umpan balik.",
    guidanceTitle: "Cara kerja latihan transkripsi",
    guidance: "Putar klip, transkripsikan semua yang terdengar, lalu kirim saat siap. Referensi tetap tersembunyi sampai hasil agar latihan mengukur menyimak dan transkripsi.",
    loading: "Memuat ruang latihan transkripsi…",
  },
};

export function TypingRoutePage({
  routePath,
  copy,
  slot,
  initialLanguage,
  initialDuration,
  initialMode,
}: {
  routePath: string;
  copy?: CopyByLocale;
  slot: string;
  initialLanguage?: Language;
  initialDuration?: 15 | 30 | 60 | 300;
  initialMode?: Mode;
}) {
  const { locale } = useLocale();
  const content = (copy ?? TYPING_ROUTE_COPY[routePath] ?? DEFAULT_TYPING_COPY)[locale];
  const route = getRouteByPath(routePath);
  const [lifecycle, setLifecycle] = useState<TaskLifecycle>("ready");
  const taskActive = lifecycle === "active" || lifecycle === "completing";

  return (
    <ToolPageShell eyebrow={content.eyebrow} title={content.title} description={content.description}>
      <PracticeFamilyNav />
      <div className="flex flex-col items-center gap-6">
        <ActiveTaskBoundary state={lifecycle} className="w-full">
          <Suspense fallback={<div className="w-full py-16 text-center text-sm text-zinc-500">{content.loading}</div>}>
            <TypingTestPanel
              initialLanguage={initialLanguage}
              initialDuration={initialDuration}
              initialMode={initialMode}
              autoFocus={false}
              onLifecycleChange={setLifecycle}
            />
          </Suspense>
        </ActiveTaskBoundary>
        {!taskActive && <>
          <section className="w-full max-w-3xl rounded-xl border bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <h2 className="font-bold">{content.guidanceTitle}</h2>
            <p className="mt-1">{content.guidance}</p>
          </section>
          <SkillProfile />
          <SafeAdSlot slot={slot} context="outside-task" />
          {route && <RelatedTools route={route} />}
        </>}
      </div>
    </ToolPageShell>
  );
}

export function AudioRoutePage({
  kind,
  routePath,
  copy,
  slot,
  initialLanguage,
  lockLanguage = false,
}: {
  kind: "dictation" | "transcription";
  routePath: string;
  copy?: CopyByLocale;
  slot: string;
  initialLanguage?: Language;
  lockLanguage?: boolean;
}) {
  const { locale } = useLocale();
  const content = (copy ?? (kind === "transcription" ? TRANSCRIPTION_COPY : DEFAULT_AUDIO_COPY))[locale];
  const route = getRouteByPath(routePath);
  const [lifecycle, setLifecycle] = useState<TaskLifecycle>("ready");
  const taskActive = lifecycle === "active" || lifecycle === "completing";

  return (
    <ToolPageShell eyebrow={content.eyebrow} title={content.title} description={content.description}>
      <PracticeFamilyNav />
      <div className="flex flex-col items-center gap-6">
        <ActiveTaskBoundary state={lifecycle} className="w-full">
          {kind === "dictation" ? (
            <DictationPanel initialLanguage={initialLanguage} lockLanguage={lockLanguage} onLifecycleChange={setLifecycle} />
          ) : (
            <TranscriptionPanel initialLanguage={initialLanguage} lockLanguage={lockLanguage} onLifecycleChange={setLifecycle} />
          )}
        </ActiveTaskBoundary>
        {!taskActive && <>
          <section className="w-full max-w-3xl rounded-xl border bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <h2 className="font-bold">{content.guidanceTitle}</h2>
            <p className="mt-1">{content.guidance}</p>
          </section>
          <SkillProfile />
          <SafeAdSlot slot={slot} context="outside-task" />
          {route && <RelatedTools route={route} />}
        </>}
      </div>
    </ToolPageShell>
  );
}
