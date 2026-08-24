import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo";

export const metadata = routeMetadata(
  "/dictation/indonesian",
  "Dikte Bahasa Indonesia — Latihan Mendengar & Menulis",
  "Latihan dikte online gratis dengan audio asli. Ketik persis apa yang Anda dengar; skor ketat dan toleran tersedia."

);

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}

