// @vitest-environment jsdom
// Analytics validation — blueprint §13/§35:
//   * local queue always records (product must not depend on providers);
//   * third-party forwarding is strictly consent-gated;
//   * PostHog AND GA4 have REAL initialization paths (script injection) that
//     fire only after consent;
//   * no PII (email/raw text) travels in event payloads.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { configValues } = vi.hoisted(() => ({
  configValues: {
    POSTHOG_KEY: "phc_test_key",
    POSTHOG_HOST: "https://us.i.posthog.com",
    GA_ID: "G-TEST123",
  },
}));

vi.mock("@/lib/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/config")>()),
  ...configValues,
}));

async function loadFresh() {
  vi.resetModules();
  return import("@/lib/analytics");
}

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = "";
  delete (window as unknown as { posthog?: unknown }).posthog;
  delete (window as unknown as { gtag?: unknown }).gtag;
  delete (window as unknown as { dataLayer?: unknown }).dataLayer;
});

describe("analytics adapter", () => {
  it("records every event into the local queue WITHOUT consent", async () => {
    const analytics = await loadFresh();
    analytics.track("typing_test_complete", { wpm: 60, accuracy: 95 });
    const q = analytics.getQueue();
    expect(q).toHaveLength(1);
    expect(q[0].event).toBe("typing_test_complete");
    expect(q[0].props.wpm).toBe(60);
  });

  it("injects NO third-party scripts before consent", async () => {
    const analytics = await loadFresh();
    analytics.track("leaderboard_view", {});
    await Promise.resolve();
    expect(document.querySelector("script")).toBeNull();
    expect((window as unknown as { gtag?: unknown }).gtag).toBeUndefined();
  });

  it("initializes PostHog via real script injection once consent is granted", async () => {
    const analytics = await loadFresh();
    const { setAnalyticsConsent } = await import("@/lib/history");
    setAnalyticsConsent("granted");
    analytics.track("daily_arena_complete", {});
    // The loader script is attached synchronously by ensurePosthog().
    const ph = document.querySelector<HTMLScriptElement>(`script[src="${configValues.POSTHOG_HOST}/static/array.js"]`);
    expect(ph).not.toBeNull();
    // Simulate the snippet defining window.posthog as the preload queue.
    const shim: unknown[] = [];
    (window as unknown as { posthog: unknown }).posthog = shim;
    ph!.onload?.(new Event("load"));
    expect(shim[0]).toEqual(["init", "phc_test_key", { api_host: configValues.POSTHOG_HOST, persistence: "localStorage+cookie", autocapture: false }]);
  });

  it("initializes GA4 with anonymized IP through the official bootstrap", async () => {
    const analytics = await loadFresh();
    const { setAnalyticsConsent } = await import("@/lib/history");
    setAnalyticsConsent("granted");
    analytics.track("account_login", { stage: "otp-sent" });
    const w = window as unknown as { dataLayer?: unknown[][]; gtag?: (...args: unknown[]) => void };
    expect(w.gtag).toBeTypeOf("function");
    const flat = JSON.stringify(w.dataLayer);
    expect(flat).toContain("config");
    expect(flat).toContain(configValues.GA_ID);
    expect(flat).toContain("anonymize_ip");
    expect(document.querySelector(`script[src^="https://www.googletagmanager.com/gtag/js?id=${configValues.GA_ID}"]`)).not.toBeNull();
  });

  it("never forwards anything when consent is denied", async () => {
    const analytics = await loadFresh();
    const { setAnalyticsConsent } = await import("@/lib/history");
    setAnalyticsConsent("denied");
    analytics.track("sync_retry_scheduled", { attempts: 1 });
    expect(document.querySelector("script")).toBeNull();
    expect(analytics.getQueue()).toHaveLength(1); // local-only record remains
  });

  it("event payloads stay free of obvious PII keys", async () => {
    const analytics = await loadFresh();
    const events: Array<[Parameters<typeof analytics.track>[0], Record<string, unknown>]> = [
      ["typing_test_start", { durationSec: 30, language: "en", mode: "sprint" }],
      ["dictation_complete", { normalizedScore: 90 }],
      ["multiplayer_start", { code: "ABC123" }],
      ["assignment_completed", { assignmentId: "a1" }],
      ["assessment_completed", { modules: 3 }],
      ["team_joined", {}],
      ["custom_test_run", { language: "en" }],
      ["career_complete", { score: 71 }],
      ["friend_challenge_created", {}],
      ["share_card_created", {}],
    ];
    for (const [event, props] of events) analytics.track(event, props);
    const forbidden = ["email", "user_email", "typed", "text", "transcript", "token", "password"];
    for (const entry of analytics.getQueue()) {
      for (const key of Object.keys(entry.props)) {
        expect(forbidden).not.toContain(key.toLowerCase());
      }
    }
  });
});
