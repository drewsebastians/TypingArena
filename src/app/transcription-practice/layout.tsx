import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/transcription-practice",
  "Transcription Practice — Clips with Replay Analytics",
  "Transcription sprint practice: full-length English and Indonesian clips, word and punctuation accuracy, replay ratio tracking."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

