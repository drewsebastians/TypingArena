import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/leaderboard",
  "Leaderboard — Ranked Typing Results by Mode",
  "Ranked typing leaderboard filtered by mode, language and duration. Only integrity-checked attempts are listed."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

