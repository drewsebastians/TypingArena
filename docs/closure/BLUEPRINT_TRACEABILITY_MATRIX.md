# Blueprint Traceability Matrix

This matrix reconciles the canonical v2 blueprint and batching plan with the
implemented repository. The attached closure prompt is treated as the
execution specification; this document is the evidence index, not a replacement
for either canonical source.

Status vocabulary follows `docs/blueprint/TypingArena_Grand_Batching_Plan_v2.md`:
COMPLETE — PROVEN, IMPLEMENTED — PROOF PENDING, PARTIAL, PENDING,
EXTERNAL ACTION REQUIRED, and POST-LAUNCH VALIDATION.

| Batch | Blueprint scope | Repository materialization | Evidence / owner | Status |
| --- | --- | --- | --- | --- |
| B00 / R0 | Baseline, canonical documents, branch reconciliation | `docs/blueprint/`, `docs/goal-first/source/`, baseline evidence, current branch ancestry | `docs/goal-first/02_FOLLOWUP_BASELINE.md`, git history | COMPLETE — PROVEN |
| B01 | Six goals and route contracts | `src/lib/goals.ts`, `src/lib/routeRegistry.ts`, navigation, sitemap | unit tests, 26 route definitions, 30 static routes | COMPLETE — PROVEN |
| B02 / R1 | Anonymous identity, RLS, capability tokens | migrations `0015_anonymous_identity_capabilities.sql` + `0016_public_board_privacy.sql`, `src/lib/remote.ts`, `src/lib/resourceAccess.ts` | Fresh final-head GitHub DB integration is recorded in `PR4_FINAL_INDEPENDENT_REVIEW.md`; historical run `33312001583` predates 0016 | COMPLETE — PROVEN |
| B03 | Local-first practice and no visible account UX | local history/sync, consent-gated analytics, no login controls | unit/E2E no-legacy-auth checks, production readiness scan | COMPLETE — PROVEN |
| B04 | Global shell and progressive disclosure | `Header`, `LocaleProvider`, shared route navigation, mobile drawer | desktop/mobile E2E and 320px overflow test | COMPLETE — PROVEN |
| B05 | Goal-First landing page | `src/app/page.tsx`, goal cards, embedded typing/dictation/transcription workspaces | Goal-First E2E: six goals and real first workspace | COMPLETE — PROVEN |
| B06 | Lifecycle, result, and ad-safe primitives | `ActiveTaskBoundary`, `ToolPageShell`, `ResultSection`, `NextStepCard`, `SafeAdSlot` | unit tests, independent typing/audio/Daily ad-boundary E2E | COMPLETE — PROVEN |
| B07 / R2 | Typing route family | `PracticeRoutePage`, all seven typing routes, route-specific copy, 15/30/60/300s presets | 15s/30s full-clock, 5-minute, accuracy, paste, Indonesian, route-contract E2E | COMPLETE — PROVEN |
| B08 / R3 | Dictation/transcription active family | shared audio shell, static WAVs, hidden answers, playback metrics, noise challenge | audio asset readiness, EN/ID playback and audio ad-boundary E2E | COMPLETE — PROVEN |
| B09 / R4 | Library and Career alignment | filterable `TranscriptionLibraryPanel`, direct clip start, five real Career tracks, score bands | library/Career E2E, 20/20 WAV readiness, local history code | COMPLETE — PROVEN |
| B10 / R5 | Daily, leaderboard, seasons | shared shells, honest unconfigured states, Daily result next steps, monthly season UI | Daily/leaderboard/seasons E2E; DB ranked/daily assertions | COMPLETE — PROVEN |
| B11 / R6 | Friends and multiplayer | central challenge flow, realtime rooms, host authority, evidence-bound results | E2E honest degradation; DB security assertions for room/token/results | COMPLETE — PROVEN |
| B12 / R7 | Teams, custom tests, assessments | team assignments, custom sanitization, invite/module sequence, capability recovery | DB integration team/custom/assessment assertions; E2E route coverage | COMPLETE — PROVEN |
| B13 / R8 | Progress, privacy, persistence | device history, export/delete controls, nickname boundary, noindex progress | unit tests, privacy/progress E2E, route metadata and robots checks | COMPLETE — PROVEN |
| B14 / R9–R11 | SEO, analytics, ads | route metadata, canonical registry/sitemap, consent-gated events, sanitized analytics boundary, reserved SafeAdSlot boundaries | readiness/provider scan, independent query-SEO/ad tests, measurement plan; provider/AdSense activation remains external | COMPLETE — PROVEN for repository scope |
| B15 / R12 | Whole-product a11y, mobile, performance, consistency | shared shells, 44px interactive targets, focus trap, reduced motion, responsive route coverage | independent 6-viewport route matrix, drawer/keyboard/locale/ad tests; human/device/CWV remains external | COMPLETE — PROVEN for automated scope |
| B16 / R14 | Traceability and independent red-team | this matrix, final reviews, forbidden-pattern audit, exact validation register | closure documents and CI gates | COMPLETE — PROVEN |
| R13 | Hosted preview / production readiness | deterministic `scripts/production-smoke.mjs`, fail-closed production readiness gate | no hosted/staging URL or credentials available in workspace | EXTERNAL ACTION REQUIRED |
| R15 | Owner merge and deployment | PR #4 opened; branch intentionally not merged/deployed | repository owner controls merge, secrets, hosting, and deployment | EXTERNAL ACTION REQUIRED |
| R16 | Strategic validation | `docs/analytics/STRATEGIC_VALIDATION_MEASUREMENT_PLAN.md` | requires real consented post-launch traffic | POST-LAUNCH VALIDATION |

## Forbidden-pattern audit

- Production build output contains no `speechSynthesis`, runtime AI/TTS
  endpoint, or placeholder-domain fingerprint.
- No ordinary practice screen exposes sign-in, sign-up, password, email, or
  magic-link controls.
- Typed passages, audio answers, capability secrets, auth UUIDs, and contact
  details are excluded from analytics payloads.
- Ads are rendered only through the safe boundary and disappear while the
  document exercise marker is active.
- Ranked boards consume server-accepted evidence; client claims are not the
  source of ranked WPM or accuracy.
