import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/typing-test/5-minute",
  "5 Minute Typing Test — Endurance",
  "A true five-minute typing endurance test. Passages keep flowing for the full 300 seconds — pace, stamina and sustained accuracy."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

