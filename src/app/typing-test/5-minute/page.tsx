import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "5 Minute Typing Test — Extended WPM & Endurance",
  description: "5 minute typing test for endurance and consistency. Measure sustained WPM, accuracy drift, and weak keys. Free, no login, per-key heatmap.",
};

export default function FiveMinutePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-black">5 Minute Typing Test</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Endurance mode — consistency matters more than bursts. Track WPM decay and late-stage errors.</p>
      <div className="mt-4 rounded-xl border-2 border-black p-6 text-center dark:border-white">
        <div className="text-5xl font-black">5:00</div>
        <div className="text-sm text-zinc-500">Standard long-form endurance</div>
        <Link href="/typing-test?duration=300" className="mt-4 inline-block rounded-full bg-black px-8 py-3 font-bold text-white dark:bg-white dark:text-black">Start 5-Minute Test →</Link>
      </div>
      <div className="mt-3 rounded-xl border bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">MVP note: 5-minute uses sprint corpus looped. In production, dedicated long-form passages with sustained difficulty curve.</div>
      <div className="mt-4 flex gap-2 text-sm">
        <Link href="/typing-test?duration=60" className="underline">1 minute</Link>
        <Link href="/typing-test?duration=30" className="underline">30s sprint</Link>
        <Link href="/progress" className="underline">View progress</Link>
      </div>
    </div>
  );
}
