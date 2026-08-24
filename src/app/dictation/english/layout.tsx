import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/dictation/english",
  "English Dictation Test Online — Free Listening Practice",
  "Free English dictation test: listen to real audio clips and type exactly what you hear. Punctuation-aware scoring with replay analytics."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

