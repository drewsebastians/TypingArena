"use client";

import { useEffect, useState } from "react";
import { ADS_ENABLED } from "@/lib/config";
import { useActiveTask } from "./tool/ActiveTaskBoundary";

export interface SafeAdSlotProps {
  slot: string;
  format?: "horizontal" | "rectangle";
  /** Explicit task state. When true, no ad markup is rendered at all. */
  activeTask?: boolean;
  /** Kept for compatibility with existing route call sites. */
  forbidden?: boolean;
  context?: "result" | "discovery" | "outside-task";
  className?: string;
}

/**
 * Safe advertising boundary. It suppresses itself when a nested task context
 * or any engine-owned document activity marker says the user is practicing.
 * The mutation observer matters for route-level slots that sit below an
 * engine, so they disappear as soon as the task begins.
 */
export function SafeAdSlot({
  slot,
  format = "horizontal",
  activeTask,
  forbidden,
  className = "",
}: SafeAdSlotProps) {
  const contextActive = useActiveTask();
  const [documentActive, setDocumentActive] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDocumentActive(root.hasAttribute("data-exercise-active"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-exercise-active"] });
    return () => observer.disconnect();
  }, []);

  if (forbidden || activeTask === true || contextActive || documentActive) return null;

  const height = format === "rectangle" ? "min-h-[250px]" : "min-h-[90px]";
  return (
    <aside aria-label="advertisement" data-ad-slot={slot} className={`flex ${height} w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white text-center dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {ADS_ENABLED ? (
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={undefined /* injected at build via _document script when configured */}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <span className="text-xs text-zinc-400">Ad space — reserved outside active tasks</span>
      )}
    </aside>
  );
}

export default function AdSlot(props: SafeAdSlotProps) {
  return <SafeAdSlot {...props} />;
}
