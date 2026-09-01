# TypingArena Week 1 Stabilization and Validation Report

Status: PRODUCTION STABLE — GOOGLE OPERATOR ACCESS BLOCKER ONLY
Snapshot: 2026-09-01 (post-launch audit + measurement fixes + hosted verification)
Application baseline: `573482bd65bc410988b517a9726a80d777ed13ae`

This report records the post-launch evidence available now. It does not claim
traffic, Search Console, revenue, or strategic validation that the environment
cannot measure.

## Executive result

Production is stable. A fresh hosted browser smoke found one real P1 incident:
GitHub Pages audio elements resolved to the root-domain path and returned 404.
PR #12 fixed it, and the deployed browser now resolves audio under the project
site path with valid media responses. The contained fixes shipped and verified
across this stabilization sequence are:

1. lifecycle instrumentation now covers route view, task configuration, result
   view, and Career completion;
2. repository-owned GitHub Actions were moved off the deprecated Node 20 action
   runtimes;
3. optional local analytics storage is now explicitly consent-gated and cleared
   when consent is withdrawn;
4. GA4 event forwarding now includes the privacy-safe pathname without query or
   fragment data;
5. manual audio asset URLs derive their GitHub Pages base path from the public
   canonical site URL.

The strategic thesis remains unchanged: **WPM acquires; audio differentiates**.
There is not yet enough consented provider data to evaluate it.

## Production baseline

| Item | Evidence |
| --- | --- |
| Main | `573482bd65bc410988b517a9726a80d777ed13ae` |
| Production | `https://drewsebastians.github.io/TypingArena/` |
| Deployed SHA | `573482bd65bc410988b517a9726a80d777ed13ae`, inferred from successful Pages run `33467544639` for exact main |
| CI | Run `33467544640`, success |
| DB integration | Run `33467544627`, success |
| Deploy | Run `33467544639`, success |
| Pages | GitHub Pages source `main`, workflow build, `github-pages` environment |
| Hosted static smoke | 37 passed, 0 failed |
| Hosted browser smoke | 8 passed, 0 failed across desktop/mobile Chromium, including consent-off/on and project-site audio |

## Stabilization findings

| ID | Severity | Domain | Evidence | Resolution | Production status |
| --- | --- | --- | --- | --- | --- |
| P2-OBS-01 | P2 | Measurement | Source audit found no call sites for `route_viewed`, `task_configured`, or `result_viewed`; Career completion was also not emitted. | PR #6 added the lifecycle events, privacy-safe route tracker, Career completion event, tests, and the first-week specification. | Shipped and hosted-smoke verified. |
| P2-OPS-01 | P2 | GitHub Actions | Deploy run `33408669165` emitted the repository-owned Node 20 deprecation annotation for checkout/setup-node/deploy-pages/upload-artifact. | PR #7 updated checkout/setup-node, Supabase CLI setup, Pages artifact, and Pages deploy actions to current Node 24-compatible majors. | Shipped; run `33412373560` passed with no Node 20 annotation. |
| P2-PRIV-01 | P2 | Privacy / observability | Source audit found `track()` could write the capped optional `ta:analytics_queue` before an explicit consent choice, even though provider forwarding was gated. | PR #9 gates queue writes on `granted`, adds Privacy controls, and clears the queue on denial/withdrawal. Hosted consent-off/on probe verified no queue before/after denial and local queue creation only after explicit consent. | Shipped; current deployment verified 6/6. |
| P2-MEAS-01 | P2 | Measurement | Source audit found the GA4 forwarding branch sent `safeProps` without the adapter’s current privacy-safe pathname, so GA4 route attribution would be incomplete if enabled. | PR #11 forwards `{ ...safeProps, path }` to GA4 and adds a regression test proving query strings and fragments are excluded. | Shipped; exact-head and merged-main gates green. |
| P1-AUDIO-01 | P1 | Audio / GitHub Pages | Fresh hosted browser smoke reproduced `https://drewsebastians.github.io/audio/...` requests with HTTP 404, while the project-site asset path was healthy. | PR #12 derives `BASE_PATH` from the public canonical URL, keeps root deployments unchanged, and adds a configuration regression test. The deployed browser now requests `/TypingArena/audio/...` and receives a valid HTTP 206 range response; direct asset GETs return 200 for all 20 manifest WAVs. | Fixed and verified in deployment `33467544639`; no unresolved core audio incident. |
| HYP-REJECT-01 | — | Audio | The hypothesized play-count synchronization defect was not reproduced. Real static playback, pause, replay controls, `readyState`, and advancing `currentTime` passed in hosted probes. | No scoring or playback refactor. Keep monitoring with the new lifecycle events. | Stable; defer. |
| HYP-REJECT-02 | — | Shared data | A first read-only SQL probe used an incorrect local assumption about the `submit_attempt` signature; the actual `jsonb` RPC signature was then verified successfully. | No production change. Treat as an inspection-query error, not an incident. | Stable. |

No unresolved production outage, RLS bypass, capability leak, public UUID leak,
runtime AI/TTS dependency, active-task ad obstruction, or workflow failure was
evidenced after the audio incident was remediated.

## Production health

- Static smoke: 37/37 passed, including all public route GETs, canonical,
  robots, sitemap, critical JavaScript, and static audio.
- Goal First: six goals rendered; typing, dictation, and transcription workspaces
  were selectable on the hosted build. The listening goal now resolves its
  project-site audio path correctly.
- Typing: 15-second task started, active-task boundary applied, result/next
  action rendered, and route-level ad slot disappeared while active.
- Dictation: English and Indonesian static clips loaded; hosted playback and
  pause passed. The browser’s deployed request to
  `/TypingArena/audio/dictation/dict-en-001.wav` returned a valid 206 range
  response, and all 20 manifest WAV URLs returned HTTP 200 by direct GET.
- Transcription: hosted route, playback controls, textarea, and Indonesian route
  behavior passed; GitHub-Pages-mode output emits the project-site transcription
  asset path.
- Audio assets: readiness verified 20/20 Piper WAV assets present and all 20
  deployed manifest URLs returned HTTP 200.
- Progress: local-first route rendered honestly and remains noindex/excluded
  from sitemap.
- Daily/leaderboard: live routes rendered honest shared-state behavior without
  fabricated players or ranked noise.
- Teams/custom/assessments: full controlled shared-flow smoke on the same
  application release passed creation, scoped recovery, practice-only behavior,
  candidate completion, and owner-only result visibility. Disposable resources
  were cleaned by scoped `TA-SMOKE-*` cleanup; final smoke-resource counts were
  zero.

## Supabase, security, and privacy

- Production project: `TypingArena Production`, ref `rowyghxvphpjooacupqb`,
  status `ACTIVE_HEALTHY`.
- Migration ledger: `0001` through `0016` are applied and match the repository.
- RLS: enabled on all 18 protected application tables.
- Direct write boundary: anonymous/authenticated direct `attempts` inserts are
  denied; ranked submission remains through the server-authoritative RPC.
- Capability privacy: anonymous/authenticated direct reads of
  `resource_capabilities` are denied; capability hashes are not client-readable.
- Public views expose display fields only: the daily and leaderboard views do
  not expose auth UUIDs.
- Aggregate counts at audit time: profiles 11; attempts 0; teams 0; custom
  tests 0; assessments 0; friend challenges 0; rooms 0; capabilities 0.
- Anonymous Auth/profile creation, resource-scoped recovery, and shared deletion
  were verified in the controlled hosted smoke. The intended anonymous auth row
  retention after shared-data deletion remains in place.
- Optional analytics storage is consent-gated: consent-off sessions leave no
  `ta:analytics_queue`, and withdrawing consent clears it. No provider request
  was observed because provider configuration remains absent.
- `purge_expired` exists as a security-definer function. No database cron
  relation was found; scheduler ownership remains external/unverified and is
  not treated as a production incident.
- No user-entered text, assessment content, tokens, or secrets were included in
  logs or this report.

## Observability and analytics

- Provider state: disabled/unconfigured. Repository secret inventory contains
  Supabase configuration only; no PostHog, GA4, or AdSense keys are configured.
- Consent off: ordinary practice works, no optional analytics queue is written,
  denial clears any prior queue, and the hosted browser probe observed zero
  PostHog, GA/GTM, AdSense, or DoubleClick requests.
- Consent on: the optional local queue is written only after explicit consent;
  provider forwarding remains gated and no provider was activated because the
  external configuration/legal prerequisites are absent.
- Lifecycle coverage now includes `route_viewed`, `goal_first_view`,
  `goal_selected`, `task_configured`, `task_started`, `task_completed`,
  `result_viewed`, `result_next_action_clicked`, mode-specific audio lifecycle,
  and `career_complete`.
- GA4 forwarding now receives the same sanitized pathname contract as the local
  queue and PostHog branch; query strings and fragments are excluded.
- The adapter retains only coarse scalar metadata and rejects typed content,
  transcript text, auth UUIDs, resource IDs, capability/invite tokens, and
  secret-bearing URLs.
- First-week definitions and review rules are in
  `docs/analytics/FIRST_WEEK_STRATEGIC_VALIDATION.md`.

Google operator check: the connected Google context exposes Search Console
access only for an unrelated domain property; no TypingArena property is
available, and GA4 is not connected with no GA4 property listed. This is an
access/configuration blocker, not a repository defect.

External blocker: an owner-approved analytics provider, property, retention,
and legal/consent configuration must exist before real strategic measurement can
begin. The single operator action is to connect the owner’s approved Google
Analytics/Search Console access for TypingArena, then verify the URL-prefix
property and submit the sitemap.

## Search Console and SEO acquisition

- Canonical origin: `https://drewsebastians.github.io/TypingArena/`.
- `robots.txt`: reachable, references the sitemap, and disallows the private
  progress route.
- Sitemap: reachable, contains 24 indexable route entries, uses the canonical
  origin/base, excludes progress, and has no placeholder domains.
- Search Console access was only partial in this environment: the connected
  context listed an unrelated domain property, not TypingArena. Therefore the
  TypingArena property, sitemap-processing, indexing, coverage, query,
  mobile-usability, and field CWV data are **NOT RUN / NOT VERIFIED**.
- The route registry provides live tool landing pages with distinct route copy,
  usable engines, result/next-action surfaces, related-tool links, and correct
  language/canonical behavior. Indonesian intent routes use localized copy and
  task behavior rather than being empty URL aliases.
- The acquisition loop is present and smoke-verified: typing result → Dictation,
  Dictation → Transcription, and Transcription → Progress/library paths. No
  programmatic thin-page expansion was made.

Owner action: connect the approved Google operator context for TypingArena, add
or verify the production URL-prefix property, and submit
`https://drewsebastians.github.io/TypingArena/sitemap.xml`.

## Ads and monetization readiness

- AdSense: not approved and not activated.
- No fake publisher ID or fake `ads.txt` was added; `ads.txt` is absent honestly.
- Discovery/post-result ad boundaries are reserved in the existing UI, and
  hosted browser checks confirmed ads disappear during active typing/dictation
  tasks.
- Privacy copy and navigation surfaces are present; no forced signup or ad
  obstruction was observed.
- Remaining external steps are actual publisher approval/configuration, legal
  review, and a real publisher ID. Do not activate from this report.

## Accessibility and performance

- Automated proof: lint, typecheck, unit tests, static build, readiness, and
  Playwright passed; the suite result was 70 passed and 4 expected conditional
  skips, with 0 failures. Desktop/mobile coverage included keyboard navigation,
  reduced motion, 320px overflow, language switching, focus restoration, and
  active-task ad boundaries.
- Production browser proof: the latest hosted probe passed 8/8 across
  desktop/mobile, including consent-off/on, Goal First, project-site audio,
  active audio ad boundaries, privacy status, and provider-request absence. The
  earlier broad hosted regression was also 8/8 on the unchanged application
  surface.
- Manual real-device status: Safari, VoiceOver/NVDA, and real Android/iOS are
  NOT RUN.
- Core Web Vitals: no field data available; do not claim CWV from these checks.
  Technical readiness evidence is static output, 20/20 audio asset presence,
  lazy route behavior, reserved task/ad boundaries, and zero optional provider
  requests while disabled.

## Fixes shipped

| Branch / PR | Commit | Merge SHA | Deploy evidence | Reason |
| --- | --- | --- | --- | --- |
| `codex/postlaunch-observability` / [PR #6](https://github.com/drewsebastians/TypingArena/pull/6) | `1b5c37ba` | `6d019d90` | `33408669165` success; hosted smoke 8/8 | Close lifecycle measurement gaps and add first-week spec. |
| `codex/postlaunch-actions-runtime` / [PR #7](https://github.com/drewsebastians/TypingArena/pull/7) | `4d60a1a5` | `1abc7803` | `33412373560` success; no Node 20 annotation | Remove the verified repository-owned Action runtime deprecation. |
| `codex/postlaunch-consent-boundary` / [PR #9](https://github.com/drewsebastians/TypingArena/pull/9) | `1b76c77a` | `cb4311d6` | `33458659294` success; hosted consent/core probe 6/6 | Keep optional analytics storage consent-gated and clear it on withdrawal. |
| `codex/measurement-search-week1` / [PR #11](https://github.com/drewsebastians/TypingArena/pull/11) | `d2ef3f58` | `50f5d69c` | `33465089972` success; hosted consent/path probe passed after deploy | Include the sanitized pathname in GA4 event forwarding. |
| `codex/postlaunch-audio-path-fix` / [PR #12](https://github.com/drewsebastians/TypingArena/pull/12) | `fa483a2` | `573482bd` | `33467544639` success; hosted probe 8/8; all 20 WAV GETs 200 | Fix GitHub Pages project-site audio URLs confirmed 404 by browser smoke. |

The report itself is documentation-only and does not alter product behavior.

## Validation table

| Gate | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS; 915 packages installed |
| `npm run lint` | PASS; 0 errors, 0 warnings |
| `npm run typecheck` | PASS |
| `npm test` | PASS; 20 files, 170 tests |
| `npm run build` | PASS; 30 static routes generated |
| `npm run test:e2e` | PASS; 70 passed, 4 skipped, 0 failed |
| DB integration | PASS on PR #12 exact head and merged main run `33467544627` |
| Production readiness | PASS; 20/20 audio assets, sitemap/robots/static output valid |
| Runtime-AI/provider scan | PASS; no runtime AI/TTS endpoints or provider bundles |
| Hosted static smoke | PASS; 37 passed, 0 failed on main deploy `573482bd` |
| Hosted browser smoke | PASS; 8 passed, 0 failed across desktop/mobile on main deploy `573482bd`; consent-off/on, Goal First, project-site audio, active audio boundary, privacy status, and provider-request absence included |
| Shared smoke | PASS; one controlled full shared-flow run on application deploy `1abc7803`; scoped smoke residue counts 0. PR #9 changed consent/analytics/privacy paths only, with no shared-data code changes. |

## First-week strategic validation

### Measured facts

- Technical production health is green at the snapshot above (`573482bd`).
- The application can now emit the needed privacy-safe lifecycle events when an
  approved provider is configured and consent is granted.
- The provider is currently absent/disabled, so no provider traffic or funnel
  conversion rate is claimed.
- Search Console is not connected to the TypingArena property in the available
  operator context, so indexing and query data are not claimed.
- Supabase ranked-attempt count is 0 at snapshot time; this is not a product
  adoption metric.

### Insufficient-data areas

No responsible conclusion can yet be made about route acquisition, completion
by mode, second exercise, typing → dictation, typing → transcription, dictation
→ transcription, D1/D7 return, or the WPM/audio thesis. There is no sufficient
consented provider dataset and no seven-day cohort.

### Hypotheses to observe

- Typing landing routes generate the largest qualified starts.
- A clear post-result listening action produces measurable typing → dictation
  progression.
- Transcription offers additional repeat audio engagement after dictation.
- Goal First reduces friction to a real first task across English and Indonesian.

### Earliest responsible decision point

Review technical health before 24 meaningful hours, directional observations at
1–3 days with denominators and sample-size caveats, and a structured strategic
readout only after seven complete days with sufficient consented traffic.
Do not change positioning, scoring, or product strategy from the current sample.

## Remaining actions

### URGENT STABILIZATION

None evidenced.

### OBSERVABILITY / ACQUISITION

- Configure one approved consented analytics provider, or explicitly keep the
  provider off; then verify consent-off and consent-on behavior with a disposable
  session.
- Verify the Search Console property and submit the canonical sitemap.
- Record the first baseline with date range, route scope, consent scope, and
  denominators.

### EXTERNAL PROVIDER

- Analytics provider/property, retention, legal/consent approval.
- Search Console property access and indexing submission.
- AdSense approval and real publisher configuration; not an activation task in
  this stabilization run.

### POST-LAUNCH VALIDATION

- Review the first-week measurement specification at 24 hours, day 3, and day
  7 when the corresponding data exists.
- Complete Safari, screen-reader, and real-device checks.
- Obtain field CWV data before making performance claims.

### DEFERRED POLISH

- Non-reproducible audio-counter refinement.
- Broad dependency churn, visual redesign, strategy changes, and new product
  modes.

## Final recommendation

KEEP STABLE — COLLECT DATA

