import type { GoalId } from "./goals";

export type RouteCategory = "typing" | "dictation" | "practice" | "arena" | "teams" | "utility";
export type BackendRequirement = "none" | "optional" | "required";
export type AdEligibility = "post-result" | "discovery" | "outside-task" | "none";
export type ChangeFrequency = "daily" | "weekly" | "monthly";

export interface RouteDefinition {
  id: string;
  path: string;
  label: { en: string; id: string };
  category: RouteCategory;
  primaryGoal: GoalId | null;
  indexable: boolean;
  activeTask: boolean;
  backend: BackendRequirement;
  adEligibility: AdEligibility;
  relatedRouteIds: readonly string[];
  sitemapPriority: number;
  changeFrequency: ChangeFrequency;
}

// This registry intentionally describes existing public routes. It is used by
// navigation, sitemap generation, related links, and integrity tests so the
// Goal-First layer cannot silently remove an established search destination.
export const ROUTES = [
  { id: "home", path: "/", label: { en: "Home", id: "Beranda" }, category: "utility", primaryGoal: null, indexable: true, activeTask: false, backend: "optional", adEligibility: "discovery", relatedRouteIds: ["typing-test", "dictation", "transcription-practice", "career"], sitemapPriority: 1, changeFrequency: "weekly" },
  { id: "typing-test", path: "/typing-test", label: { en: "Typing Test", id: "Tes Mengetik" }, category: "typing", primaryGoal: "type-faster", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["typing-1-minute", "typing-5-minute", "dictation"], sitemapPriority: 0.9, changeFrequency: "weekly" },
  { id: "typing-1-minute", path: "/typing-test/1-minute", label: { en: "1 Minute Typing Test", id: "Tes Mengetik 1 Menit" }, category: "typing", primaryGoal: "type-faster", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["typing-test", "typing-5-minute"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "typing-5-minute", path: "/typing-test/5-minute", label: { en: "5 Minute Typing Test", id: "Tes Mengetik 5 Menit" }, category: "typing", primaryGoal: "type-faster", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["typing-test", "typing-1-minute"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "typing-indonesian", path: "/typing-test/indonesian", label: { en: "Indonesian Typing Test", id: "Tes Mengetik Bahasa Indonesia" }, category: "typing", primaryGoal: "type-faster", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["tes-mengetik", "typing-test"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "tes-mengetik", path: "/tes-mengetik", label: { en: "Fast Typing Test", id: "Tes Mengetik Cepat" }, category: "typing", primaryGoal: "type-faster", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["typing-indonesian", "typing-test"], sitemapPriority: 0.9, changeFrequency: "weekly" },
  { id: "data-entry-test", path: "/data-entry-test", label: { en: "Data Entry Test", id: "Tes Entri Data" }, category: "typing", primaryGoal: "prepare-for-work", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["typing-test", "punctuation-typing-test", "career"], sitemapPriority: 0.7, changeFrequency: "weekly" },
  { id: "punctuation-typing-test", path: "/punctuation-typing-test", label: { en: "Punctuation Typing Test", id: "Tes Tanda Baca" }, category: "typing", primaryGoal: "prepare-for-work", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["typing-test", "data-entry-test", "career"], sitemapPriority: 0.7, changeFrequency: "weekly" },
  { id: "dictation", path: "/dictation", label: { en: "Dictation", id: "Dikte" }, category: "dictation", primaryGoal: "listen-better", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["dictation-english", "dictation-indonesian", "transcription-practice"], sitemapPriority: 0.9, changeFrequency: "weekly" },
  { id: "dictation-english", path: "/dictation/english", label: { en: "English Dictation", id: "Dikte Bahasa Inggris" }, category: "dictation", primaryGoal: "listen-better", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["dictation", "dictation-indonesian"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "dictation-indonesian", path: "/dictation/indonesian", label: { en: "Indonesian Dictation", id: "Dikte Bahasa Indonesia" }, category: "dictation", primaryGoal: "listen-better", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["dictation", "dictation-english"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "noise-challenge", path: "/noise-challenge", label: { en: "Noise Challenge", id: "Tantangan Bising" }, category: "dictation", primaryGoal: "listen-better", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["dictation", "dictation-english"], sitemapPriority: 0.6, changeFrequency: "weekly" },
  { id: "transcription-practice", path: "/transcription-practice", label: { en: "Transcription Practice", id: "Latihan Transkripsi" }, category: "practice", primaryGoal: "transcribe-accurately", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["transcription-library", "dictation"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "transcription-library", path: "/transcription-library", label: { en: "Transcription Library", id: "Pustaka Transkripsi" }, category: "practice", primaryGoal: "transcribe-accurately", indexable: true, activeTask: false, backend: "none", adEligibility: "discovery", relatedRouteIds: ["transcription-practice", "dictation"], sitemapPriority: 0.7, changeFrequency: "weekly" },
  { id: "career", path: "/career", label: { en: "Career Mode", id: "Mode Karier" }, category: "practice", primaryGoal: "prepare-for-work", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["data-entry-test", "punctuation-typing-test", "transcription-practice"], sitemapPriority: 0.8, changeFrequency: "weekly" },
  { id: "daily-arena", path: "/daily-arena", label: { en: "Daily Arena", id: "Arena Harian" }, category: "arena", primaryGoal: "compete", indexable: true, activeTask: true, backend: "optional", adEligibility: "post-result", relatedRouteIds: ["leaderboard", "seasons", "typing-test"], sitemapPriority: 0.7, changeFrequency: "daily" },
  { id: "leaderboard", path: "/leaderboard", label: { en: "Leaderboard", id: "Papan Peringkat" }, category: "arena", primaryGoal: "compete", indexable: true, activeTask: false, backend: "required", adEligibility: "outside-task", relatedRouteIds: ["daily-arena", "seasons"], sitemapPriority: 0.6, changeFrequency: "daily" },
  { id: "seasons", path: "/seasons", label: { en: "Ranked Seasons", id: "Musim Kompetitif" }, category: "arena", primaryGoal: "compete", indexable: true, activeTask: false, backend: "required", adEligibility: "outside-task", relatedRouteIds: ["leaderboard", "daily-arena"], sitemapPriority: 0.6, changeFrequency: "daily" },
  { id: "multiplayer", path: "/multiplayer", label: { en: "Multiplayer", id: "Multiplayer" }, category: "arena", primaryGoal: "compete", indexable: true, activeTask: true, backend: "required", adEligibility: "outside-task", relatedRouteIds: ["friends", "daily-arena"], sitemapPriority: 0.5, changeFrequency: "weekly" },
  { id: "friends", path: "/friends", label: { en: "Friend Challenges", id: "Tantangan Teman" }, category: "arena", primaryGoal: "compete", indexable: true, activeTask: false, backend: "required", adEligibility: "discovery", relatedRouteIds: ["multiplayer", "daily-arena"], sitemapPriority: 0.5, changeFrequency: "weekly" },
  { id: "teams", path: "/teams", label: { en: "Teams & Classrooms", id: "Tim & Kelas" }, category: "teams", primaryGoal: "teach-assess", indexable: true, activeTask: true, backend: "required", adEligibility: "outside-task", relatedRouteIds: ["assessments", "custom"], sitemapPriority: 0.5, changeFrequency: "weekly" },
  { id: "custom", path: "/custom", label: { en: "Custom Tests", id: "Tes Buatan" }, category: "teams", primaryGoal: "teach-assess", indexable: true, activeTask: true, backend: "required", adEligibility: "outside-task", relatedRouteIds: ["teams", "typing-test"], sitemapPriority: 0.5, changeFrequency: "weekly" },
  { id: "assessments", path: "/assessments", label: { en: "Employer Assessments", id: "Asesmen Pemberi Kerja" }, category: "teams", primaryGoal: "teach-assess", indexable: true, activeTask: true, backend: "required", adEligibility: "outside-task", relatedRouteIds: ["teams", "custom"], sitemapPriority: 0.4, changeFrequency: "monthly" },
  { id: "progress", path: "/progress", label: { en: "Progress on this device", id: "Kemajuan di perangkat ini" }, category: "utility", primaryGoal: null, indexable: false, activeTask: false, backend: "none", adEligibility: "outside-task", relatedRouteIds: ["typing-test", "dictation", "transcription-practice"], sitemapPriority: 0, changeFrequency: "weekly" },
  { id: "privacy", path: "/privacy", label: { en: "Privacy", id: "Privasi" }, category: "utility", primaryGoal: null, indexable: true, activeTask: false, backend: "optional", adEligibility: "none", relatedRouteIds: ["progress"], sitemapPriority: 0.2, changeFrequency: "monthly" },
] as const satisfies readonly RouteDefinition[];

export const ROUTE_BY_ID: ReadonlyMap<string, RouteDefinition> = new Map(
  ROUTES.map((route) => [route.id, route] as [string, RouteDefinition]),
);
export const ROUTE_BY_PATH: ReadonlyMap<string, RouteDefinition> = new Map(
  ROUTES.map((route) => [route.path, route] as [string, RouteDefinition]),
);
export const INDEXABLE_ROUTES = ROUTES.filter((route) => route.indexable);

export function getRouteById(id: string): RouteDefinition | undefined {
  return ROUTE_BY_ID.get(id);
}

export function getRouteByPath(path: string): RouteDefinition | undefined {
  return ROUTE_BY_PATH.get(path);
}

export function getRelatedRoutes(route: RouteDefinition): RouteDefinition[] {
  return route.relatedRouteIds.flatMap((id) => {
    const related = getRouteById(id);
    return related ? [related] : [];
  });
}
