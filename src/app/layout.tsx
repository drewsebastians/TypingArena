import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ConsentBanner from "@/components/ConsentBanner";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SITE_NAME, SITE_URL } from "@/lib/config";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Typing, Dictation & Transcription Arena`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Train and prove how accurately and quickly you turn what you see or hear into text. Timed typing tests, real dictation audio, transcription sprints, Daily Arena and ranked boards. English + Bahasa Indonesia. Free, no setup required.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} — Typing, Dictation & Transcription Arena`,
    description: "One arena for typing, listening, dictation and transcription performance.",
    type: "website",
    siteName: SITE_NAME,
  },
  keywords: [
    "typing test", "wpm test", "typing speed test", "tes mengetik", "tes kecepatan mengetik",
    "dictation test", "transcription practice", "data entry test", "punctuation typing", "dikte bahasa indonesia",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <LocaleProvider>
          <Header />
          <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-4">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">{SITE_NAME} — Human skill is the product. No AI inference at runtime.</div>
            <div className="mt-1">Free-first • Ads never inside active tests • English + Indonesian • Scoring v2.0.0</div>
            <div className="mt-2 flex justify-center gap-4">
              <a href="/typing-test" className="hover:underline">Typing Test</a>
              <a href="/dictation" className="hover:underline">Dictation</a>
              <a href="/daily-arena" className="hover:underline">Daily Arena</a>
              <a href="/progress" className="hover:underline">Progress</a>
              <a href="/privacy" className="hover:underline">Privacy</a>
            </div>
          </div>
        </footer>
          <ConsentBanner />
        </LocaleProvider>
      </body>
    </html>
  );
}
