import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/career",
  "Career Mode — Practice Assessments for Data Entry, Transcription & Office Skills",
  "Structured career-readiness practice tracks with transparent scoring: data entry, office admin, numbers & codes, punctuation precision, and transcription. Skill benchmark, not certification.",
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
