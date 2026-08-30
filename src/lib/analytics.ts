"use client";
// Analytics adapter — centralized event collection with privacy gates.
//
// Providers (configured via env at build time):
//   - PostHog  (NEXT_PUBLIC_POSTHOG_KEY) — loaded lazily ONLY after the user
//     grants analytics consent. Cookieless-ish default: we do not set a
//     distinct identity cookie before consent.
//   - GA4      (NEXT_PUBLIC_GA_ID) — forwarded when a global gtag exists.
//   - Local    — always-available debug queue (capped) for development and for
//     the user's own "export my data" page.
//
// If no provider is configured, track() is a safe no-op that still feeds the
// local queue — basic practice never depends on analytics availability.

import { GA_ID, POSTHOG_HOST, POSTHOG_KEY } from "./config";
import { getAnalyticsConsent } from "./history";

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
  | "audio_seek"
  | "dictation_submit"
  | "dictation_complete"
  | "transcription_start"
  | "transcription_pause"
  | "transcription_replay"
  | "transcription_complete"
  | "goal_first_view"
  | "goal_selected"
  | "goal_workspace_ready"
  | "goal_direct_start"
  | "goal_to_route_click"
  | "task_started"
  | "task_completed"
  | "result_next_action_clicked"
  | "nickname_set"
  | "anonymous_identity_created"
  | "manage_link_created"
  | "manage_link_recovered"
  | "manage_link_revoked"
  | "shared_data_deleted"
  | "history_deleted"
  | "history_viewed"
  | "next_recommended_start"
  | "streak_incremented"
  | "daily_arena_start"
  | "daily_arena_complete"
  | "leaderboard_view"
  | "friend_challenge_created"
  | "friend_challenge_opened"
  | "friend_challenge_completed"
  | "share_card_created"
  | "share_clicked"
  | "focus_lost"
  | "suspicious_burst_detected"
  | "session_unranked"
  | "noise_challenge_start"
  | "heatmap_viewed"
  | "career_start"
  | "career_complete"
  | "multiplayer_room_created"
  | "multiplayer_joined"
  | "multiplayer_start"
  | "multiplayer_start_denied"
  | "multiplayer_finished"
  | "multiplayer_result_rejected"
  | "multiplayer_rematch"
  | "multiplayer_cancelled"
  | "team_created"
  | "team_joined"
  | "team_join_failed"
  | "assignment_created"
  | "assignment_started"
  | "assignment_completed"
  | "assignment_submission_failed"
  | "custom_test_created"
  | "custom_test_completed"
  | "custom_test_run"
  | "assessment_created"
  | "assessment_invite_invalid"
  | "assessment_invite_revoked"
  | "assessment_completed"
  | "sync_retry_scheduled"
  | "sync_permanent_rejection"
  | "ranked_submission_rejected"
  | "multiplayer_progress_connected"
  | "explore_all_tools";

const QUEUE_KEY = "ta:analytics_queue";
let posthogLoading = false;
let gtagLoading = false;

function posthogGlobal(): { capture: (e: string, p: Record<string, unknown>) => void } | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { posthog?: { capture: (e: string, p: Record<string, unknown>) => void } };
  return w.posthog ?? null;
}

/** Load PostHog from CDN only when consent exists + key configured. */
function ensurePosthog(): void {
  if (typeof window === "undefined" || posthogLoading) return;
  if (!POSTHOG_KEY || getAnalyticsConsent() !== "granted") return;
  if (posthogGlobal()) return;
  posthogLoading = true;
  const w = window as unknown as Record<string, unknown>;
  const script = document.createElement("script");
  script.src = `${POSTHOG_HOST}/static/array.js`;
  script.async = true;
  script.onload = () => {
    const shim = (w.posthog as unknown as unknown[] | undefined);
    if (Array.isArray(shim)) {
      shim.push(["init", POSTHOG_KEY, { api_host: POSTHOG_HOST, persistence: "localStorage+cookie", autocapture: false }]);
    }
  };
  // Allow a retry on the next track() call instead of wedging forever.
  script.onerror = () => {
    posthogLoading = false;
  };
  document.head.appendChild(script);
}

/**
 * Real GA4 initialization path: injects the official gtag.js loader once,
 * after consent, with IP anonymization. Events are then forwarded via the
 * standard `gtag('event', …)` queue in track().
 */
function ensureGtag(): void {
  if (typeof window === "undefined" || gtagLoading) return;
  if (!GA_ID || getAnalyticsConsent() !== "granted") return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  gtagLoading = true;
  if (!w.dataLayer) w.dataLayer = [];
  // Official gtag.js bootstrap — defines window.gtag over dataLayer.
  w.gtag =
    w.gtag ??
    function gtag(...args: unknown[]) {
      w.dataLayer!.push(args);
    };
  if (!w.dataLayer.some((entry) => Array.isArray(entry) && entry[0] === "js")) {
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, { anonymize_ip: true });
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src^="https://www.googletagmanager.com/gtag/js"]`);
  if (existing) return;
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  script.async = true;
  script.onerror = () => {
    gtagLoading = false;
  };
  document.head.appendChild(script);
}

export function track(event: EventName, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const payload = { event, props, ts: Date.now(), path: window.location.pathname };

  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as unknown[];
    q.push(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-500)));
  } catch {
    /* ignore */
  }

  // Third-party forwarding requires consent.
  if (getAnalyticsConsent() === "granted") {
    ensurePosthog();
    const ph = posthogGlobal();
    if (ph) ph.capture(event, { ...props, path: payload.path });
    if (GA_ID) {
      ensureGtag();
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) gtag("event", event, props);
    }
  }
}

/** Dev/privacy-page helper: read the local queue. */
export function getQueue(): Array<{ event: EventName; props: Record<string, unknown>; ts: number; path: string }> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function clearQueue(): void {
  if (typeof window !== "undefined") localStorage.removeItem(QUEUE_KEY);
}
