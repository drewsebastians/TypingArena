import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/punctuation-typing-test",
  "Punctuation Typing Test — Copy Pro Precision",
  "Punctuation and capitalization typing practice: quotes, apostrophes, dashes, business text. Measure symbol precision with per-key analysis."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

