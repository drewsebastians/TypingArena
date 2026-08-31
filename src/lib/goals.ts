// Goal-First entry points. Goals are orchestration metadata: they point at
// existing real engines/routes and never contain scoring or generated content.

export type GoalId =
  | "type-faster"
  | "listen-better"
  | "transcribe-accurately"
  | "prepare-for-work"
  | "compete"
  | "teach-assess";

export type GoalWorkspace =
  | "typing"
  | "dictation"
  | "transcription"
  | "career"
  | "competition"
  | "teaching";

export interface LocalizedCopy {
  en: string;
  id: string;
}

export interface GoalDefinition {
  id: GoalId;
  title: LocalizedCopy;
  subtitle: LocalizedCopy;
  cta: LocalizedCopy;
  icon: string;
  accent: string;
  workspace: GoalWorkspace;
  destination: string;
  defaultConfig: Readonly<Record<string, string | number>>;
  relatedRouteIds: readonly string[];
}

export const GOALS = [
  {
    id: "type-faster",
    title: { en: "Type Faster", id: "Ketik Lebih Cepat" },
    subtitle: { en: "Build speed without giving up accuracy.", id: "Bangun kecepatan tanpa mengorbankan akurasi." },
    cta: { en: "Start typing", id: "Mulai mengetik" },
    icon: "↗",
    accent: "amber",
    workspace: "typing",
    destination: "/typing-test",
    defaultConfig: { language: "en", durationSec: 30, mode: "sprint" },
    relatedRouteIds: ["typing-test", "data-entry-test", "punctuation-typing-test"],
  },
  {
    id: "listen-better",
    title: { en: "Listen Better", id: "Dengar Lebih Baik" },
    subtitle: { en: "Hear a clip, then type exactly what you hear.", id: "Dengarkan klip, lalu ketik persis yang kamu dengar." },
    cta: { en: "Start dictation", id: "Mulai dikte" },
    icon: "◖",
    accent: "sky",
    workspace: "dictation",
    destination: "/dictation",
    defaultConfig: { language: "en", difficulty: "medium" },
    relatedRouteIds: ["dictation", "noise-challenge", "transcription-practice"],
  },
  {
    id: "transcribe-accurately",
    title: { en: "Transcribe Accurately", id: "Transkripsi Akurat" },
    subtitle: { en: "Practice longer audio, punctuation, and focus.", id: "Latih audio yang lebih panjang, tanda baca, dan fokus." },
    cta: { en: "Start transcription", id: "Mulai transkripsi" },
    icon: "▤",
    accent: "violet",
    workspace: "transcription",
    destination: "/transcription-practice",
    defaultConfig: { language: "en", difficulty: "medium" },
    relatedRouteIds: ["transcription-practice", "transcription-library", "dictation"],
  },
  {
    id: "prepare-for-work",
    title: { en: "Prepare for Work", id: "Siap untuk Kerja" },
    subtitle: { en: "Train on practical, job-relevant modules.", id: "Berlatih dengan modul praktis yang relevan untuk kerja." },
    cta: { en: "Explore Career Mode", id: "Lihat Mode Karier" },
    icon: "▣",
    accent: "emerald",
    workspace: "career",
    destination: "/career",
    defaultConfig: { track: "data-entry" },
    relatedRouteIds: ["career", "data-entry-test", "punctuation-typing-test"],
  },
  {
    id: "compete",
    title: { en: "Compete", id: "Bersaing" },
    subtitle: { en: "Take the same challenge and see where you stand.", id: "Ikuti tantangan yang sama dan lihat posisimu." },
    cta: { en: "Enter Daily Arena", id: "Masuk Arena Harian" },
    icon: "◆",
    accent: "indigo",
    workspace: "competition",
    destination: "/daily-arena",
    defaultConfig: { mode: "daily" },
    relatedRouteIds: ["daily-arena", "leaderboard", "multiplayer"],
  },
  {
    id: "teach-assess",
    title: { en: "Teach / Assess", id: "Mengajar / Menilai" },
    subtitle: { en: "Create structured practice for a group or candidate.", id: "Buat latihan terstruktur untuk grup atau kandidat." },
    cta: { en: "Set up a workspace", id: "Siapkan ruang kerja" },
    icon: "◇",
    accent: "rose",
    workspace: "teaching",
    destination: "/teams",
    defaultConfig: { resource: "team" },
    relatedRouteIds: ["teams", "assessments", "custom"],
  },
] as const satisfies readonly GoalDefinition[];

export const GOAL_IDS = GOALS.map((goal) => goal.id) as GoalId[];

export function getGoal(id: GoalId): GoalDefinition {
  const goal = GOALS.find((candidate) => candidate.id === id);
  if (!goal) throw new Error(`Unknown Goal-First goal: ${id}`);
  return goal;
}
