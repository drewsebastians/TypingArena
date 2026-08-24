import type { DictationItem, SpeechSpeed, TranscriptionItem } from "../types";
import { CORPUS_VERSION, NORMALIZATION_VERSION, SCORING_VERSION } from "../types";
import clipData from "./audio-clips.json";

// Dictation + transcription libraries built from the single audio manifest
// (audio-clips.json). Every item references a STATIC audio file generated
// offline during development. The website runtime never synthesizes speech.

interface RawClip {
  id: string;
  kind: "dictation" | "transcription";
  language: "en" | "id";
  voice: string;
  rate: string;
  speed?: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  tags?: string[];
  minDurationSec?: number;
  transcript: string;
}

const CLIPS = clipData.clips as RawClip[];

/** Advisory duration estimate (words ÷ speaking pace). The player measures the
 *  real media duration for all scoring; this only seeds UI before load. */
function estimateSeconds(transcript: string, rate: string): number {
  const words = transcript.trim().split(/\s+/).length;
  const baseWps = 2.6; // ~156 wpm narration at +0%
  const factor = rate.startsWith("-") ? 1 / (1 + Math.abs(parseFloat(rate.slice(0, -1)) / 100) * 0.9)
    : rate === "+0%" ? 1
    : 1 / (1 + (parseFloat(rate.slice(1)) / 100) * 0.8);
  return Math.max(2, Math.round((words / baseWps) * factor));
}

const LICENSE = clipData.license.source;

export const DICTATION_CLIPS: DictationItem[] = CLIPS.filter((c) => c.kind === "dictation").map((c) => ({
  id: c.id,
  language: c.language,
  transcript: c.transcript,
  audioPath: `/audio/dictation/${c.id}.mp3`,
  durationSec: estimateSeconds(c.transcript, c.rate),
  speed: (c.speed as SpeechSpeed) ?? "medium",
  difficulty: c.difficulty,
  topic: c.topic,
  speakerVoice: c.voice,
  source: `edge-tts-dev-v2 (${c.voice} @ ${c.rate})`,
  license: LICENSE,
}));

export const TRANSCRIPTION_CLIPS: TranscriptionItem[] = CLIPS.filter((c) => c.kind === "transcription").map((c) => ({
  id: c.id,
  language: c.language,
  transcript: c.transcript,
  audioPath: `/audio/transcription/${c.id}.mp3`,
  durationSec: estimateSeconds(c.transcript, c.rate),
  difficulty: c.difficulty,
  topic: c.topic,
  speakerVoice: c.voice,
  source: `edge-tts-dev-v2 (${c.voice} @ ${c.rate})`,
  license: LICENSE,
  minDurationSec: c.minDurationSec ?? 30,
  tags: c.tags ?? [],
}));

export function getDictationByLang(lang: "en" | "id"): DictationItem[] {
  return DICTATION_CLIPS.filter((d) => d.language === lang);
}

export function getTranscriptionByLang(lang: "en" | "id"): TranscriptionItem[] {
  return TRANSCRIPTION_CLIPS.filter((t) => t.language === lang);
}

export function findDictationClip(id: string): DictationItem | undefined {
  return DICTATION_CLIPS.find((d) => d.id === id);
}

export function findTranscriptionClip(id: string): TranscriptionItem | undefined {
  return TRANSCRIPTION_CLIPS.find((t) => t.id === id);
}

/** Content versioning exposed to results for reproducibility. */
export const CONTENT_VERSIONS = {
  corpus: CORPUS_VERSION,
  scoring: SCORING_VERSION,
  normalization: NORMALIZATION_VERSION,
};
