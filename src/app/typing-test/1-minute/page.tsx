import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "1 Minute Typing Test — Free WPM Test (60s)",
  description: "Take the 1 minute typing test. Standard 60-second WPM & accuracy benchmark. Instant start, per-key errors, no login required.",
};

export default function OneMinutePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">1 Minute Typing Test</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">The classic 60-second benchmark. Same engine, fixed duration.</p>
      <div className="mt-4 rounded-xl border-2 border-black p-6 text-center dark:border-white">
        <div className="text-5xl font-black">60s</div>
        <div className="text-sm text-zinc-500">Standard duration</div>
        <Link href="/typing-test?duration=60" className="mt-4 inline-block rounded-full bg-black px-8 py-3 font-bold text-white dark:bg-white dark:text-black">Start 1-Minute Test →</Link>
      </div>
      <div className="mt-4 flex gap-2 text-sm">
        <Link href="/typing-test?duration=15" className="underline">15s sprint</Link>
        <Link href="/typing-test?duration=30" className="underline">30s</Link>
        <Link href="/tes-mengetik" className="underline">Tes 1 menit Indonesia</Link>
      </div>
    </div>
  );
}
