"use client";

// Deterministic analytics — blueprint §16 event taxonomy
// MVP: console + localStorage queue, production swap to PostHog/GA4 via env var without changing call sites

export type EventName =
  | "landing_view"
  | "organic_landing_view"
  | "test_start"
  | "typing_test_start"
  | "typing_test_complete"
  | "keystroke_error"
  | "correction"
  | "paste_detected"
  | "dictation_start"
  | "audio_play"
  | "audio_pause"
  | "audio_replay"
  | "dictation_submit"
  | "dictation_complete"
  | "transcription_start"
  | "transcription_pause"
  | "transcription_replay"
  | "transcription_complete"
  | "account_created"
  | "history_viewed"
  | "next_recommended_start"
  | "streak_incremented"
  | "daily_arena_start"
  | "daily_arena_complete"
  | "leaderboard_view"
  | "friend_challenge_created"
  | "friend_challenge_completed"
  | "share_card_created"
  | "share_clicked"
  | "focus_lost"
  | "suspicious_burst_detected"
  | "session_unranked"
  | "noise_challenge_start"
  | "heatmap_viewed";

const QUEUE_KEY = "ta:analytics_queue";

export function track(event: EventName, props: Record<string, unknown> = {}) {
  const payload = { event, props, ts: Date.now(), path: typeof window !== "undefined" ? window.location.pathname : "" };
  if (typeof window !== "undefined") {
    // console for dev inspection
    console.debug(`[analytics] ${event}`, props);
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      q.push(payload);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-500)));
      // also dispatch custom event for any listener (e.g., Data layer)
      window.dispatchEvent(new CustomEvent("ta:track", { detail: payload }));
    } catch {}
    // placeholder: if window.gtag exists, forward
    const w = window as unknown as { gtag?: (...args: unknown[]) => void; posthog?: { capture: (e: string, p: unknown) => void } };
    if (w.gtag) w.gtag("event", event, props);
    if (w.posthog) w.posthog.capture(event, { ...props, path: payload.path });
  }
}

export function getQueue(): unknown[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}

export function clearQueue() {
  if (typeof window !== "undefined") localStorage.removeItem(QUEUE_KEY);
}
