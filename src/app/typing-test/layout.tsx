import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/typing-test",
  "Typing Speed Test — 15/30/60s & 5-Minute WPM",
  "Free timed typing test with real WPM, accuracy and per-key error analysis. Tests run the full clock with continuous passages. English and Indonesian.",
  { languages: { "id": "/tes-mengetik" } },
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
