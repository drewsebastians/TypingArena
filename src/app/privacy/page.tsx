import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How TypingArena handles local practice data, opt-in shared features, consent-based analytics, and deletion.",
};

const sections: Array<{ h: string; body: React.ReactNode }> = [
  {
    h: "Practice stays local",
    body: <p>You can complete typing, dictation, transcription, and Career practice without creating a contact identity. Scores, error summaries, timestamps, streaks, and your optional nickname stay in this browser unless you explicitly use a shared feature.</p>,
  },
  {
    h: "Shared features are opt-in",
    body: <p>Publishing a ranked attempt, entering Daily Arena, creating a team, custom test, assessment, or multiplayer room starts an anonymous Supabase session only when needed. Shared authorization still uses the authenticated role, RLS, and server-authoritative RPCs. No contact details or credentials are requested.</p>,
  },
  {
    h: "Nicknames and management links",
    body: <><p>Leaderboards and team rosters show a nickname, never contact details or an auth UUID. Team, custom-test, and assessment management links contain a high-entropy secret in the URL fragment. The database stores only a SHA-256 digest, and creating a new link revokes the previous one.</p><p className="mt-2">Treat a management link like a key: anyone who has it can attempt recovery for that specific resource.</p></>,
  },
  {
    h: "Analytics and ads",
    body: <p>Product analytics load only after you explicitly allow them. Events contain feature metadata, not typed text, answers, contact details, auth UUIDs, or capability tokens. Ad slots are reserved outside active exercises and never autoplay audio.</p>,
  },
  {
    h: "Exporting and deleting",
    body: <><p>Use <Link href="/progress" className="underline">Progress → Privacy</Link> to export or delete local practice data. The same panel can delete shared results and workspaces owned by the current device identity; it does not delete the auth record itself, so the action remains a product-data deletion rather than an identity-administration flow.</p><p className="mt-2">Friend challenge entries expire automatically after 30 days.</p></>,
  },
  {
    h: "Audio content",
    body: <p>Dictation and transcription clips are static files generated during development from original narrations written for {SITE_NAME}. Source and license records ship with each clip (see the repository&apos;s docs/LICENSES.md).</p>,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black">Privacy</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Short version: practice locally, choose shared features when useful, use a nickname, and delete what you no longer want stored.</p>
      <div className="mt-6 space-y-6">
        {sections.map((section) => <section key={section.h}><h2 className="font-bold">{section.h}</h2><div className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{section.body}</div></section>)}
      </div>
    </div>
  );
}
