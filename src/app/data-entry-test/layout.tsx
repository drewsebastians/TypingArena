import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/data-entry-test",
  "Data Entry Test — Numbers, Dates & Codes Practice",
  "Free data entry test with realistic numbers: dates, phone numbers, item codes, currency and mixed alphanumeric records."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

