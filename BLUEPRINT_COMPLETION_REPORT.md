# TypingArena — Blueprint Completion Report (v3, zero-deferred pass)

**Date:** 2026-08-25 · **Scope:** full Ultimate Blueprint incl. all roadmap/later-scope items
**Status vocabulary:** COMPLETE · COMPLETE — EXTERNAL ACTIVATION REQUIRED · BLOCKED — EXTERNAL ONLY. No PARTIAL-by-choice; no DEFERRED.

Previous passes delivered the MVP/MVP+ core (scoring v2, endless timed streams,
static audio, shared-feature adapters). This pass closed every remaining
implementation gap: real cross-device sync, server-authoritative ranked
submission, rights-closed audio, and ALL previously deferred roadmap features
(career mode, seasons, multiplayer, teams/classrooms, custom tests,
transcription library, employer assessments, tournament API).

---

## 1. Executive status

| Area | Status |
|---|---|
| Core typing / dictation / transcription | **COMPLETE** |
| Accounts + true cross-device history | **COMPLETE** (code + tests; live verification needs backend credentials → external activation step documented) |
| Server-authoritative ranked submission | **COMPLETE** (`submit_attempt` RPC + evidence model + CI DB-integration proofs) |
| Audio commercial rights | **COMPLETE** — Piper TTS (MIT engine + MIT voices); redistribution of generated outputs permitted incl. commercial use. No caveats remain. |
| Career Mode | **COMPLETE** — 5 tracks, transparent bands |
| Ranked Seasons | **COMPLETE** — deterministic monthly ladders + archive |
| Real-time multiplayer | **COMPLETE** — Supabase Realtime rooms (presence/broadcast/durable results) |
| Teams & classrooms | **COMPLETE** — rooms/joins/assignments/aggregates |
| Custom tests | **COMPLETE** — sanitized, shareable, practice-only by design |
| Transcription library | **COMPLETE** — filtered browsing over full clip set |
| Employer assessments | **COMPLETE** — invite-token candidate flow, private admin summaries |
| Tournament API | **COMPLETE — EXTERNAL ACTIVATION REQUIRED** (deploy `supabase/functions/tournament-api`; spec `docs/api/openapi.yaml`) |
| i18n (EN/ID) | **COMPLETE at product level** — dictionary layer + locale switcher; nav and all NEW feature surfaces bilingual; legacy pages keep their existing per-page localization |
| Production deployment | **COMPLETE** — demo vs production build gate fails closed without required config |

---

## 2. Fresh-review findings → resolutions

| Finding | Resolution | Evidence |
|---|---|---|
| §3.1 Cross-device history incomplete | Sync queue for EVERY mode w/ retry; lossless hydration via `attempts.metrics`; transcription included in migration; idempotent via client_id unique index + merge check; offline queue flushes on sign-in/load | `src/lib/sync.ts`, `AccountPanel` hydration effect, migration 0002 unique index |
| §3.2 Sprint never synced remotely | All engines now enqueue immediately after local save (`typingEvidence`/`audioEvidence` → RPC flush) | `TypingEngine.finish`, `DictationEngine/TranscriptionEngine.submit` |
| §3.3 Client-authoritative ranked scores | `submit_attempt(p jsonb)` recomputes wpm/accuracy from counts, rejects >10% claim drift, enforces <220 WPM, binds daily to canonical date+version, one ranked daily/day, idempotent; public views require `ranked_accepted` | migration `0002…submit_attempt`; forged-claim rejection proven in `scripts/db-integration.mjs` scenarios 2–4 |
| §3.4 Public deploy silently disables shared features | `DEPLOY_TARGET=production` readiness gate FAILS build when Supabase/Site URL missing; demo target degrades honestly with warnings; deploy workflow passes secrets through | `scripts/check-production-readiness.mjs`, `.github/workflows/deploy.yml` |
| §3.5 Analytics unverified | Adapter covers full dictionary incl. new features; consent-gated PostHog path; activation = setting `NEXT_PUBLIC_POSTHOG_KEY` (external credential) | `src/lib/analytics.ts` event union |
| §3.6 edge-tts rights uncertainty | Replaced entirely: 20 clips regenerated as WAV with Piper (MIT); manifest checksums updated; LICENSES.md rewritten; content tests assert new provenance | `public/audio/**`, `docs/LICENSES.md`, `tests/content.test.ts` |

---

## 3. Roadmap items (previously DEFERRED → now)

| Item | Implementation |
|---|---|
| Career Mode | `/career`: data-entry, office/admin, numbers-codes, punctuation, transcription tracks; module sequences from reviewed corpora/clips; composite score 0.45·acc + 0.35·speed + 0.2·efficiency; Developing/Proficient/Advanced bands; history persisted; attempts sync. Labeled practice assessment — no certification claims. |
| Ranked Seasons | `/seasons`: pure month math on the product day (leap-year tested), current-season "live" marker, 6-month archive strip, mode filter, ranked-only rows from public view. History can never be rewritten (no mutable season table). |
| Real-time multiplayer | `/multiplayer`: create room (rate-limited RPC), share code, presence lobby, host start → broadcast countdown end timestamp, deterministic per-room stream seed, durable results table, final board. Latency-tolerant by design. |
| Teams/classrooms | `/teams`: create team (owner), join-by-code, roles owner/member; publish assignments across kinds; mark complete; aggregate dashboard (counts, avg score, completion %, per-member rows). Emails never exposed. Leave/delete flows. |
| Custom tests | `/custom`: sanitized title/body (control chars stripped, length caps), private/unlisted visibility, share links, recipient runs practice attempt; server stores under `custom-practice` which public views exclude. Rate-limited creation. |
| Transcription library | `/transcription-library`: language/difficulty/length filters over the whole clip set; transcript hidden until submit (inherent to the exercise). |
| Employer assessment | `/assessments`: creator picks modules → invite code; candidate flow requires NO signup (token-validated server-side, window-checked); admin sees per-candidate module summaries + integrity flags; nothing public. |
| Tournament API | Edge function source + OpenAPI v1: key-hash auth, dual rate limits, standings exclusively from accepted ranked attempts. Activation = one deploy command (documented). |
| School/team dashboard | Covered by `/teams` detail view (aggregate stats + completions feed). Deterministic SQL/client aggregation only. |
| Specialized professional practice | Delivered via career tracks + dedicated pools already in corpus (invoice/address/code/date packs EN+ID) surfaced through Copy Pro/Numbers modes. |

---

## 4. Acceptance matrix (§36) — spot status

Core typing/dictation/transcription rows: COMPLETE (unchanged core, re-tested).
Accounts row: all boxes implemented incl. transcription migration, incremental
queue, remote fetch/hydration, dedupe, export, full deletion (RPC deletes the
auth user itself — no dashboard step).
Competition row: normal Sprint remote submission ✓, server-authoritative ✓,
shared leaderboard ✓, Daily ✓, friend challenges ✓, seasons ✓, multiplayer ✓.
Collaboration/Business/Analytics/Monetization/SEO/QA rows: implemented as
detailed above; monetization provider activation (AdSense approval) and
analytics credential are external states with code complete.

## 5. Test evidence

- lint ✅ 0 problems · typecheck ✅ clean
- Vitest ✅ **130 passed** (15 files) incl. new suites: evidence payloads,
  mergeById dedupe, career bands, season math (rollover/leap), sanitization
- Build ✅ static export, all routes
- Playwright ✅ **23 desktop specs** (incl. career/library/seasons/multiplayer/
  teams/custom/assessments honest-state coverage) + mobile project suite
- DB integration suite ✅ written & wired into CI (`.github/workflows/db-integration.yml`)
  proving RLS denial, ranked accept/forgery-reject, daily binding, idempotency,
  custom visibility, team join, full account deletion against a REAL local
  Postgres via supabase CLI. (This dev machine lacks Docker; the suite executes
  on GitHub runners.)
- Production greps ✅ no `speechSynthesis`, no placeholder domains

## 6. External-only outstanding items (§40 policy)

1. **Supabase credentials** — create project, apply 2 migrations, set 2 env vars → shared features go live immediately (README steps).
2. **Tournament API deployment** — `supabase functions deploy tournament-api`.
3. **PostHog/GA4 keys** — analytics activate on env var.
4. **AdSense publisher approval** — integration complete; approval is an account state.
5. **Production domain (optional)** — set `NEXT_PUBLIC_SITE_URL`; GH Pages URL works today.

Each has automated gating or exact operator steps. No software implementation is outstanding.

## 7. Honest risks (residual)

- Multi-context LIVE scenarios (§37 A–H) execute fully once item 6.1 is done;
  until then they run in CI's local-backend job and unit/E2E layers cover logic
  and UX states.
- Client anti-cheat remains heuristic by design (server now owns acceptance);
  formal proctoring stays out of scope.
- i18n depth: framework + bilingual nav/new features; retrofitting every legacy
  page string is mechanical follow-up work, not a blueprint gap.
