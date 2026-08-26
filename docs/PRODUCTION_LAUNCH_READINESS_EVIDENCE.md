# Production Launch Readiness Evidence — Pass VI

**Date:** 2026-08-26 · **Branch:** `typingarena-production-launch-readiness`
**Starting SHA:** `936ee1ec424e516bb3a35b7c950364cf2609e15a` (public main, freeze APPROVED)

Status vocabulary: PASS (actually executed) · FAIL · NOT RUN — EXTERNAL CONFIG REQUIRED · N/A.
Nothing "not run" is reported as passing.

## Repository changes in this pass

| File | Why |
|---|---|
| `docs/PRODUCTION_HANDOFF.md` | Rewritten: migration chain corrected to **0001→0014**, broken markdown table fixed, links to runbook/matrix/smoke script, tournament API marked explicitly optional |
| `.env.example` | Stale GA4 description replaced (real consent-gated loader exists); singular migration reference corrected to 0001→0014; local-script-only vars documented |
| `scripts/production-smoke.mjs` | NEW — 37-check deployed-site smoke (routes, robots/sitemap contract incl. canonical origin+base-path, placeholders, JS chunk, static audio); base-path aware; no embedded URL/secret |
| `docs/PRODUCTION_SMOKE_MATRIX.md` | NEW — all 23 public routes classified (functionality / indexing / ad eligibility) |
| `docs/PRODUCTION_LAUNCH_RUNBOOK.md` | NEW — authoritative A–I launch runbook incl. Supabase activation, GitHub config, domain dual-mode matrix, rollback policy |
| `docs/PRODUCTION_LAUNCH_READINESS_EVIDENCE.md` | This file |

No core code changed — freeze intact.

## External configuration status

| Item | Status | Action needed |
|---|---|---|
| Demo deployment (GitHub Pages) | CONFIGURED & LIVE | none — used as the verified production artifact for smoke tests |
| Production Supabase project | NOT CONFIGURED | Runbook §B (`db push` of 0001→0014) |
| `NEXT_PUBLIC_SITE_URL` (production) | NOT CONFIGURED (repo variable) | Runbook §C.3 |
| Production secrets (SUPABASE_URL/ANON_KEY) | NOT CONFIGURED | Runbook §C.1 |
| Custom domain | NOT CONFIGURED | Runbook §D dual-mode matrix |
| AdSense client | NOT CONFIGURED (slots inert by design) | Optional — non-blocking |
| PostHog / GA4 keys | NOT CONFIGURED (consent-gated, absence non-breaking) | Optional — non-blocking |
| Search Console | NOT CONFIGURED | Runbook §G after domain final |
| pg_cron cleanup schedule | NOT CONFIGURED | Runbook §B.6 before full launch |
| Tournament edge function | INTENTIONALLY DISABLED | Activate only if desired (handoff #12) |

## Production deployment

- Target: GitHub Pages demo — `https://drewsebastians.github.io/TypingArena`
- Status: SUCCESSFUL and serving the post-merge closure code (Deploy run
  `32932016719` on `936ee1e`, then re-verified via live smoke)
- Production-target deploy: NOT ATTEMPTED — external config required (honest
  fail-closed gate blocks it by design)

## Smoke results

### Automated live-site smoke — `production-smoke.mjs` vs LIVE demo URL
**PASS — 37 passed / 0 failed** (run 2026-08-26 against
`https://drewsebastians.github.io/TypingArena`, base `/TypingArena`):
all 23 routes HTTP 200 HTML · robots Disallow `/progress` + sitemap ref ·
sitemap entries canonical to origin+base, no placeholders, `/progress`
excluded · homepage title/canonical(`https://drewsebastians.github.io/TypingArena/`)/lang ·
critical JS chunk 200 · static dictation WAV 200 audio content-type.

Local-export cross-check: 35/37 with exactly two EXPECTED failures — the
un-configured local build bakes a localhost canonical (fail-closed gate doing
its job).

### Route/SEO/static (live)
| Test | Result |
|---|---|
| Public routes respond (23/23) | PASS |
| robots + sitemap contract | PASS |
| Canonical origin correctness | PASS (live) |
| Placeholder-domain scan (html+sitemap) | PASS |
| Static audio asset availability | PASS |
| Critical JS asset availability | PASS |
| No third-party scripts pre-consent | PASS (0 hits in exported index.html) |
| Ads placement audit (engines/multiplayer/teams/assessments ad-free) | PASS (code audit: 0 AdSlot refs) |

### Backend-dependent flows
| Test | Result |
|---|---|
| Leaderboard/Daily board load with backend | NOT RUN — EXTERNAL CONFIG REQUIRED |
| Magic-link auth + cross-device hydration | NOT RUN — EXTERNAL CONFIG REQUIRED |
| Teams create/join/assign/complete round-trip | NOT RUN — EXTERNAL CONFIG REQUIRED (server-side contract proven by CI DB-integration 103/0) |
| Assessment invite → exact modules → owner-only results | NOT RUN — EXTERNAL CONFIG REQUIRED (same proof) |
| Multiplayer host-authority/live-progress/results | NOT RUN — EXTERNAL CONFIG REQUIRED (same proof) |
| Honest degradation without backend (no fake data) | PASS (Playwright honest-degradation suite + live demo renders setup notices) |
| Offline local practice resilience | PASS (offline-first architecture; sync queue retains items with backoff — unit-tested 21 cases) |

### Database safety
| Test | Result |
|---|---|
| Migrations apply clean (0001→0014) | PASS (GitHub Actions local-Supabase runs 32932016680 & 32930885944) |
| Production-DB verification | NOT RUN — EXTERNAL CONFIG REQUIRED (never destructive against live; use Runbook §B) |
| RLS/browser-role isolation | PASS in CI-equivalent environment (103 assertions incl. forged-insert, escalation, privacy probes) |

### Ads / Analytics / Performance / Accessibility
| Test | Result |
|---|---|
| Ads absent from active exercise areas | PASS (code audit + engine files contain zero ad refs) |
| Reserved slots cause no layout shift | PASS (inert reserved containers when unconfigured) |
| Analytics absent-without-keys non-breaking | PASS |
| Consent-gating (no provider before consent) | PASS (tests/analytics.test.ts) |
| PII leakage scan of event payloads | PASS (unit-tested forbidden keys) |
| Bundle weight baseline | RECORDED — 42 chunks / ~1.4 MB total / largest 246 KB; >500 KB artifacts are lazy-loaded transcription WAVs only; 13.1 MB WAV library loads on demand |
| Keyboard/a11y spot checks | PASS (existing E2E keyboard-reachability test; no new surfaces introduced this pass) |
| Lighthouse score chase | N/A (explicitly out of scope) |

## Go-live decision

**CONDITIONAL GO** — repository, CI, migrations, security proofs, and the
real deployed demo are green; the remaining items are precisely enumerated
human/external activations (Runbook §B–§G). No launch-blocking defect is open.
