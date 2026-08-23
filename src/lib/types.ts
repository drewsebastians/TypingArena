export type Language = "en" | "id";
export type Mode = "sprint" | "copy-pro" | "dictation" | "transcription" | "numbers" | "punctuation" | "daily";

export interface CorpusItem {
  id: string;
  text: string;
  language: Language;
  mode: Mode;
  difficulty: "easy" | "medium" | "hard";
  source: string;
  tags: string[];
  charCount: number;
  wordCount: number;
  punctuationTypes: string[];
}

export interface DictationItem {
  id: string;
  language: Language;
  transcript: string;
  normalizedTranscript: string;
  audioUrl: string; // for MVP: TTS via Web Speech API, url is placeholder or data:tts
  durationSec: number;
  speed: "slow" | "medium" | "fast";
  accent?: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  useTTS: boolean;
}

export interface TranscriptionItem {
  id: string;
  language: Language;
  transcript: string;
  audioUrl: string;
  durationSec: number;
  difficulty: "easy" | "medium" | "hard";
  useTTS: boolean;
}

export interface KeystrokeEvent {
  time: number; // ms since start
  key: string;
  expected: string | null;
  correct: boolean;
  isBackspace: boolean;
  isCorrection: boolean;
}

export interface TypingResult {
  id: string;
  mode: Mode;
  language: Language;
  durationSec: number; // configured
  elapsedMs: number;
  wpm: number;
  rawWpm: number;
  accuracy: number; // final text accuracy 0-100
  correctedErrors: number;
  uncorrectedErrors: number;
  totalErrors: number;
  errorRate: number;
  cpm: number;
  perKeyErrors: Record<string, { errors: number; exposures: number; rate: number }>;
  bigramErrors: Record<string, { errors: number; exposures: number }>;
  correctionLatencyMsAvg: number | null;
  pasteDetected: boolean;
  focusLostCount: number;
  integrity: "practice" | "ranked" | "flagged";
  text: string;
  typed: string;
  timestamp: number;
  version: string;
}

export interface DictationResult {
  id: string;
  language: Language;
  strictScore: number; // 0-100 exact
  normalizedScore: number; // 0-100 tolerant
  wordAccuracy: number;
  wpm: number; // effective transcription wpm
  replayCount: number;
  totalReplaySec: number;
  completionMs: number;
  pasteDetected: boolean;
  timestamp: number;
  transcript: string;
  typed: string;
  integrity: "practice" | "ranked" | "flagged";
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  mode: Mode;
  language: Language;
  durationSec: number;
  score?: number;
  timestamp: number;
  isSelf?: boolean;
}

export interface SkillMatrix {
  perKeyRate: Record<string, number>; // error rate 0-1
  weakKeys: string[];
  weakBigrams: string[];
  punctuationWeak: boolean;
  numbersWeak: boolean;
  listeningWeak: boolean;
  lastUpdated: number;
}

export const SCORING_VERSION = "v1.0.0";
export const NORMALIZATION_VERSION = "v1.0.0";
