import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-static";

// Tool-led sitemap: every listed route is a working tool. Private pages
// (/progress) are excluded. No thin programmatic pages.
const ROUTES: Array<{ path: string; priority: number; freq: "daily" | "weekly" | "monthly" }> = [
  { path: "/", priority: 1, freq: "weekly" },
  { path: "/typing-test", priority: 0.9, freq: "weekly" },
  { path: "/typing-test/1-minute", priority: 0.8, freq: "weekly" },
  { path: "/typing-test/5-minute", priority: 0.8, freq: "weekly" },
  { path: "/typing-test/indonesian", priority: 0.8, freq: "weekly" },
  { path: "/tes-mengetik", priority: 0.9, freq: "weekly" },
  { path: "/dictation", priority: 0.9, freq: "weekly" },
  { path: "/dictation/english", priority: 0.8, freq: "weekly" },
  { path: "/dictation/indonesian", priority: 0.8, freq: "weekly" },
  { path: "/transcription-practice", priority: 0.8, freq: "weekly" },
  { path: "/transcription-library", priority: 0.7, freq: "weekly" },
  { path: "/data-entry-test", priority: 0.7, freq: "weekly" },
  { path: "/punctuation-typing-test", priority: 0.7, freq: "weekly" },
  { path: "/career", priority: 0.8, freq: "weekly" },
  { path: "/seasons", priority: 0.6, freq: "daily" },
  { path: "/multiplayer", priority: 0.5, freq: "weekly" },
  { path: "/teams", priority: 0.5, freq: "weekly" },
  { path: "/custom", priority: 0.5, freq: "weekly" },
  { path: "/assessments", priority: 0.4, freq: "monthly" },
  { path: "/noise-challenge", priority: 0.6, freq: "weekly" },
  { path: "/daily-arena", priority: 0.7, freq: "daily" },
  { path: "/leaderboard", priority: 0.6, freq: "daily" },
  { path: "/friends", priority: 0.5, freq: "weekly" },
  { path: "/privacy", priority: 0.2, freq: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // SITE_URL already includes the base path (e.g. GitHub Pages project sites).
  const base = SITE_URL;
  return ROUTES.map((r) => ({
    url: r.path === "/" ? `${base}/` : `${base}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.freq,
    priority: r.priority,
  }));
}

