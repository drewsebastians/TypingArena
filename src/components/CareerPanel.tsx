"use client";
// Career Mode runner — sequential standardized modules per track with a
// transparent score breakdown. Practice assessment only (no certification).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CAREER_TRACKS, audioEfficiency, getTrack, scoreModules, typingEfficiency } from "@/lib/career";
import type { CareerAssessmentResult, CareerTrack, ModuleScore } from "@/lib/career";
import { ENGLISH_CORPUS } from "@/lib/content/english";
import { INDONESIAN_CORPUS } from "@/lib/content/indonesian";
import { DICTATION_CLIPS, TRANSCRIPTION_CLIPS } from "@/lib/content/dictation";
import { findDictationClip } from "@/lib/content/dictation";
import TypingEngine from "@/components/TypingEngine";
import DictationEngine from "@/components/DictationEngine";
import TranscriptionEngine from "@/components/TranscriptionEngine";
import AdSlot from "@/components/AdSlot";
import { IS_REMOTE_CONFIGURED } from "@/lib/config";
import { loadCareerHistory, saveCareerResult } from "@/lib/history";
import { getLocale, t } from "@/lib/i18n";
import type { CorpusItem, DictationResult, TranscriptionResult, TypingResult } from "@/lib/types";

function pickCorpus(modeRef: string, language: "en" | "id", seedKey: string): CorpusItem {
  const base = language === "en" ? ENGLISH_CORPUS : INDONESIAN_CORPUS;
  const pool = base.filter((c) => c.mode === modeRef);
  const arr = pool.length > 0 ? pool : base.filter((c) => c.mode === "sprint");
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i++) h = Math.imul(h ^ seedKey.charCodeAt(i), 16777619);
  return arr[(h >>> 0) % arr.length];
}

export default function CareerPanel() {
  const locale = getLocale();
  const [active, setActive] = useState<CareerTrack | null>(null);
  const [moduleIdx, setModuleIdx] = useState(0);
  const [scores, setScores] = useState<ModuleScore[]>([]);
  const [result, setResult] = useState<CareerAssessmentResult | null>(null);

  const start = useCallback((tr: CareerTrack) => {
    setActive(tr);
    setModuleIdx(0);
    setScores([]);
    setResult(null);
    void import("@/lib/analytics").then(({ track }) => track("career_start", { trackId: tr.id }));
  }, []);

  const finish = useCallback(
    (track: CareerTrack, all: ModuleScore[]) => {
      const res = scoreModules(track, all);
      setResult(res);
      saveCareerResult(res);
    },
    [],
  );

  const onTypingDone = useCallback(
    (r: TypingResult) => {
      if (!active) return;
      const s: ModuleScore = {
        label: active.modules[moduleIdx].label,
        kind: "typing",
        accuracy: r.accuracy,
        speedWpm: r.grossWpm,
        efficiency: typingEfficiency(r.correctedErrors, r.typedChars),
        integrityFlags: r.integrity === "ranked" ? [] : [r.integrity],
      };
      const all = [...scores, s];
      if (all.length === active.modules.length) finish(active, all);
      else {
        setScores(all);
        setModuleIdx((i) => i + 1);
      }
    },
    [active, moduleIdx, scores, finish],
  );

  const onDictationDone = useCallback(
    (r: DictationResult) => {
      if (!active) return;
      const s: ModuleScore = {
        label: active.modules[moduleIdx].label,
        kind: "dictation",
        accuracy: r.wordAccuracy,
        speedWpm: r.effectiveWpm,
        efficiency: audioEfficiency(r.playback.replayRatio),
        integrityFlags: r.integrity === "ranked" ? [] : [r.integrity],
      };
      const all = [...scores, s];
      if (all.length === active.modules.length) finish(active, all);
      else {
        setScores(all);
        setModuleIdx((i) => i + 1);
      }
    },
    [active, moduleIdx, scores, finish],
  );

  const onTranscriptionDone = useCallback(
    (r: TranscriptionResult) => {
      if (!active) return;
      const s: ModuleScore = {
        label: active.modules[moduleIdx].label,
        kind: "transcription",
        accuracy: r.wordAccuracy,
        speedWpm: r.effectiveWpm,
        efficiency: audioEfficiency(r.playback.replayRatio),
        integrityFlags: r.integrity === "ranked" ? [] : [r.integrity],
      };
      const all = [...scores, s];
      if (all.length === active.modules.length) finish(active, all);
      else {
        setScores(all);
        setModuleIdx((i) => i + 1);
      }
    },
    [active, moduleIdx, scores, finish],
  );

  // Loaded in an effect so local saves and explicit shared hydration both stay
  // consistent with the history store.
  const [currentHistory, setCurrentHistory] = useState<CareerAssessmentResult[]>([]);
  useEffect(() => {
    setCurrentHistory(loadCareerHistory());
  }, [result]);

  // ---- views ---------------------------------------------------------------
  if (result && active) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-black">
          {t("career.band." + result.band)} — {result.score}/100
        </h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">Practice assessment · skill benchmark · not a certification</p>
        <div className="mt-4 divide-y rounded-xl border bg-white dark:bg-zinc-900">
          {result.modules.map((m, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex-1 font-semibold">{m.label}</span>
              <span className="w-16 text-right font-mono">{Math.round(m.speedWpm)} wpm</span>
              <span className="ml-4 w-14 text-right font-mono">{Math.round(m.accuracy)}%</span>
              <span className="ml-4 w-14 text-right font-mono">{Math.round(m.efficiency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => start(active)} className="rounded-full bg-black px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Retake</button>
          <Link href="/progress" className="rounded-full border px-5 py-2 text-sm">View history</Link>
          <Link href="/transcription-practice" className="rounded-full border px-5 py-2 text-sm">Keep training →</Link>
        </div>
        <AdSlot slot="career-result" className="mt-8" />
      </div>
    );
  }

  if (active) {
    const mod = active.modules[moduleIdx];
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-xs uppercase tracking-widest text-zinc-500">
          {active.name} · module {moduleIdx + 1}/{active.modules.length} · {mod.label}
        </p>
        <div className="mt-6">
          {mod.kind === "typing" && (
            <TypingEngine
              key={`${active.id}-${moduleIdx}`}
              pool={[pickCorpus(mod.ref, mod.language, `${active.id}-${moduleIdx}`)]}
              language={mod.language}
              mode="copy-pro"
              durationSec={mod.durationSec}
              exerciseId={`career-${active.id}-${moduleIdx}`}
              onComplete={onTypingDone}
            />
          )}
          {mod.kind === "dictation" && (
            <DictationEngine key={mod.ref} item={findDictationClip(mod.ref)!} onComplete={onDictationDone} />
          )}
          {mod.kind === "transcription" && (
            <TranscriptionEngine key={mod.ref} item={TRANSCRIPTION_CLIPS.find((c) => c.id === mod.ref)!} onComplete={onTranscriptionDone} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black">{t("career.title")}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("career.subtitle")}</p>

      {!IS_REMOTE_CONFIGURED && (
        <p className="mt-3 rounded-lg border bg-zinc-50 p-3 text-xs text-zinc-500 dark:bg-zinc-900">{t("common.backendRequired")} Local scoring still works fully.</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {CAREER_TRACKS.map((track) => (
          <div key={track.id} className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h3 className="font-bold">{locale === "id" ? track.nameId : track.name}</h3>
            <p className="mt-1 text-xs text-zinc-500">{locale === "id" ? track.descriptionId : track.description}</p>
            <ul className="mt-2 text-xs text-zinc-500">
              {track.modules.map((m, i) => (
                <li key={i}>• {m.label}</li>
              ))}
            </ul>
            <button onClick={() => start(track)} className="mt-3 rounded-full bg-black px-5 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
              {t("career.startTrack")}
            </button>
          </div>
        ))}
      </div>

      {currentHistory.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold">Recent assessments</h3>
          <div className="mt-2 divide-y rounded-xl border bg-white dark:bg-zinc-900">
            {currentHistory.slice(0, 8).map((r, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{r.trackId}</span>
                <span className="font-mono">{r.score}/100</span>
                <span className="text-xs uppercase tracking-wide text-zinc-500">{r.band}</span>
                <span className="ml-3 text-xs text-zinc-500">{new Date(r.completedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <AdSlot slot="career" className="mt-8" />
    </div>
  );
}

void getTrack;
void DICTATION_CLIPS;

