import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/custom",
  "Custom Tests — Create & Share Practice Passages",
  "Create your own typing practice passages with sanitized content and unlisted share links. Practice-only; never ranked."
);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

