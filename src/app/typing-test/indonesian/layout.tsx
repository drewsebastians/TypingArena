import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/typing-test/indonesian",
  "Tes Mengetik Bahasa Indonesia — WPM & Akurasi",
  "Uji kecepatan dan akurasi mengetik dengan korpus Bahasa Indonesia asli. Gratis tanpa daftar."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

