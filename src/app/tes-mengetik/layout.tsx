import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/tes-mengetik",
  "Tes Mengetik Cepat — Uji WPM & Akurasi Anda",
  "Tes mengetik cepat gratis: 15/30/60 detik dan 5 menit. Ukur WPM dan akurasi dengan analisis kesalahan per huruf. Tanpa pendaftaran."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

