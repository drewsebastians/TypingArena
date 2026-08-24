import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/friends",
  "Friend Challenge — Share a Typing Battle Link",
  "Create a typing challenge link your friend can open on any device — same passage, compared scores."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

