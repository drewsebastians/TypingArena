# PR #4 Final Independent Pre-Merge Review

## Review scope and instruction boundary

This is an independent implementation, security, product, SEO, analytics,
advertising, accessibility, performance, and evidence review of PR #4. The
attached closure prompt was treated as an execution specification. The user
request authorized reading and executing that specification in the repository;
it did not authorize merging PR #4, enabling auto-merge, changing production
Supabase/Auth/hosting/provider state, or deploying production.

The immutable starting baseline is
[`PR4_FINAL_INDEPENDENT_REVIEW_BASELINE.md`](./PR4_FINAL_INDEPENDENT_REVIEW_BASELINE.md).
The exact ending head and final GitHub workflow IDs are updated here after the
last push.

## Git anchor

| Item | Value |
| --- | --- |
| Base | `origin/main` @ `b99779bc208c5abd2aa2e67e618927a2db949c42` |
| Starting head | `d145113007eb7653ac172bd051f346c10f7e818b` |
| Ending head | `RECORDED_AFTER_FINAL_PUSH` |
| Branch | `codex/goal-first-wave1` |
| PR | [#4](https://github.com/drewsebastians/TypingArena/pull/4) |
| Merge/deploy | NO / NO |

## Changed-file inventory

This pass adds the public-board privacy migration, analytics privacy boundary,
base-path/SEO/i18n/copy fixes, optional audio-panel code splitting, explicit
button types, reduced-motion CSS, expanded DB assertions, the independent
Playwright suite, locked CI installs, four focused review reports, and the
owner activation pack. The final `git diff --stat origin/main...HEAD` and
`git diff --name-status origin/main...HEAD` are the authoritative inventory for
the ending head.

## Findings and resolutions

| ID | Severity | Domain | Finding | Resolution | Evidence |
| --- | --- | --- | --- | --- | --- |
| IR-01 | P1 | Privacy/security | Public board views and a UI fallback exposed or could expose auth-ID prefixes. | Added migration `0016_public_board_privacy.sql`, removed `user_id` from public selects/types, and use a neutral nickname fallback. | Migration + DB assertion + board code |
| IR-02 | P1 | Analytics privacy | Typing error analytics forwarded expected and typed characters; callers could pass IDs/secrets. | Send key classes only and enforce a scalar denylist boundary for text, answers, identity/resource IDs, URLs, tokens, and nested payloads. | `src/lib/analytics.ts`, analytics unit test |
| IR-03 | P1 | SEO/base path | Footer/consent raw absolute-root links could bypass the GitHub Pages base path. | Converted those links to `next/link`; query-bearing tool state receives `noindex,nofollow`. | Layout, consent, `ToolPageShell`, E2E |
| IR-04 | P2 | Privacy copy | Shared deletion confirmation did not enumerate all owned product data or clarify auth/local retention. | Confirmation now names attempts/results, memberships, Teams, Custom Tests, Assessments, API keys, profile, capabilities, challenge anonymization, local history, and retained anonymous auth record. | `PrivacyPanel`, migration contract |
| IR-05 | P2 | Product copy | Progress wording could imply all practice auto-backs up. | It now says only explicitly chosen shared results wait to send and ordinary practice remains on-device. | Progress UI |
| IR-06 | P2 | Performance | Home imported audio-heavy panels into the initial route bundle. | Dictation/transcription home panels are dynamically imported; typing remains the initial workspace. | `src/app/page.tsx`, build |
| IR-07 | P2 | i18n/structure | Related links were English-only, Daily Indonesian title was mixed, and transcription library nested a `<main>`. | Locale-aware labels/title and valid root-main structure are now used. | Source audit + browser suite |
| IR-08 | P2 | Proof | B15/ad coverage was previously only partially independently demonstrated. | Added required viewport matrix, drawer/focus/scroll assertions, reduced-motion/query/locale checks, and active-task ad tests. | `e2e/independent-review.spec.ts` |
| IR-09 | P3 | External validation | Human screen-reader/Safari/real-device/CWV/hosted provider evidence is unavailable here. | Kept explicitly external and added owner runbooks; no stronger claim is made. | Owner activation pack |

Rejected hypotheses: no runtime AI/TTS signature was found in the production
bundle; no visible account wall was reintroduced; no fabricated board rows were
found in unconfigured states; and no code-level P0/P1 blocker remained after
the remediation set.

## Security verdict

Anonymous identity is lazy and shared-action-only; ordinary local practice does
not create a Supabase session. Attempts are submitted through the
server-authoritative RPC, which recomputes score/integrity and binds ranked
visibility to accepted evidence. Daily binding and idempotency remain server
enforced. Management capabilities use high-entropy one-time-return tokens,
SHA-256 digests, resource type/id scope, owner checks, expiry, rate limits,
rotation, revocation, recovery, malformed-token rejection, and direct-table
isolation. Teams, Custom Tests, and Assessments use owner/member/RPC boundaries;
multiplayer uses host authority and evidence-bound results; friend results are
validated and expiring. Shared deletion enumerates and removes product-owned
data while retaining the anonymous Auth row by design; local deletion is
separate. Public boards no longer expose auth UUID columns. Final DB proof is
the fresh GitHub integration run recorded below.

## Product and UX verdict

Goal First exposes six goals and a real initial typing workspace, with audio
and transcription selected in place. Typing uses full-clock deterministic
engines; dictation/transcription use real static WAVs, hidden answers, and
playback metrics; Career has five tracks; Library filters and starts clips;
Daily/leaderboard/seasons show real or honest degraded states; friends,
multiplayer, teams, custom tests, and assessments use explicit shared/backend
states; Progress and Privacy distinguish local history from chosen shared
data. Results expose next actions and active tasks suppress ads.

## SEO, analytics, and ads verdict

Repository SEO is proven for route metadata, canonical paths, sitemap/robots,
private Progress, query-state noindex, locale-aware discovery, and static/base
path output. Analytics is consent-gated and sanitized at the adapter boundary;
no emails, auth UUIDs, typed content, answers, tokens, invite codes, or nested
payloads are forwarded. Ads are inert without an approved client and are
reserved outside active tasks; the independent suite covers typing, dictation,
transcription, noise, and Daily, while source review covers shared runners.
Provider configuration, legal review, approval, and hosted activation remain
external.

## Accessibility, responsive, and performance verdict

Automated Chromium proof is complete for the tested route/viewport scope:
required viewports, no overflow, keyboard controls, drawer focus/scroll
behavior, EN/ID language, reduced motion, query noindex, and active-task ad
boundaries. The build is static, audio-heavy optional home panels are split,
and production bundle/provider scans are clean. Human screen-reader, Safari,
real-device, contrast, and real-user Core Web Vitals evidence remains external.

## Evidence reconciliation

The old closure reports and DB evidence that referenced the pre-remediation
run IDs or migration `0015` are historical snapshots. They are being updated
to identify their historical scope and link this final report. Migration `0016`
is the final public-board privacy addition. The current final-head run IDs and
SHA below supersede older report references after the final push.

## External blockers and recommendation

No production/staging origin or credentials were available. The owner must
apply migrations `0001`–`0016`, enable Anonymous Sign-Ins, configure the exact
canonical origin and public Supabase keys, run hosted smoke, then decide on
analytics/AdSense/human-device validation. These are pre-deploy actions, not
fabricated repository failures. Recommendation: **READY FOR PR APPROVAL,
EXTERNAL PRE-DEPLOY ACTIONS REMAIN** once the final-head checks below are green.

## Validation record

| Gate | Exact result | Evidence anchor |
| --- | --- | --- |
| Clean install | PASS — `npm ci --no-audit --no-fund`, 912 packages | final local clean run |
| Lint | PASS | final local clean run |
| Typecheck | PASS | final local clean run |
| Unit/component tests | PASS — 19 files, 167 tests | final local clean run |
| Static build | PASS — 30 routes | final local clean run |
| Playwright desktop | PASS — 35 passed; two mobile-only tests skipped in this project | final local clean run / CI |
| Playwright mobile | PASS — 35 passed; the desktop-only viewport/control matrix skipped in this project | final local clean run / CI |
| DB integration | PENDING FINAL HEAD — local Supabase CLI/Docker unavailable; GitHub run recorded after push | final CI |
| Production readiness | PASS — demo/static; production fails closed without env | final local clean run |
| No-runtime-AI/provider scan | PASS — clean production bundle | final local clean run |
| Static smoke | PASS — routes, robots, sitemap, WAV | final local clean run |
| Hosted smoke | NOT RUN — no safe real origin supplied | owner runbook |
| Automated accessibility | PASS — independent route/viewport/drawer/reduced-motion/ad suite | final local clean run / CI |
