"use client";
// Transcription Library — browsable, filterable clip collection.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TRANSCRIPTION_CLIPS } from "@/lib/content/dictation";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import type { Language } from "@/lib/types";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { useLocale } from "@/components/LocaleProvider";
import { SafeAdSlot } from "@/components/AdSlot";
import ToolPageShell from "@/components/tool/ToolPageShell";
import RelatedTools from "@/components/tool/RelatedTools";
import { getRouteByPath } from "@/lib/routeRegistry";
import PracticeFamilyNav from "@/components/PracticeFamilyNav";

type LenFilter = "any" | "short" | "long";

export default function TranscriptionLibraryPanel() {
  const { locale } = useLocale();
  const [language, setLanguage] = useState<Language | "all">("all");
  const [difficulty, setDifficulty] = useState<"all" | "medium" | "hard">("all");
  const [lenFilter, setLenFilter] = useState<LenFilter>("any");
  const [activeId, setActiveId] = useState<string | null>(null);

  const clips = useMemo(
    () =>
      TRANSCRIPTION_CLIPS.filter((c) => {
        if (language !== "all" && c.language !== language) return false;
        if (difficulty !== "all" && c.difficulty !== difficulty) return false;
        if (lenFilter === "short" && c.durationSec > 60) return false;
        if (lenFilter === "long" && c.durationSec <= 60) return false;
        return true;
      }),
    [language, difficulty, lenFilter],
  );

  useEffect(() => {
    track("history_viewed", { source: "transcription-library", count: clips.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (activeId) {
    const clip = TRANSCRIPTION_CLIPS.find((c) => c.id === activeId)!;
    return (
      <ToolPageShell
        eyebrow={locale === "id" ? "Pustaka transkripsi" : "Transcription library"}
        title={clip.topic}
        description={`${clip.language === "en" ? "English" : "Bahasa Indonesia"} · ${clip.difficulty} · ~${clip.durationSec}s · voice ${clip.speakerVoice}`}
      >
        <PracticeFamilyNav />
        <button type="button" onClick={() => setActiveId(null)} className="mb-3 min-h-11 text-sm underline">← {locale === "id" ? "kembali ke pustaka" : "back to library"}</button>
        <TranscriptionEngine key={clip.id} item={clip} />
        <SafeAdSlot slot="transcription-library-result" context="outside-task" className="mx-auto mt-8 max-w-3xl" />
        {getRouteByPath("/transcription-library") && <RelatedTools route={getRouteByPath("/transcription-library")!} />}
      </ToolPageShell>
    );
  }

  return (
    <ToolPageShell
      eyebrow={locale === "id" ? "Latihan" : "Practice"}
      title={locale === "id" ? "Pustaka Transkripsi" : t("library.title")}
      description={locale === "id" ? `Setiap klip adalah narasi orisinal yang ditinjau dengan audio statis (${TRANSCRIPTION_CLIPS.length} klip, 30 detik+). Transkrip tersembunyi sampai dikirim.` : `Every clip is an original reviewed narration with static audio (${TRANSCRIPTION_CLIPS.length} clips, 30s+). The transcript stays hidden until you submit.`}
    >
      <PracticeFamilyNav />
      <div className="mx-auto max-w-4xl">

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={locale === "id" ? "Filter klip" : "Clip filters"}>
        <Chip active={language === "all"} onClick={() => setLanguage("all")} label={locale === "id" ? "Semua bahasa" : "All languages"} />
        <Chip active={language === "en"} onClick={() => setLanguage("en")} label="English" />
        <Chip active={language === "id"} onClick={() => setLanguage("id")} label="Indonesia" />
        <span className="mx-2 w-px bg-zinc-200 dark:bg-zinc-700" />
        <Chip active={difficulty === "all"} onClick={() => setDifficulty("all")} label={locale === "id" ? "Semua tingkat" : "Any difficulty"} />
        <Chip active={difficulty === "medium"} onClick={() => setDifficulty("medium")} label="Medium" />
        <Chip active={difficulty === "hard"} onClick={() => setDifficulty("hard")} label="Hard" />
        <span className="mx-2 w-px bg-zinc-200 dark:bg-zinc-700" />
        <Chip active={lenFilter === "any"} onClick={() => setLenFilter("any")} label={locale === "id" ? "Semua durasi" : "Any length"} />
        <Chip active={lenFilter === "short"} onClick={() => setLenFilter("short")} label="30–60s" />
        <Chip active={lenFilter === "long"} onClick={() => setLenFilter("long")} label="60s+" />
      </div>
      <p className="mt-3 text-xs text-zinc-500">{clips.length} {locale === "id" ? "klip cocok" : "matching clips"}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {clips.map((c) => (
          <button type="button" key={c.id} onClick={() => { setActiveId(c.id); track("library_clip_started", { clipId: c.id, language: c.language, difficulty: c.difficulty }); }} className="min-h-28 rounded-xl border bg-white p-4 text-left hover:border-black dark:bg-zinc-900 dark:hover:border-white">
            <div className="flex items-center justify-between">
              <span className="font-bold">{c.topic}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.difficulty === "hard" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{c.difficulty}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {c.language === "en" ? "English" : "Bahasa Indonesia"} · ~{Math.max(30, c.durationSec)}s · {c.tags.join(", ") || c.source.split(" ")[0]}
            </div>
          </button>
        ))}
        {clips.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-zinc-500">No clips match those filters yet.</p>
        )}
      </div>

      <Link href="/transcription-practice" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black">Sprint mode →</Link>
      <SafeAdSlot slot="transcription-library" context="discovery" className="mt-8" />
      {getRouteByPath("/transcription-library") && <RelatedTools route={getRouteByPath("/transcription-library")!} />}
      </div>
    </ToolPageShell>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`min-h-11 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-black text-white dark:bg-white dark:text-black" : "border bg-white dark:bg-zinc-900"}`}>
      {label}
    </button>
  );
}

