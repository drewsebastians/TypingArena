import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/daily-arena",
  "Daily Arena — Today's Shared Typing Challenge",
  "Everyone gets the same standardized challenge each day (resets Asia/Jakarta midnight). Clean attempts enter the shared ranked board."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

