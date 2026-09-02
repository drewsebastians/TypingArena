import { afterEach, describe, expect, it, vi } from "vitest";

describe("Next static export path configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("emits root paths for the GitHub Pages custom domain", async () => {
    vi.stubEnv("GITHUB_PAGES", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://typingarena.click/");
    vi.resetModules();

    const { default: nextConfig } = await import("../next.config");

    expect(nextConfig.basePath).toBe("");
    expect(nextConfig.assetPrefix).toBeUndefined();
  });

  it("keeps the repository project-site path for the existing demo origin", async () => {
    vi.stubEnv("GITHUB_PAGES", "true");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://drewsebastians.github.io/TypingArena/");
    vi.resetModules();

    const { default: nextConfig } = await import("../next.config");

    expect(nextConfig.basePath).toBe("/TypingArena");
    expect(nextConfig.assetPrefix).toBe("/TypingArena/");
  });
});
