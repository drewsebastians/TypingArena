import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tes Mengetik Cepat — Tes Kecepatan Mengetik Indonesia",
  description: "Tes mengetik cepat bahasa Indonesia gratis. Uji WPM & akurasi 15/30/60 detik. Tanpa daftar, langsung mulai. Tes kecepatan mengetik terbaik.",
};

export default function TesMengetik() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-black">Tes Mengetik Cepat</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Tes kecepatan mengetik bahasa Indonesia — gratis, instan, tanpa login. Cocok untuk pelajar, pencari kerja, dan latihan transkripsi.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[15,30,60].map(d => (
          <Link key={d} href={`/typing-test/indonesian?duration=${d}`} className="rounded-xl border-2 bg-white p-6 text-center hover:border-black dark:bg-zinc-900">
            <div className="text-3xl font-black">{d}s</div>
            <div className="text-sm text-zinc-500">Mulai tes</div>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex gap-2 text-sm">
        <Link href="/dictation/indonesian" className="rounded-full bg-black px-4 py-2 text-white">Latihan dikte →</Link>
        <Link href="/daily-arena" className="rounded-full border px-4 py-2">Daily Arena</Link>
      </div>
    </div>
  );
}
