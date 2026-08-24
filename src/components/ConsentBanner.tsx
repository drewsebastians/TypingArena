"use client";
// Lightweight analytics consent layer (blueprint §14).
//
// Product analytics load ONLY after explicit consent. Anonymous practice never
// requires a choice — the banner is dismissible and remembers the decision.

import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/history";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getAnalyticsConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (choice: "granted" | "denied") => {
    setAnalyticsConsent(choice);
    setVisible(false);
  };

  return (
    <div role="dialog" aria-label="Analytics privacy choice" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border border-zinc-300 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 sm:inset-x-auto sm:right-4">
      <p className="text-sm">
        Help improve TypingArena? With your permission we collect anonymous usage events (test starts/completions) to understand what to build next. No ads tracking, no sale of data. You can change this anytime on the{" "}
        <a href="/privacy" className="underline">Privacy</a> page.
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => decide("granted")} className="rounded-full bg-black px-5 py-1.5 text-sm font-semibold text-white dark:bg-white dark:text-black">Allow</button>
        <button onClick={() => decide("denied")} className="rounded-full border px-5 py-1.5 text-sm font-medium">No thanks</button>
      </div>
    </div>
  );
}
