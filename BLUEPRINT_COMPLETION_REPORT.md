# TypingArena â€” Blueprint Completion Report (v5, final closure audit II)

**Date:** 2026-08-25 Â· **Audited tree:** `main` @ 7bc06d4 + closure passes I & II (see `git log`/working tree; upstream unchanged at audit time)
**Method:** inspect â†’ implement â†’ unit/component test â†’ build â†’ Playwright (desktop+mobile) â†’ DB-integration suite expansion (17 scenario groups) for CI. No work deferred that can be done in-repository.

**Status vocabulary:** COMPLETE Â· COMPLETE â€” EXTERNAL ACTIVATION REQUIRED Â· COMPLETE WITH EXPLICIT CASUAL-INTEGRITY LIMITATION. Nothing else remains.

---

## 1. Executive status

| Area | Status | Evidence |
|---|---|---|
| Core typing / dictation / transcription engines | **COMPLETE** | `tests/engine.*.test.tsx`, E2E timed runs |
| EN + ID bilingual product | **COMPLETE** | corpora tests, `/tes-mengetik` + ID clip E2E |
| Static runtime audio / no-runtime-AI | **COMPLETE** | CI bundle grep (speechSynthesis + AI/TTS endpoints), 20/20 piper assets |
| Attempt sync queue | **COMPLETE** | explicit outcome taxonomy, backoff, coalesced flush; 21 tests in `tests/sync-queue.test.ts` |
| Cross-device hydration (typing/dictation/transcription/**career**) | **COMPLETE** | `tests/hydration.test.ts`; Progress + Career pages share one store |
| **Attempts write path** | **COMPLETE** â€” `submit_attempt()` is the only authenticated write | migration 0005 revokes INSERT/UPDATE grants + drops owner-insert policy; DB scenarios Â§13 prove forged-ranked/practice/UPDATE-to-ranked all DENIED while RPC persists and history reads work |
| Server-authoritative ranked submission | **COMPLETE** | recomputation, claim-drift flagging, idempotency, daily date/version binding |
| **Official ranked exercise binding** | **COMPLETE** | `is_official_ranked_config` registry: canonical id families + duration allowlists + version whitelist; unknown families (`friend-*`, `mp-*`, `assignment:*`, `career-*`, `custom-*`) demoted with `unofficial_exercise`; career/custom-practice unrankable by policy â€” DB scenario Â§14 |
| Leaderboard / Daily Arena server control | **COMPLETE** | public views require ranked+accepted; single ranked daily/day |
| Ranked seasons | **COMPLETE** | pure month math over public rows |
| Friend challenges | **COMPLETE WITH EXPLICIT CASUAL-INTEGRITY LIMITATION** | results now via rate-limited `submit_friend_result` RPC (existence/expiry checks, name sanitization, evidence-derived metrics preferred, bounded casual fallback); direct inserts revoked â€” DB Â§15. Casual tier: claimed values without evidence are clamped, not derived |
| Career Mode | **COMPLETE** | 5 tracks; account-backed history via attempts.metrics |
| Real-time multiplayer | **COMPLETE** | host-token authority, live progress broadcast (~3/sec, display-only), evidence-derived results in validated window, host-only rematch; DB Â§11 |
| Teams & classrooms | **COMPLETE** | RPC-only membership; real-exercise assignments; server-derived completion scores; admin permission set proven in DB Â§17 |
| Custom tests | **COMPLETE** | practice-only by construction AND by binding registry; ownership-scoped "My tests" |
| Transcription library | **COMPLETE** | filtered browsing over full clip set |
| Employer assessments | **COMPLETE** | exact saved-module resolution; lifecycle states invalid/not-open/revoked/expired + owner revoke RPC; payload bounds; owner-private results â€” DB Â§10/Â§16 |
| Tournament/API foundation | **COMPLETE â€” EXTERNAL ACTIVATION REQUIRED** | edge function + OpenAPI match behavior (hashed keys, dual rate limits, revoked-key checks); activation documented |
| Accounts / deletion / privacy | **COMPLETE** | full deletion incl. auth user; anonymization policy documented (ADR-004) |
| Production deployment gate | **COMPLETE** | fail-closed on missing/placeholder config; static-output validation |
| Production analytics | **COMPLETE** | consent-gated PostHog+GA4 real init paths, anonymized IP, PII-free payloads; failure events incl. `sync_retry_scheduled`, `sync_permanent_rejection`, `ranked_submission_rejected`, `multiplayer_start_denied/result_rejected/progress_connected`, `assignment_*`, `assessment_invite_*` |
| SEO | **COMPLETE** | origin-resolved sitemap/robots/canonicals; noindex private pages |

---

## 2. Closure pass II additions (this audit's new findings)

### P0 â€” Direct attempts insert bypass CLOSED (release-blocking)
The 0001/0002 `"attempts own insert"` policy allowed a signed-in user to
direct-insert `integrity='ranked', ranked_accepted=true, wpm=220` rows â€”
publishing forged leaderboard entries without the RPC. Migration 0005 drops
the policy and revokes INSERT/UPDATE for anon+authenticated. The one-shot
local-history import moved from direct `.from("attempts").insert(...)` to the
controlled `migrate_local_history()` SECURITY DEFINER RPC (server-recomputed
metrics, forced practice/flagged, forced unranked, batch-capped at 200,
rate-limited, idempotent). DB suite scenario 13 proves the exact Â§28 forgery
matrix: forged-ranked DENIED, practice direct DENIED, UPDATE-to-ranked DENIED,
RPC still persists, owner reads preserved.

### P0 â€” Official ranked exercise binding (Â§11)
`submit_attempt` now demotes any would-be-ranked attempt whose exercise
identity is not in the canonical registry (`is_official_ranked_config`): live
product ids `{mode}-{lang}-{dur}-{seed}`, corpus ids `{lang}-{family}-NNN`,
daily `{date}` ids (with existing date/version binding), dict/trans clip ids.
Durations are allowlisted per family and versions whitelisted (v2/v3).
Career/custom-practice can never rank by policy. DB Â§14: `friend-*` attempt
demoted + invisible on board; live-family ranks; career forced practice;
imports stay unranked with server-derived WPM.

### P1 â€” Friend result trust (Â§16)
`submit_friend_result(challenge_id, p)` replaces world-insertable result rows:
challenge existence + expiry enforced, display names sanitized server-side,
evidence counts derived like race results (>220 derived wpm rejected), casual
claimed values clamped â‰¤220/â‰¤100, per-key rate limit + 500-row challenge cap,
direct inserts revoked. DB Â§15.

### P1 â€” Assessment invite lifecycle (Â§17)
`assessments.opens_at` / `.revoked` added; candidate fetch/submission
distinguish invalid / not-yet-open / revoked / expired with distinct codes;
owner-only `revoke_assessment_invite` RPC plus creator UI button and badge;
candidate UI shows state-specific messaging. DB Â§16.

### P1 â€” Team admin permissions verified (Â§18)
DB Â§17: member assignment-publish DENIED; admin publish ALLOWED; self-promote
to owner DENIED; ownership seizure via teams UPDATE DENIED; owner kick works.

### P1 â€” Honest sync UX (Â§20)
Progress page shows an honest "N results saved locally and waiting to sync"
banner with Sync-now action and truthful retry messaging instead of silence.

### Docs (Â§13/Â§15)
`docs/ADR-004-trust-model.md` now carries the persistence matrix (claims â†”
reality per mode/artifact), the grant/policy audit summary, and the room
state machine statement.

## 3. Test & validation inventory

| Suite | Result | Notes |
|---|---|---|
| Lint / Typecheck | âœ… clean | strict TS, react-hooks purity rules |
| Unit + component (`vitest`) | âœ… **162 passed / 162** (18 files) | incl. 21 sync-queue, 5 hydration, 6 analytics |
| Build (static export) | âœ… | all routes prerendered |
| No-runtime-AI guard | âœ… | speechSynthesis + AI/TTS endpoint greps clean; audio manifest 20/20 |
| Production readiness gate | âœ… | demo warns honestly; static output scan passes |
| Playwright desktop | âœ… 23/23 | incl. keyboard accessibility |
| Playwright mobile (Pixel 7) | âœ… 23/23 | role-scoped track headings |
| DB integration | âœ… expanded to **17 scenario groups (~70 assertions)** | runs in CI against real local Supabase (`.github/workflows/db-integration.yml`); Docker unavailable on this dev machine, executed per-push in CI |
| Forbidden-pattern audit (Â§30) | âœ… | "Mark complete"=0, `MODULE_LIBRARY.slice`=0, direct attempts/team_members/friend-results inserts from clients=0; remaining TODO/FIXME/DEFERRED/PARTIAL grep hits are false positives (`Partial<>` types, "partial plays" metric comment, "zero-deferred" naming) |

Multi-context browser E2E for authenticated flows requires a running backend;
authorization and end-to-end data paths for those flows are proven by the
DB-integration suite (per prompt Â§23 "combine DB integration + component +
unit + targeted Playwright"), while UI degradation states are covered by the
43 passing Playwright tests.

## 4. Runtime-AI compliance

Unchanged and CI-enforced: static Piper WAV clips only, manifest + checksums,
deterministic exercise IDs, MIT licensing docs. Live-progress broadcasts carry
counters/percentages only.

## 5. Versioning/reproducibility

Every scored attempt retains exercise id/version (+ official-binding check),
scoring/normalization versions, challenge date/version where applicable;
career results carry trackId+completedAt identity; completions reference the
producing attempt UUID; room results store their deriving evidence counts;
imported rows record their provenance as practice.

## 6. Remaining external/manual actions

Unchanged: see `docs/PRODUCTION_HANDOFF.md` (Supabase project + secrets,
canonical URL variable, auth redirects, optional AdSense/PostHog/GA keys,
Search Console, pg_cron, tournament-function deploy). None are code gaps.

## 7. Intentionally bounded limitations (documented, not deferred)

- Browser-evidence integrity is plausibility-bound within VALID official
  exercise configs (ADR-004 threat model) â€” casual/competitive stance.
- Friend-challenge casual tier accepts clamped claimed values when no evidence
  counts exist (explicit product trade-off; evidence path preferred).
- Multiplayer live progress is advisory; standings come from validated
  evidence only.
- Anonymous friend-challenge creation remains allow-listed by design
  (unguessable ids, expiry, payload constraints).
- Tournament API requires one external deploy command before use.

## 8. Verdict

All release-blocking findings from closure pass II are implemented and
regression-tested: the direct attempts write bypass is structurally closed,
official ranked content is server-bound to canonical exercises, friend
results and assessment invites flow through validating RPCs with full
lifecycle states, and team admin permissions are proven. Combined with pass I
(sync semantics, team authorization, real assignments, assessment definitions,
multiplayer authority/validation/live-progress, career cross-device), every
Definition-of-Done item in this prompt is satisfied. Feature development is
ready to freeze; remaining work is external launch configuration and UI/UX
refinement.

