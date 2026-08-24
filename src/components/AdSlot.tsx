"use client";
// Ad slot abstraction (blueprint §21).
//
// - Reserved min-height so enabling ads later causes zero layout shift (CLS).
// - Real ad markup loads ONLY when NEXT_PUBLIC_ADSENSE_CLIENT is configured.
// - Never render inside an active task: pages place slots outside the engine
//   regions; the component itself refuses `forbidden` placement in dev builds
//   as a tripwire.

import { ADS_ENABLED } from "@/lib/config";

export default function AdSlot({
  slot,
  format = "horizontal",
  forbidden = false,
  className = "",
}: {
  slot: string;
  format?: "horizontal" | "rectangle";
  /** Dev tripwire — set true where ads are never allowed (active test areas). */
  forbidden?: boolean;
  className?: string;
}) {
  if (process.env.NODE_ENV !== "production" && forbidden) {
    return (
      <div className="rounded-xl border-2 border-red-400 bg-red-50 p-3 text-center text-xs font-bold text-red-700">
        AD PLACEMENT VIOLATION — active task area ({slot})
      </div>
    );
  }
  const height = format === "rectangle" ? "min-h-[250px]" : "min-h-[90px]";
  return (
    <aside aria-label="advertisement" className={`flex ${height} w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white text-center dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      {ADS_ENABLED ? (
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={undefined /* injected at build via _document script when configured */}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <span className="text-xs text-zinc-400">Ad space — reserved (never during active tests)</span>
      )}
    </aside>
  );
}
