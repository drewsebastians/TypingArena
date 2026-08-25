import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/assessments",
  "Skills Assessment Builder for Employers — Practice & Operational Checks",
  "Create short standardized skills assessments (typing, data entry, dictation, transcription) with invite links. Candidates complete without signup; results stay private to the organizer.",
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
