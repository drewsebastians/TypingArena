// @vitest-environment jsdom
// Cross-device hydration — blueprint §10/§26: signing in on a clean device
// must restore typing, dictation, transcription AND career history without
// duplicates, preserving deterministic scores and timestamps.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { attemptsMock } = vi.hoisted(() => ({ attemptsMock: vi.fn() }));vi.mock("@/lib/config", () => ({ IS_REMOTE_CONFIGURED: true }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("@/lib/remote", () => ({
  RemoteUnavailableError: class RemoteUnavailableError extends Error {
    name = "RemoteUnavailableError";
  },
  getClient: () => ({ rpc: vi.fn() }),
  getCurrentUser: async () => ({ id: "user-1", email: null }),
  fetchMyAttempts: attemptsMock,
}));

function remoteRow(clientId: string, kind: string, extra: Record<string, unknown>) {
  return {
    client_id: clientId,
    metrics: { kind, ...extra },
  } as unknown as Record<string, unknown>;
}
async function loadFresh() {
  vi.resetModules();
  return import("@/lib/sync");
}

beforeEach(async () => {
  localStorage.clear();
  attemptsMock.mockReset().mockResolvedValue([]);
});

describe("hydrateFromRemote", () => {
  it("restores a career assessment on a clean device (Device B)", async () => {
    const completedAt = 1_756_000_000_000;
    attemptsMock.mockResolvedValue([
      remoteRow(`career-data-entry-${completedAt}`, "career", {
        assessment: {
          trackId: "data-entry",
          score: 71.4,
          band: "Proficient",
          modules: [{ label: "Numeric records (EN)", kind: "typing", accuracy: 96, speedWpm: 61, efficiency: 88, integrityFlags: [] }],
          completedAt,
        },
      }),
    ]);
    const sync = await loadFresh();
    const report = await sync.hydrateFromRemote();
    expect(report.addedCareer).toBe(1);
    const stored = JSON.parse(localStorage.getItem("ta:career_history") ?? "[]") as Array<{ trackId: string; score: number; band: string; completedAt: number }>;    expect(stored).toHaveLength(1);
    // Deterministic score + timestamp preserved byte-for-byte.
    expect(stored[0].score).toBe(71.4);
    expect(stored[0].completedAt).toBe(completedAt);
    expect(stored[0].band).toBe("Proficient");
  });

  it("does not duplicate career results across repeated hydration", async () => {
    const completedAt = Date.now();
    attemptsMock.mockResolvedValue([
      remoteRow(`career-office-admin-${completedAt}`, "career", {
        assessment: { trackId: "office-admin", score: 66, band: "Proficient", modules: [], completedAt },
      }),
    ]);
    const sync = await loadFresh();
    await sync.hydrateFromRemote();
    attemptsMock.mockResolvedValue([
      remoteRow(`career-office-admin-${completedAt}`, "career", {
        assessment: { trackId: "office-admin", score: 66, band: "Proficient", modules: [], completedAt },
      }),
    ]);
    const second = await loadFresh();
    const report = await second.hydrateFromRemote();
    expect(report.addedCareer).toBe(0);
    const stored = JSON.parse(localStorage.getItem("ta:career_history") ?? "[]");
    expect(stored).toHaveLength(1);
  });

  it("keeps local and remote career results merged newest-first", async () => {
    const older = 1_000;
    localStorage.setItem(
      "ta:career_history",
      JSON.stringify([{ trackId: "punctuation", score: 50, band: "Developing", modules: [], completedAt: 5_000 }]),
    );
    attemptsMock.mockResolvedValue([
      remoteRow(`career-punctuation-${older}`, "career", {
        assessment: { trackId: "punctuation", score: 55.5, band: "Proficient", modules: [], completedAt: older },
      }),
    ]);
    const sync = await loadFresh();
    const report = await sync.hydrateFromRemote();
    expect(report.addedCareer).toBe(1);
    const stored = JSON.parse(localStorage.getItem("ta:career_history") ?? "[]") as Array<{ completedAt: number }>;
    expect(stored.map((r) => r.completedAt)).toEqual([5000, 1000]);
  });

  it("still hydrates core modes alongside career", async () => {
    attemptsMock.mockResolvedValue([
      remoteRow("t-1", "typing", { result: { grossWpm: 60, accuracy: 95, timestamp: 1 } }),
      remoteRow("d-1", "dictation", { result: { normalizedScore: 90, wordAccuracy: 92, timestamp: 2 } }),
      remoteRow("tr-1", "transcription", { result: { normalizedScore: 88, timestamp: 3 } }),
    ]);
    const sync = await loadFresh();
    const report = await sync.hydrateFromRemote();
    expect(report.addedTyping).toBe(1);
    expect(report.addedDictation).toBe(1);
    expect(report.addedTranscription).toBe(1);
    expect(JSON.parse(localStorage.getItem("ta:typing_history_v2") ?? "[]")).toHaveLength(1);
  });

  it("no-ops honestly when signed out or unconfigured", async () => {
    attemptsMock.mockResolvedValue([remoteRow("x-1", "typing", { result: { grossWpm: 1, timestamp: 1 } })]);
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({ IS_REMOTE_CONFIGURED: false }));
    const syncOff = await import("@/lib/sync");
    const report = await syncOff.hydrateFromRemote();
    expect(report.fetched).toBe(0);
  });
});
