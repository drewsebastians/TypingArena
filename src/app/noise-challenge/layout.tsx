import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/noise-challenge",
  "Noise Challenge — Dictation Under Noise Levels",
  "Train listening under noise: four difficulty tiers layered over dictation clips. Deterministic scoring, honest difficulty labeling."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

