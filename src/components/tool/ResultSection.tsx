"use client";

import type { ReactNode } from "react";

export default function ResultSection({
  title = "Your result",
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby="result-section-title" data-result-section className={`rounded-2xl border bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <h2 id="result-section-title" className="text-lg font-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
