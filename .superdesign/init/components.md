# Shared UI components

The codebase is Next.js App Router + React 19 with custom Tailwind utility classes. There is no third-party component library; the reusable UI primitives and cross-route components below are the source of truth.

## `src/components/ui/primitives.tsx`

Reusable page heading, card, empty state, and notice primitives.

```tsx
"use client";
import type { ReactNode } from "react";

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>{children}</div>;
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="text-sm text-zinc-500">{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Notice({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "warning" | "info" }) {
  const styles =
    variant === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
      : variant === "info"
        ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200"
        : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";
  return <div className={`rounded-xl border p-4 text-sm ${styles}`}>{children}</div>;
}
```

## `src/components/AdSlot.tsx`

Safe advertising boundary. It hides itself while an active task context or document marker is present and reserves stable dimensions outside task execution.

```tsx
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
```

## `src/components/ResultCard.tsx`

Typing result hierarchy with integrity status, primary metrics, progressive detail, and cross-mode next actions.

```tsx
"use client";
import type { TypingResult } from "@/lib/types";
import Link from "next/link";
import ErrorHeatmap from "./ErrorHeatmap";
import { track } from "@/lib/analytics";
import { INTEGRITY_EXPLANATIONS } from "@/lib/integrity";

export default function ResultCard({ result, onNext }: { result: TypingResult; onNext?: () => void }) {
  const shareText = `I typed ${result.grossWpm} WPM at ${result.accuracy}% accuracy on TypingArena (${result.durationSec}s ${result.language}) — try to beat me!`;
  const weakKeys = Object.entries(result.perKeyErrors)
    .filter(([, v]) => v.rate > 0.2 && v.exposures >= 3)
    .sort((a, b) => b[1].rate - a[1].rate)
    .slice(0, 5);

  return (
    <div className="w-full max-w-3xl rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-lg font-bold">Your Result</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${result.integrity === "ranked" ? "bg-emerald-100 text-emerald-800" : result.integrity === "flagged" ? "bg-red-100 text-red-800" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"}`}>
          {result.integrity.toUpperCase()}
        </span>
        <span className="ml-auto text-xs text-zinc-500">{new Date(result.timestamp).toLocaleString()}</span>
      </div>
      <p className="text-xs text-zinc-500">{INTEGRITY_EXPLANATIONS[result.integrity]}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="rounded-xl bg-zinc-50 p-5 text-center dark:bg-zinc-800">
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Words per minute</div>
          <div className="font-mono text-4xl font-black">{result.grossWpm}</div>
          <div className="mt-1 text-xs text-zinc-500">net {result.netWpm} • {result.cpm} CPM</div>
        </div>
        <Stat label="Accuracy" main={`${result.accuracy}%`} sub={`${result.correctChars}/${result.typedChars}`} />
        <Stat label="Time" main={`${(result.elapsedMs / 1000).toFixed(1)}s`} sub={`of ${result.durationSec}s • ${result.uncorrectedErrors} left unfixed`} />
      </div>

      {weakKeys.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Focus next: {weakKeys.map(([k]) => (k === " " ? "space" : `"${k}"`)).join(" ")}
          </div>
          <div className="text-xs text-amber-800 dark:text-amber-300">We’ll bias upcoming passages toward these characters.</div>
        </div>
      )}

      <details className="mt-4 rounded-lg border bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <summary className="cursor-pointer list-none text-sm font-semibold">Details — corrections & heatmap</summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white p-3 dark:bg-zinc-900">
              <div className="font-semibold">Corrections</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                {result.correctedErrors} fixed • {result.rawErrorEvents} raw events • {result.backspaceActions} backspaces
              </div>
              {result.correctionLatencyMsAvg !== null && <div className="mt-1 text-zinc-500">Avg latency {result.correctionLatencyMsAvg}ms</div>}
            </div>
            <div className="rounded-lg bg-white p-3 dark:bg-zinc-900">
              <div className="font-semibold">Scope</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-400">Typed {result.typedChars} chars • accuracy over typed scope only</div>
            </div>
          </div>
          <ErrorHeatmap result={result} />
        </div>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            track("share_card_created", { wpm: result.grossWpm });
            if (navigator.share) navigator.share({ title: "TypingArena", text: shareText }).catch(() => {});
            else navigator.clipboard.writeText(shareText).catch(() => {});
            track("share_clicked", { wpm: result.grossWpm });
          }}
          className="min-h-11 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Share result
        </button>
        <Link href="/dictation" onClick={() => { track("next_recommended_start", { from: "typing", to: "dictation" }); track("result_next_action_clicked", { to: "/dictation" }); }} className="min-h-11 rounded-full border border-amber-400 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Test your listening →
        </Link>
        <Link href="/friends" onClick={() => track("result_next_action_clicked", { to: "/friends" })} className="min-h-11 rounded-full border border-violet-300 bg-violet-50 px-5 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200">Challenge friend</Link>
        <Link href="/daily-arena" onClick={() => track("result_next_action_clicked", { to: "/daily-arena" })} className="min-h-11 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Daily Arena</Link>
        {onNext && <button onClick={() => { track("result_next_action_clicked", { to: "next-exercise" }); onNext(); }} className="min-h-11 rounded-full bg-zinc-100 px-5 py-2 text-sm font-semibold dark:bg-zinc-800">Next exercise</button>}
      </div>
    </div>
  );
}

function Stat({ label, main, sub }: { label: string; main: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-800">
      <div className="text-xs uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="text-3xl font-black">{main}</div>
      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}
```

## `src/components/ConsentBanner.tsx`

Consent-gated analytics prompt; ordinary practice does not depend on accepting it.

```tsx
"use client";
import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/history";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (getAnalyticsConsent() === null) setVisible(true); }, []);
  if (!visible) return null;
  const decide = (choice: "granted" | "denied") => { setAnalyticsConsent(choice); setVisible(false); };
  return (
    <div role="dialog" aria-label="Analytics privacy choice" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-zinc-300 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 sm:inset-x-auto sm:right-4">
      <p className="text-sm">Help improve TypingArena? With your permission we collect anonymous usage events (test starts/completions) to understand what to build next. No ads tracking, no sale of data. You can change this anytime on the <a href="/privacy" className="underline">Privacy</a> page.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => decide("granted")} className="rounded-full bg-black px-5 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-black">Allow</button>
        <button onClick={() => decide("denied")} className="rounded-full border px-5 py-1.5 text-sm font-medium">No thanks</button>
      </div>
    </div>
  );
}
```

## `src/components/LocaleProvider.tsx`

Client locale state and dynamic document language.

```tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLocale, setLocale as persistLocale, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({ locale: "en", setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    setLocaleState(getLocale());
    const onStorage = (e: StorageEvent) => { if (e.key === "ta:locale" && (e.newValue === "en" || e.newValue === "id")) setLocaleState(e.newValue); };
    const onCustom = () => setLocaleState(getLocale());
    window.addEventListener("storage", onStorage); window.addEventListener("locale-change", onCustom);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("locale-change", onCustom); };
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = (next: Locale) => { persistLocale(next); setLocaleState(next); window.dispatchEvent(new Event("locale-change")); };
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
```
