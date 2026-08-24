import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

// Private page — history must never be indexed (blueprint §17).
export const metadata = routeMetadata(
  "/progress",
  "Your Progress — Private History & Skill Profile",
  "Private typing, dictation and transcription history with streaks and skill analysis.",
  { noindex: true },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
