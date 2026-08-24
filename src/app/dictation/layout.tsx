import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/dictation",
  "Dictation Test — Listen & Type Exactly (EN/ID)",
  "Real dictation practice with static audio clips in English and Bahasa Indonesia. Strict + normalized scoring, word accuracy, measured replays."
,
  { languages: { id: "/dictation/indonesian" } }
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

