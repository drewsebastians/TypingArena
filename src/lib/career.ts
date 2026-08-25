import type { Difficulty, Language } from "./types";

// ---------------------------------------------------------------------------
// Career Mode — structured practice assessments over reviewed static content.
//
// Transparent scoring (no psychometric claims):
//   score = 0.45·accuracy + 0.35·speedBand + 0.20·efficiency
//     accuracy   — module accuracy % (typing) or wordAccuracy (audio)
//     speedBand  — min(100, grossWpm/80*100) typing; effectiveWpm analog audio
//     efficiency — typing: max(0, 100 − correctedErrorRate·200)
//                  audio:  max(0, 100 − replayRatio·50)
// Bands: <55 Developing · 55–74 Proficient · ≥75 Advanced.
// This is a skill benchmark for practice — NOT professional certification.
// ---------------------------------------------------------------------------

export type TrackId = "transcription" | "data-entry" | "office-admin" | "numbers-codes" | "punctuation";

export interface CareerModule {
  kind: "typing" | "dictation" | "transcription";
  /** typing: corpus mode pool; audio: exact clip id */
  ref: string;
  language: Language;
  durationSec: number;
  label: string;
}

export interface CareerTrack {
  id: TrackId;
  name: string;
  nameId: string;
  description: string;
  descriptionId: string;
  difficulty: Difficulty;
  modules: CareerModule[];
}

function typingModule(mode: string, lang: Language, dur: number, label: string): CareerModule {
  return { kind: "typing", ref: mode, language: lang, durationSec: dur, label };
}
function audioModule(kind: "dictation" | "transcription", clipId: string, lang: Language, label: string): CareerModule {
  return { kind, ref: clipId, language: lang, durationSec: kind === "dictation" ? 60 : 120, label };
}

export const CAREER_TRACKS: CareerTrack[] = [
  {
    id: "data-entry",
    name: "Data Entry",
    nameId: "Entri Data",
    description: "Dates, quantities, phone numbers, currency and mixed records under time pressure.",
    descriptionId: "Tanggal, jumlah, nomor telepon, mata uang, dan catatan campuran dalam batas waktu.",
    difficulty: "hard",
    modules: [
      typingModule("numbers", "en", 30, "Numeric records (EN)"),
      typingModule("numbers", "id", 30, "Catatan numerik (ID)"),
      typingModule("copy-pro", "en", 30, "Invoice reference line"),
    ],
  },
  {
    id: "office-admin",
    name: "Office / Admin",
    nameId: "Kantor / Administrasi",
    description: "Business prose, schedules, addresses and correspondence-style text.",
    descriptionId: "Prosa bisnis, jadwal, alamat, dan teks bergaya surat-menyurat.",
    difficulty: "medium",
    modules: [
      typingModule("copy-pro", "en", 30, "Correspondence"),
      typingModule("copy-pro", "id", 30, "Surat & faktur"),
      typingModule("sprint", "en", 30, "General office prose"),
    ],
  },
  {
    id: "numbers-codes",
    name: "Numbers & Codes",
    nameId: "Angka & Kode",
    description: "SKU codes, order IDs and serial-like alphanumeric strings.",
    descriptionId: "Kode SKU, nomor pesanan, dan pengenal alfanumerik.",
    difficulty: "hard",
    modules: [
      typingModule("numbers", "en", 30, "SKU / codes"),
      typingModule("numbers", "id", 30, "Gudang & kode"),
    ],
  },
  {
    id: "punctuation",
    name: "Punctuation Precision",
    nameId: "Presisi Tanda Baca",
    description: "Quotes, apostrophes, dashes, semicolons and mixed capitalization.",
    descriptionId: "Tanda kutip, apostrof, pisah, titik koma, dan kapitalisasi campuran.",
    difficulty: "medium",
    modules: [
      typingModule("punctuation", "en", 30, "Dialogue & quotes"),
      typingModule("punctuation", "en", 30, "Lists & dashes"),
    ],
  },
  {
    id: "transcription",
    name: "Transcription",
    nameId: "Transkripsi",
    description: "Listen-and-type benchmark: short dictation plus a full-length clip.",
    descriptionId: "Benchmark mendengar-dan-mengetik: dikte singkat plus klip penuh.",
    difficulty: "hard",
    modules: [
      audioModule("dictation", "dict-en-005", "en", "Fast business dictation"),
      audioModule("transcription", "trans-en-002", "en", "Office update clip"),
    ],
  },
];

export function getTrack(id: string): CareerTrack | undefined {
  return CAREER_TRACKS.find((t) => t.id === id);
}

export interface ModuleScore {
  label: string;
  kind: CareerModule["kind"];
  accuracy: number; // 0-100
  speedWpm: number;
  efficiency: number; // 0-100
  integrityFlags: string[];
}

export interface CareerAssessmentResult {
  trackId: TrackId;
  score: number; // 0-100 composite
  band: "Developing" | "Proficient" | "Advanced";
  modules: ModuleScore[];
  completedAt: number;
}

/** Pure scoring — unit-tested. Weights documented above. */
export function scoreModules(track: CareerTrack, modules: ModuleScore[]): CareerAssessmentResult {
  const n = Math.max(1, modules.length);
  const acc = modules.reduce((s, m) => s + m.accuracy, 0) / n;
  const spd = modules.reduce((s, m) => s + Math.min(100, (m.speedWpm / 80) * 100), 0) / n;
  const eff = modules.reduce((s, m) => s + m.efficiency, 0) / n;
  const score = Math.round((0.45 * acc + 0.35 * spd + 0.2 * eff) * 10) / 10;
  return {
    trackId: track.id,
    score,
    band: score >= 75 ? "Advanced" : score >= 55 ? "Proficient" : "Developing",
    modules,
    completedAt: Date.now(),
  };
}

export function typingEfficiency(correctedErrors: number, typedChars: number): number {
  if (typedChars <= 0) return 0;
  return Math.max(0, Math.round(100 - (correctedErrors / typedChars) * 200));
}

export function audioEfficiency(replayRatio: number | null): number {
  if (replayRatio === null) return 70; // unknown → neutral-middle, never punished
  return Math.max(0, Math.round(100 - replayRatio * 50));
}
