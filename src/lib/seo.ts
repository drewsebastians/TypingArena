import type { Metadata } from "next";

/** Consistent per-route metadata: canonical + localized titles/descriptions. */
export function routeMetadata(
  path: string,
  title: string,
  description: string,
  opts: { noindex?: boolean; languages?: Record<string, string> } = {},
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(opts.languages ? { languages: opts.languages } : {}),
    },
    ...(opts.noindex
      ? { robots: { index: false, follow: true, nocache: false } }
      : {}),
  };
}
