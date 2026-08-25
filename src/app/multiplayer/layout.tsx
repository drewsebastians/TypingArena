import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/multiplayer",
  "Multiplayer Typing Race — Real-Time Rooms",
  "Create a room, share the code, and race friends through the same passage in real time. Casual, latency-tolerant competition with a live lobby.",
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
