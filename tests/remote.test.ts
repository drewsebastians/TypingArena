import { describe, expect, it } from "vitest";
import { serializeSubmitAttemptPayload, type SubmitAttemptPayload } from "@/lib/remote";

describe("serializeSubmitAttemptPayload", () => {
  it("maps browser evidence to the authoritative snake_case RPC contract", () => {
    const payload: SubmitAttemptPayload = {
      clientId: "client-1",
      exerciseId: "assignment:sprint:sprint:en",
      exerciseVersion: "v2",
      scoringVersion: "v2.0.0",
      normalizationVersion: "n1",
      mode: "sprint",
      language: "en",
      durationSec: 30,
      elapsedMs: 30_000,
      typedChars: 150,
      correctChars: 142,
      uncorrectedErrors: 8,
      focusLostCount: 0,
      pasteFlag: false,
      burstFlag: false,
      claimedWpm: 60,
      claimedAccuracy: 94.7,
      integrity: "ranked",
      challengeDate: "2026-09-03",
      challengeVersion: "v2",
      metrics: { kind: "typing" },
    };

    expect(serializeSubmitAttemptPayload(payload)).toEqual({
      client_id: "client-1",
      exercise_id: "assignment:sprint:sprint:en",
      exercise_version: "v2",
      scoring_version: "v2.0.0",
      normalization_version: "n1",
      mode: "sprint",
      language: "en",
      duration_sec: 30,
      elapsed_ms: 30_000,
      typed_chars: 150,
      correct_chars: 142,
      uncorrected_errors: 8,
      focus_lost_count: 0,
      paste_flag: false,
      burst_flag: false,
      claimed_wpm: 60,
      claimed_accuracy: 94.7,
      integrity: "ranked",
      challenge_date: "2026-09-03",
      challenge_version: "v2",
      metrics: { kind: "typing" },
    });
  });

  it("omits optional undefined values instead of sending malformed JSON fields", () => {
    const payload: SubmitAttemptPayload = {
      clientId: "client-2",
      exerciseId: "sprint-en-30-1",
      exerciseVersion: "v3",
      scoringVersion: "v2.0.0",
      mode: "sprint",
      language: "en",
      durationSec: 30,
      elapsedMs: 30_000,
      typedChars: 20,
      correctChars: 20,
      integrity: "ranked",
    };

    const serialized = serializeSubmitAttemptPayload(payload);
    expect(serialized).toMatchObject({ client_id: "client-2", duration_sec: 30, typed_chars: 20 });
    expect(serialized).not.toHaveProperty("normalization_version");
    expect(serialized).not.toHaveProperty("challenge_date");
  });
});
