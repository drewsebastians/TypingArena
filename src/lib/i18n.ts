"use client";
// Lightweight i18n dictionary (EN + Bahasa Indonesia).
// Locale persists in localStorage; default EN. New feature surfaces use t()
// directly so both languages ship together.

export type Locale = "en" | "id";

const LS_KEY = "ta:locale";

export function getLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LS_KEY) === "id" ? "id" : "en";
}

export function setLocale(l: Locale): void {
  try {
    localStorage.setItem(LS_KEY, l);
  } catch {
    /* ignore */
  }
}

type Dict = Record<string, { en: string; id: string }>;

export const STRINGS: Dict = {
  // nav
  "nav.sprint": { en: "Sprint", id: "Sprint" },
  "nav.dictation": { en: "Dictation", id: "Dikte" },
  "nav.transcription": { en: "Transcription", id: "Transkripsi" },
  "nav.library": { en: "Library", id: "Pustaka" },
  "nav.career": { en: "Career", id: "Karier" },
  "nav.multiplayer": { en: "Multiplayer", id: "Multiplayer" },
  "nav.teams": { en: "Teams", id: "Tim" },
  "nav.custom": { en: "Custom Test", id: "Tes Buatan" },
  "nav.seasons": { en: "Seasons", id: "Musim" },
  "nav.daily": { en: "Daily Arena", id: "Arena Harian" },
  "nav.leaderboard": { en: "Leaderboard", id: "Papan Peringkat" },
  "nav.friends": { en: "Friends", id: "Teman" },
  "nav.noise": { en: "Noise", id: "Bising" },
  "nav.progress": { en: "Progress", id: "Kemajuan" },
  "nav.assessments": { en: "Assessments", id: "Asesmen" },
  // common
  "common.language": { en: "Language", id: "Bahasa" },
  "common.start": { en: "Start", id: "Mulai" },
  "common.submit": { en: "Submit", id: "Kirim" },
  "common.loading": { en: "Loading…", id: "Memuat…" },
  "common.backendRequired": {
    en: "This feature needs the shared backend (Supabase). See README → Shared competition setup.",
    id: "Fitur ini membutuhkan backend bersama (Supasi). Lihat README → Shared competition setup.",
  },
  "common.signInFirst": { en: "Sign in first.", id: "Masuk dulu." },
  // career
  "career.title": { en: "Career Mode — Practice Assessments", id: "Mode Karier — Asesmen Latihan" },
  "career.subtitle": {
    en: "Structured skill benchmarks built from reviewed exercises. Transparent scoring, no certification claims.",
    id: "Benchmark keterampilan terstruktur dari latihan terkurasi. Skoring transparan, tanpa klaim sertifikasi.",
  },
  "career.startTrack": { en: "Start assessment", id: "Mulai asesmen" },
  "career.band.Advanced": { en: "Advanced", id: "Mahir" },
  "career.band.Proficient": { en: "Proficient", id: "Cakap" },
  "career.band.Developing": { en: "Developing", id: "Berkembang" },
  // seasons
  "seasons.title": { en: "Ranked Seasons", id: "Musim Kompetitif" },
  "seasons.subtitle": {
    en: "Monthly ranked ladders. Only server-accepted ranked attempts count.",
    id: "Peringkat bulanan. Hanya upaya ranked yang disetujui server yang dihitung.",
  },
  // multiplayer
  "mp.title": { en: "Multiplayer Race", id: "Balapan Multiplayer" },
  "mp.createRoom": { en: "Create room", id: "Buat ruang" },
  "mp.joinRoom": { en: "Join with code", id: "Gabung dengan kode" },
  // teams
  "teams.title": { en: "Teams & Classrooms", id: "Tim & Kelas" },
  "teams.createTeam": { en: "Create team", id: "Buat tim" },
  "teams.joinByCode": { en: "Join with code", id: "Gabung dengan kode" },
  // custom
  "custom.title": { en: "Custom Tests", id: "Tes Buatan" },
  "custom.create": { en: "Create custom test", id: "Buat tes" },
  // library
  "library.title": { en: "Transcription Library", id: "Pustaka Transkripsi" },
  // assessments
  "assess.title": { en: "Skills Assessments (Employer)", id: "Asesmen Keterampilan (Pemberi Kerja)" },
};

/** Translate a key for the active locale; falls back to EN then the key. */
export function t(key: string, locale?: Locale): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  const loc = locale ?? getLocale();
  return entry[loc] ?? entry.en;
}

export function localizedTrackField<T extends Record<string, unknown>>(obj: T, base: string, locale: Locale): string {
  const suffix = locale === "id" ? `${base}Id` : base;
  return (obj[suffix] as string) ?? (obj[base] as string);
}
