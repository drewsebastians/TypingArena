import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const fallbackGithubPagesBasePath = "/TypingArena";

/**
 * GitHub Pages supports both repository project sites and custom domains.
 * The public canonical URL is the source of truth for the served path so the
 * same Pages workflow can emit /TypingArena/* for the demo or root-relative
 * assets/routes for https://typingarena.click/.
 */
function resolveBasePath(): string {
  if (!isGithubPages) return "";

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredSiteUrl) return fallbackGithubPagesBasePath;

  try {
    const pathname = new URL(configuredSiteUrl).pathname.replace(/\/+$/, "");
    return pathname === "/" ? "" : pathname;
  } catch {
    // Preserve the historical project-site fallback rather than emitting an
    // accidentally root-relative Pages artifact from malformed configuration.
    return fallbackGithubPagesBasePath;
  }
}

const basePath = resolveBasePath();

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Project-site and custom-domain paths are derived from NEXT_PUBLIC_SITE_URL.
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
};

export default nextConfig;
