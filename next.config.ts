import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // For https://drewsebastians.github.io/TypingArena/
  // Local dev and Vercel ignore basePath
  basePath: isGithubPages ? "/TypingArena" : "",
  assetPrefix: isGithubPages ? "/TypingArena/" : undefined,
  trailingSlash: true,
};

export default nextConfig;
