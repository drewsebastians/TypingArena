import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/seasons",
  "Ranked Seasons — Monthly Typing Ladders",
  "Monthly ranked seasons for typing and Daily Arena ladders. Only server-verified ranked attempts count; archives are permanent.",
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
