import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TypingArena — Train typing, dictation & transcription",
    template: "%s | TypingArena",
  },
  description: "Train and prove how accurately and quickly you can turn what you see or hear into text. Sprint, Copy Pro, Dictation, Transcription, Daily Arena. English + Indonesian. Free, no login required.",
  metadataBase: new URL("https://typingarena.example"),
  openGraph: {
    title: "TypingArena",
    description: "One arena for typing, listening, dictation and transcription performance.",
    type: "website",
  },
  keywords: ["typing test", "wpm test", "typing speed test", "tes mengetik", "dictation", "transcription practice", "data entry test", "punctuation typing"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-4">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">TypingArena — Human skill is the product. No runtime AI inference.</div>
            <div className="mt-1">Free-first • Ads never inside active test • English + Indonesian • Deterministic scoring v1.0.0</div>
            <div className="mt-2 flex justify-center gap-4">
              <a href="/typing-test" className="hover:underline">Typing Test</a>
              <a href="/dictation" className="hover:underline">Dictation</a>
              <a href="/daily-arena" className="hover:underline">Daily Arena</a>
              <a href="/progress" className="hover:underline">Progress</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
