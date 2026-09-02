import { afterEach, describe, expect, it, vi } from "vitest";

describe("public URL configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("derives the manual asset base path from the canonical site URL", async () => {
    vi.stubEnv("GITHUB_PAGES", "false");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://drewsebastians.github.io/TypingArena");
    vi.resetModules();

    const { absoluteUrl, BASE_PATH } = await import("@/lib/config");

    expect(BASE_PATH).toBe("/TypingArena");
    expect(absoluteUrl("/typing-test")).toBe("https://drewsebastians.github.io/TypingArena/typing-test");
  });

  it("uses root-relative manual assets for the custom domain", async () => {
    vi.stubEnv("GITHUB_PAGES", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://typingarena.click/");
    vi.resetModules();

    const { absoluteUrl, BASE_PATH } = await import("@/lib/config");

    expect(BASE_PATH).toBe("");
    expect(absoluteUrl("/typing-test")).toBe("https://typingarena.click/typing-test");
  });
});
