// Domain types + versioning constants.
//
// VERSIONING CONTRACT (blueprint §3.16): every scored attempt records the
// exercise id/version, scoring version, normalization version and (when
// applicable) challenge date+version, so historical results remain
// interpretable if rules change.

export type Language = "en" | "id";
export type Mode = "sprint" | "copy-pro" | "dictation" | "transcription" | "numbers" | "punctuation" | "daily" | "career" | "custom-practice";
export type Difficulty = "easy" | "medium" | "hard";
import type { IntegrityState } from "./integrity";
export type { IntegrityState };

/** Bump when result metrics semantics change in a way that breaks comparability. */
export const SCORING_VERSION = "v2.0.0";
/** Bump when dictation/transcription normalization rules change. */
export const NORMALIZATION_VERSION = "v2.0.0";
/** Bump when the daily-challenge pool or selection rule changes. */
export const CHALLENGE_VERSION = "v2.0.0";
export const CORPUS_VERSION = "v2.0.0";

export interface CorpusItem {
  id: string;
  text: string;
  language: Language;
  mode: Mode;
  difficulty: Difficulty;
  source: string;
  tags: string[];
  charCount: number;
  wordCount: number;
  punctuationTypes: string[];
}

export type SpeechSpeed = "slow" | "medium" | "fast";

export interface DictationItem {
  id: string;
  language: Language;
  transcript: string;
  /** Static asset path relative to /public — the ONLY production audio source. */
  audioPath: string;
  durationSec: number; // advisory; player measures real duration
  speed: SpeechSpeed;
  difficulty: Difficulty;
  topic: string;
  speakerVoice: string;
  source: string; // e.g. "original-offline-tts-v1"
  license: string;
}

export interface TranscriptionItem extends Omit<DictationItem, "speed"> {
  minDurationSec: number;
  tags: string[];
}

export interface AttemptVersioning {
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  normalizationVersion?: string;
  language: Language;
  mode: Mode;
  configuredDurationSec: number | null;
  challengeDate?: string;
  challengeVersion?: string;
}

export interface PerKeyStat {
  errors: number;
  exposures: number;
  rate: number;
}

export interface BigramStat {
  errors: number;
  exposures: number;
}

export interface TypingResult {
  id: string;
  mode: Mode;
  language: Language;
  durationSec: number; // configured
  elapsedMs: number;
  grossWpm: number; // typed chars / 5 / minutes
  netWpm: number; // (typed chars - uncorrected errors) / 5 / minutes, floor 0
  cpm: number;
  accuracy: number; // 0-100 over the TYPED scope only (never untouched future text)
  correctChars: number;
  typedChars: number;
  correctedErrors: number;
  uncorrectedErrors: number;
  rawErrorEvents: number;
  backspaceActions: number;
  immediateCorrections: number;
  correctionLatencyMsAvg: number | null;
  perKeyErrors: Record<string, PerKeyStat>;
  bigramErrors: Record<string, BigramStat>;
  pasteDetected: boolean;
  focusLostCount: number;
  integrity: IntegrityState;
  integrityReasons: string[];
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  challengeDate?: string;
  challengeVersion?: string;
  timestamp: number;
}

export interface AudioPlaybackMetrics {
  playCount: number; // includes first play
  replayCount: number; // plays after the first
  playedSeconds: number; // actual accumulated audible seconds
  uniqueClipSeconds: number; // real media duration once known (0 if unknown)
  pauseCount: number;
  seekCount: number;
  replayRatio: number | null; // playedSeconds / uniqueClipSeconds
}

export interface DictationResult {
  id: string;
  language: Language;
  strictScore: number; // 0-100 exact incl. case+punct (aligned similarity)
  normalizedScore: number; // 0-100 tolerant (normalization vN)
  wordAccuracy: number; // aligned word-level accuracy vs reference
  punctuationAccuracy: number | null; // punct-bearing words reproduced correctly
  effectiveWpm: number;
  completionMs: number;
  playback: AudioPlaybackMetrics;
  pasteDetected: boolean;
  integrity: IntegrityState;
  integrityReasons: string[];
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  normalizationVersion: string;
  noiseLevel?: string;
  timestamp: number;
}

export interface TranscriptionResult {
  id: string;
  language: Language;
  strictScore: number;
  normalizedScore: number;
  wordAccuracy: number;
  punctuationAccuracy: number | null;
  effectiveWpm: number;
  activeTypingWpm: number | null;
  completionMs: number;
  activeInputMs: number;
  playback: AudioPlaybackMetrics;
  corrections: number;
  pasteDetected: boolean;
  integrity: IntegrityState;
  integrityReasons: string[];
  exerciseId: string;
  exerciseVersion: string;
  scoringVersion: string;
  normalizationVersion: string;
  difficulty: Difficulty;
  timestamp: number;
}

export interface LeaderboardRow {
  rank: number;
  username: string;
  wpm: number;
  accuracy: number;
  mode: Mode;
  language: Language;
  durationSec: number;
  integrity: IntegrityState;
  scoredAt: string;
  isSelf?: boolean;
}

// ---------------------------------------------------------------------------
// Multi-skill matrix (typing + dictation + transcription)
// ---------------------------------------------------------------------------

export interface TypingSkills {
  attempts: number;
  avgGrossWpm: number | null;
  avgAccuracy: number | null;
  weakKeys: string[];
  weakBigrams: string[];
  punctuationWeak: boolean;
  numbersWeak: boolean;
  avgCorrectionLatencyMs: number | null;
}

export interface DictationSkills {
  attempts: number;
  avgStrict: number | null;
  avgNormalized: number | null;
  avgWordAccuracy: number | null;
  avgReplayRatio: number | null;
  listeningWeak: boolean;
  byLanguage: Record<Language, { attempts: number; avgNormalized: number | null }>;
}

export interface TranscriptionSkills {
  attempts: number;
  avgNormalized: number | null;
  avgReplayRatio: number | null;
  completionHeavy: boolean; // relies on many replays to finish
}

export interface SkillMatrix {
  typing: TypingSkills;
  dictation: DictationSkills;
  transcription: TranscriptionSkills;
  lastUpdated: number;
}

export interface ExerciseRecommendation {
  label: string;
  reason: string;
  href: string;
}
