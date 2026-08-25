// @vitest-environment jsdom
// Sync queue acceptance/retry semantics — blueprint §4.1 mandatory tests.
//
// The queue may only drop an item on DEFINITIVE server evidence:
//   accepted / idempotent duplicate / permanent validation rejection.
// Rate limits, transient backend failures and network outages must keep items
// queued with backoff — never silently lost, never hot-looped.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubmitAttemptPayload } from "@/lib/remote";

const { rpcMock, userMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  userMock: vi.fn(),
}));

vi.mock("@/lib/config", () => ({ IS_REMOTE_CONFIGURED: true }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/remote", () => ({
  RemoteUnavailableError: class RemoteUnavailableError extends Error {
    name = "RemoteUnavailableError";
  },
  getClient: () => ({ rpc: rpcMock }),
  getCurrentUser: userMock,
  fetchMyAttempts: vi.fn(async () => []),
}));

function payload(over: Partial<SubmitAttemptPayload> = {}): SubmitAttemptPayload {
  return {
    clientId: `c-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: "en-sprint-001",
    exerciseVersion: "v3",
    scoringVersion: "v2.0.0",
    mode: "sprint",
    language: "en",
    durationSec: 30,
    elapsedMs: 30000,
    typedChars: 150,
    correctChars: 142,
    integrity: "ranked",
    ...over,
  };
}

/** Drain microtasks/timers so queueAttempt's fire-and-forget flush settles. */
const settle = () => new Promise<void>((r) => setTimeout(r, 0));

function queue(): Array<{ clientId: string; nextAttemptAt?: number }> {
  return JSON.parse(localStorage.getItem("ta:sync_queue") ?? "[]");
}

async function loadFresh() {
  vi.resetModules();
  return import("@/lib/sync");
}

let sync: Awaited<ReturnType<typeof loadFresh>>;

beforeEach(async () => {
  localStorage.clear();
  rpcMock.mockReset().mockResolvedValue({ data: { accepted: true }, error: null });
  userMock.mockReset().mockResolvedValue({ id: "user-1", email: null });
  sync = await loadFresh();
});

describe("classifySubmissionResult (pure outcome taxonomy)", () => {
  it("maps transport success + accepted:true to accepted", () => {
    expect(sync.classifySubmissionResult({ accepted: true, wpm: 60 }, null)).toMatchObject({ status: "accepted" });
  });
  it("maps duplicate signal to duplicate", () => {
    expect(sync.classifySubmissionResult({ accepted: false, integrity: "practice", duplicate: true }, null)).toMatchObject({ status: "duplicate" });
  });
  it("maps persisted-but-unranked verdicts to unranked (NOT lost)", () => {
    const out = sync.classifySubmissionResult({ accepted: false, integrity: "practice", reasons: ["too_short"] }, null);
    expect(out.status).toBe("unranked");
  });
  it("maps app-level rate_limited (transport success!) to retryable", () => {
    const out = sync.classifySubmissionResult({ accepted: false, integrity: "practice", reason: "rate_limited" }, null);
    expect(out.status).toBe("retry_rate_limited");
  });
  it("maps app-level invalid_evidence to permanent rejection", () => {
    expect(sync.classifySubmissionResult({ reason: "invalid_evidence" }, null)).toMatchObject({ status: "rejected_permanent" });
  });
  it("maps PostgREST invalid_evidence errors to permanent rejection", () => {
    expect(sync.classifySubmissionResult(null, { message: "invalid_evidence" })).toMatchObject({ status: "rejected_permanent" });
  });
  it("maps unknown RPC errors to transient retry", () => {
    expect(sync.classifySubmissionResult(null, { message: "db connection lost" })).toMatchObject({ status: "retry_transient" });
  });
  it("maps unrecognized response shapes to transient retry (never silent loss)", () => {
    expect(sync.classifySubmissionResult({}, null)).toMatchObject({ status: "retry_transient" });
  });
});

describe("flushQueue acceptance/retry semantics", () => {
  it("accepted attempt leaves the queue", async () => {
    // Default mock accepts; queueAttempt's immediate flush drains the item.
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(0);
  });

  it("idempotent duplicate leaves the queue without duplicating", async () => {
    rpcMock.mockResolvedValue({ data: { accepted: false, integrity: "ranked", duplicate: true }, error: null });
    const p = payload();
    await sync.queueAttempt(p);
    await sync.queueAttempt({ ...p });
    await settle();
    expect(sync.pendingSyncCount()).toBe(0);
    // Only ONE submission ever happened for this logical attempt.
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it("network failure stays queued", async () => {
    rpcMock.mockRejectedValue(new TypeError("fetch failed"));
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(1);
    // Recovers once the network does.
    rpcMock.mockResolvedValue({ data: { accepted: true }, error: null });
    expireBackoff();
    expect(await sync.flushQueue()).toMatchObject({ sent: 1, remaining: 0 });
  });

  it("transient backend failure stays queued", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "internal_error" } });
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(1);
    expect(await sync.flushQueue()).toMatchObject({ sent: 0 }); // still backing off
  });

  it("rate-limited attempt stays queued (app-level rejection ≠ success)", async () => {
    rpcMock.mockResolvedValue({ data: { accepted: false, integrity: "practice", reason: "rate_limited" }, error: null });
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(1);
  });

  it("rate-limited attempt can succeed after backoff elapses", async () => {
    rpcMock.mockResolvedValue({ data: { accepted: false, integrity: "practice", reason: "rate_limited" }, error: null });
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(1);
    // Backoff must prevent an immediate hot retry…
    await sync.flushQueue();
    expect(rpcMock).toHaveBeenCalledTimes(1);
    // …and the scheduled retry time sits in the future.
    const q = queue();
    expect(q[0].nextAttemptAt).toBeGreaterThan(Date.now());
    q[0].nextAttemptAt = Date.now() - 1;
    localStorage.setItem("ta:sync_queue", JSON.stringify(q));
    rpcMock.mockResolvedValue({ data: { accepted: true }, error: null });
    const done = await sync.flushQueue();
    expect(done.sent).toBe(1);
    expect(done.remaining).toBe(0);
  });

  it("permanently invalid evidence does not retry forever (documented drop)", async () => {
    rpcMock.mockResolvedValue({ data: { accepted: false, integrity: "flagged", reason: "invalid_evidence" }, error: null });
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(0); // intentionally dropped under policy
    await sync.flushQueue();
    expect(rpcMock).toHaveBeenCalledTimes(1); // no endless retry loop
  });

  it("persisted-but-flagged attempts are removed exactly because they persisted", async () => {
    rpcMock.mockResolvedValue({ data: { accepted: false, integrity: "flagged", reasons: ["paste"] }, error: null });
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(0);
  });

  it("does not submit when signed out", async () => {
    userMock.mockResolvedValue(null);
    await sync.queueAttempt(payload());
    await settle();
    expect(rpcMock).not.toHaveBeenCalled();
    expect(sync.pendingSyncCount()).toBe(1);
  });

  it("no successful attempt is duplicated across flushes", async () => {
    const p = payload();
    await sync.queueAttempt(p);
    await settle();
    expect(sync.pendingSyncCount()).toBe(0);
    rpcMock.mockClear();
    // Re-enqueueing the SAME client id is a local no-op…
    await sync.queueAttempt({ ...p });
    await settle();
    expect(rpcMock).not.toHaveBeenCalled();
    // …and a later flush finds nothing to send.
    expect(await sync.flushQueue()).toMatchObject({ sent: 0, remaining: 0 });
  });

  it("queue survives reload (localStorage-backed)", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "timeout" } });
    await sync.queueAttempt(payload());
    await settle();
    expect(sync.pendingSyncCount()).toBe(1);
    // Fresh module instance = fresh page load.
    const revived = await loadFresh();
    expect(revived.pendingSyncCount()).toBe(1);
    rpcMock.mockResolvedValue({ data: { accepted: true }, error: null });
    expireBackoff();
    expect(await revived.flushQueue()).toMatchObject({ sent: 1, remaining: 0 });
  });

  it("queue cap stays safe under pathological backlog", async () => {
    rpcMock.mockRejectedValue(new Error("offline")); // keep items queued during seeding
    for (let i = 0; i < 620; i++) {
      localStorage.setItem(
        "ta:sync_queue",
        JSON.stringify([...queue(), { clientId: `bulk-${i}`, enqueuedAt: Date.now(), payload: payload({ clientId: `bulk-${i}` }), attempts: 0 }]),
      );
    }
    await sync.queueAttempt(payload({ clientId: "final-item" }));
    await settle();
    const stored = queue();
    expect(stored.length).toBeLessThanOrEqual(sync.QUEUE_CAP);
    expect(stored.length).toBeGreaterThan(0);
  });

  it("concurrent flushes coalesce (no double submission)", async () => {
    rpcMock.mockImplementation(() => new Promise((r) => setTimeout(() => r({ data: { accepted: true }, error: null }), 5)));
    await sync.queueAttempt(payload()); // triggers flush #1 (in flight)
    await Promise.all([sync.flushQueue(), sync.flushQueue()]);
    await new Promise((r) => setTimeout(r, 30)); // let the in-flight flush land
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(sync.pendingSyncCount()).toBe(0);
  });
});

function expireBackoff() {
  localStorage.setItem(
    "ta:sync_queue",
    JSON.stringify(queue().map((i) => ({ ...i, nextAttemptAt: Date.now() - 1 }))),
  );
}
