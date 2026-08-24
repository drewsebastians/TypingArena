import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/typing-test/1-minute",
  "1 Minute Typing Test — Standard 60s WPM",
  "The standard one-minute typing test. Full 60 seconds on the clock, continuous passages, gross and net WPM with accuracy."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

