"use client";

import Link from "next/link";
import { getRelatedRoutes, type RouteDefinition } from "@/lib/routeRegistry";

export default function RelatedTools({ route, title = "Keep practicing" }: { route: RouteDefinition; title?: string }) {
  const related = getRelatedRoutes(route).slice(0, 3);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-tools-title" className="mt-6">
      <h2 id="related-tools-title" className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {related.map((item) => (
          <Link key={item.id} href={item.path} className="inline-flex min-h-11 items-center rounded-full border bg-white px-3 py-1.5 text-sm hover:border-black dark:bg-zinc-900 dark:hover:border-white">
            {item.label.en}
          </Link>
        ))}
      </div>
    </section>
  );
}
