import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/transcription-library",
  "Transcription Library — Browsable Clip Collection (EN/ID)",
  "Browse and filter the full transcription clip library: language, difficulty, length, topic. Original static audio with verified transcripts."
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

