import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How TypingArena handles your data: anonymous-first practice, optional accounts, local history you control, consent-based analytics, and deletion tools.",
};

const sections: Array<{ h: string; body: React.ReactNode }> = [
  {
    h: "Anonymous first",
    body: (
      <p>
        You can complete every test without an account. Results from anonymous sessions are stored only in your own browser
        (localStorage) and never leave your device unless you choose to sign in.
      </p>
    ),
  },
  {
    h: "What we store locally",
    body: (
      <>
        <p>Test results (scores, error profiles, timestamps), your streak, your chosen display name, and your analytics consent choice.</p>
        <p className="mt-2">We do not store raw keystroke streams — only summarized per-key error statistics needed to power skill analysis.</p>
      </>
    ),
  },
  {
    h: "Optional accounts",
    body: (
      <p>
        Accounts use passwordless email links. Your email is private and is never displayed; leaderboards show only the public username
        you choose. Signing in lets you sync history across devices and enter ranked boards.
      </p>
    ),
  },
  {
    h: "Analytics & ads",
    body: (
      <p>
        Product analytics load only after you explicitly allow them (banner or Privacy choice), and are used to understand feature usage —
        no data sale, no ad-tech tracking pixels before consent. Ad slots are reserved spaces on discovery and result pages; they never
        appear inside an active test and nothing autoplays audio.
      </p>
    ),
  },
  {
    h: "Deleting your data",
    body: (
      <>
        <p>
          Use <Link href="/progress" className="underline">Progress → Privacy</Link> to export or delete all local data with one click, or
          delete all account data if signed in.
        </p>
        <p className="mt-2">Friend challenge entries expire automatically after 30 days.</p>
      </>
    ),
  },
  {
    h: "Audio content",
    body: (
      <p>
        Dictation and transcription clips are static files generated during development from original narrations written for {SITE_NAME}.
        Source and license records ship with each clip (see the repository&apos;s docs/LICENSES.md).
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black">Privacy</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Short version: practice anonymously, your data stays yours, accounts are optional, analytics need consent, deletion is real.
      </p>
      <div className="mt-6 space-y-6">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-bold">{s.h}</h2>
            <div className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
