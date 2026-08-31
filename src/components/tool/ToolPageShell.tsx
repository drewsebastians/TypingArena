"use client";

import { useEffect, type ReactNode } from "react";

export default function ToolPageShell({
  eyebrow,
  title,
  description,
  children,
  width = "max-w-6xl",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  width?: "max-w-3xl" | "max-w-5xl" | "max-w-6xl";
}) {
  return (
    <div className={`mx-auto ${width} px-4 py-6`}>
      <QueryStateRobots />
      <header className="mx-auto max-w-3xl">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{eyebrow}</p>}
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>}
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

/** Query variants are utility/share state, never search landing pages. */
function QueryStateRobots() {
  useEffect(() => {
    if (!window.location.search) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    meta.dataset.queryStateRobots = "true";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return null;
}
