import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/teams",
  "Teams & Classrooms — Assignments, Practice Rooms and Dashboards",
  "Create a team room, publish practice assignments (sprint, dictation, transcription, data entry), and track aggregate completion. Privacy-first: usernames only.",
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
