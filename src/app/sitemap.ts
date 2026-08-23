import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://typingarena.example";
  const routes = [
    "",
    "/typing-test",
    "/typing-test/1-minute",
    "/typing-test/indonesian",
    "/tes-mengetik",
    "/dictation",
    "/dictation/english",
    "/dictation/indonesian",
    "/transcription-practice",
    "/data-entry-test",
    "/punctuation-typing-test",
    "/daily-arena",
    "/leaderboard",
    "/progress",
  ];
  return routes.map((r) => ({
    url: `${base}${r || "/"}`,
    lastModified: new Date(),
    changeFrequency: r === "/daily-arena" ? "daily" : "weekly",
    priority: r === "" ? 1 : r === "/typing-test" ? 0.9 : 0.7,
  }));
}
