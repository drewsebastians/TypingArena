// Central production configuration. All values resolve at build time (static export).
// No placeholder domains may appear anywhere else in the app.

const IS_GITHUB_PAGES = process.env.GITHUB_PAGES === "true";

// Canonical public origin (no trailing slash, includes base path when deployed
// under a sub-path such as GitHub Pages project sites).
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim() !== "") {
    return explicit.trim().replace(/\/+$/, "");
  }
  if (IS_GITHUB_PAGES) {
    // Repository demo deployment: https://drewsebastians.github.io/TypingArena/
    return "https://drewsebastians.github.io/TypingArena";
  }
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "TypingArena";

/** Base path segment ("") or "/TypingArena") for link building outside next/link. */
export const BASE_PATH = IS_GITHUB_PAGES ? "/TypingArena" : "";

/** Shared competition backend (Supabase). When unset the app degrades honestly:
 *  local practice still works; shared boards show a setup notice instead of fake data. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const IS_REMOTE_CONFIGURED =
  SUPABASE_URL.trim() !== "" && SUPABASE_ANON_KEY.trim() !== "";

/** Product analytics (PostHog). Loaded only after analytics consent is granted. */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

/** Ad network. Reserved slots render regardless; real markup loads only when configured. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
export const ADS_ENABLED = ADSENSE_CLIENT.trim() !== "";

/** Development-only speech-synthesis fallback for dictation when static audio is
 *  absent. Never compiled into production bundles (guarded by NODE_ENV). */
export const ENABLE_DEV_TTS_FALLBACK = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_TTS_FALLBACK !== "0";

export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${BASE_PATH}${p === "/" && BASE_PATH ? "/" : p}`;
}
