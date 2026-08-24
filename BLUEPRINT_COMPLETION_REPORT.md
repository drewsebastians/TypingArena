# TypingArena — Blueprint Completion Report

**Date:** 2026-08-24 · **Scope:** full blueprint pass over the prototype repository
**Method:** every claim below is backed by code paths and test names; statuses use
COMPLETE / PARTIAL / DEFERRED / BLOCKED per §48 of the blueprint.

---

## A. Executive status

| Layer | Status |
|---|---|
| P0 — scoring/timer/audio correctness | **COMPLETE** |
| P0 — transcription as a real engine | **COMPLETE** |
| P1 — shared infrastructure (leaderboard/daily/friends/accounts) | **PARTIAL** — full implementation shipped; activation requires Supabase credentials this environment does not have (honest degradation verified instead) |
| P1 — multi-skill differentiation | **COMPLETE** |
| P1 — centralized analytics | **COMPLETE** (adapter + consent gate; provider needs a key to forward) |
| P1 — production SEO/privacy/ads/CI | **COMPLETE** |
| MVP+ polish (5-min endurance, noise tiers, heatmap) | **COMPLETE** |
| P3 roadmap (seasons, multiplayer, classrooms, custom tests) | **DEFERRED** deliberately |

The 30-item Definition of Done (§26): items 1–11, 19–23, 25–30 satisfied;
items 12–18 implemented end-to-end but only verifiable in production once the
operator applies `supabase/migrations/0001_init.sql` and sets two public env
vars — the app's behaviour without them is tested (honest notices, no fake data).

---

## B. Requirement matrix

### Core functionality (§5)

| Requirement | Status | Evidence |
|---|---|---|
| 15/30/60s tests run intended duration | COMPLETE | `src/lib/stream.ts` endless stream; `tests/engine.typing.test.tsx` "finishes exactly at the configured duration", "completing the entire first passage does NOT end the test"; E2E full-clock sprints |
| 5-minute mode valid endurance | COMPLETE | Same engine at duration=300; E2E asserts HUD shows full 300s |
| WPM formula tested | COMPLETE | `tests/scoring.test.ts` (gross/net/CPM/effective) |
| Accuracy semantics documented & correct | COMPLETE | ADR-003; typed-scope accuracy ignores untouched text (`typedScopeAccuracy`; unit + E2E "accuracy does not penalize untouched future text") |
| Per-key / bigram robust | COMPLETE | Keystroke-time accumulation + Wagner–Fischer alignment (`alignment.ts`, `scoring.ts`; `tests/alignment.test.ts` cascade tests) |
| Correction behavior meaningful | COMPLETE | `CorrectionTracker` (corrected/uncorrected/raw/neutral/immediate/latency); `tests/corrections.test.ts` |
| EN corpus sufficient for repeats | COMPLETE | 16 sprint + 8 copy-pro + 6 numbers + 6 punctuation items, derived metadata (`tests/content.test.ts`) |
| ID corpus sufficient | COMPLETE | 10 sprint + 5 copy-pro + 4 numbers + 3 punct, original Indonesian (`tests/content.test.ts` spot-checks) |
| Dictation works EN + ID with static audio | COMPLETE | 8 EN + 6 ID clips on disk w/ sha256 manifest; E2E verifies `<audio src=/audio/dictation/dict-{en,id}-*>` resolves HTTP 200 audio/mpeg |
| Reference transcripts verified | COMPLETE | Single source `audio-clips.json`; unit test asserts code==manifest==disk files |
| Strict + normalized scoring tested | COMPLETE | `tests/scoring.test.ts`, engine.audio tests incl. normalization version stamping |
| Anonymous first use, no signup | COMPLETE | All engines run without any account; history local-only |

### Differentiation (§5)

| Requirement | Status | Evidence |
|---|---|---|
| Typing result recommends dictation | COMPLETE | ResultCard CTA + home nudge panel |
| Multi-skill profile after typing+dictation | COMPLETE | SkillProfile MULTI-SKILL state; matrix merges three histories |
| Listening metrics affect profile | COMPLETE | `buildSkillMatrix` derives listeningWeak from scores/replay reliance; `tests/skillMatrix.test.ts` "listening weakness is DERIVED" suite |
| Dictation central, not buried | COMPLETE | Header nav, result CTAs, recommendation rotation |

### Retention (§5)

| Requirement | Status | Evidence |
|---|---|---|
| Anonymous history / signed-in history / cross-device | PARTIAL→COMPLETE-with-backend | Local anonymous COMPLETE; account sync + migration implemented (`AccountPanel`, `migrateLocalHistory`) but needs Supabase credentials to verify live |
| Daily challenge real & shared | PARTIAL→COMPLETE-with-backend | Deterministic challenge (`daily.ts`, Jakarta day); shared board via `public_daily_board` view; E2E verifies honest states without backend |
| Centralized async leaderboard | PARTIAL→COMPLETE-with-backend | Ranked-only definer view + filters page; no demo rows anywhere |
| Deterministic recommendations across modes | COMPLETE | `nextExerciseRecommendation` rule chain incl. audio adoption & weakest-language drill (tested) |
| Streak logic without timezone bugs | COMPLETE | Asia/Jakarta product day (ADR-002); `tests/history.test.ts` same-day/multi-mode/gap cases |

### Integrity (§5)

| Requirement | Status | Evidence |
|---|---|---|
| Paste detection (+blocking) | COMPLETE | Engines preventDefault + flag; unit + E2E |
| Focus-loss dedup | COMPLETE | 1s de-dupe between blur/visibilitychange |
| Burst detection tested | COMPLETE | `detectBurst` window tests incl. mid-stream burst |
| Ranked eligibility enforced, not displayed | PARTIAL→COMPLETE-with-backend | Client classification + DB views expose ONLY ranked rows; CHECKs bound values; live enforcement needs backend active |

### Monetization/UX, SEO, Privacy, Analytics (§5)

| Requirement | Status | Evidence |
|---|---|---|
| No shifting ads in tasks; reserved slots | COMPLETE | AdSlot min-heights; forbidden-placement tripwire; slots only outside engines |
| Production ad integration configurable | COMPLETE | AdSense client id env; absent → labeled reserved space |
| Canonical prod URL, sitemap, robots | COMPLETE | `config.ts` SITE_URL; sitemap/robots generated from it; CI blocks placeholder-domain leakage; GITHUB_PAGES build path preserved |
| Private progress non-indexable | COMPLETE | robots Disallow + noindex metadata layout; E2E asserts both |
| Deliberate EN/ID localization | COMPLETE/PARTIAL | Tool pages localized (tes-mengetik, dikte, ID corpora/audio); full UI i18n framework DEFERRED (documented §34 fallback) |
| Anonymous/optional accounts/minimal data/public-vs-private identity/deletion | COMPLETE (code) | AccountPanel + RPC `delete_my_data` + local wipe; auth.users row deletion documented limitation |
| Audio license/source records | COMPLETE | `docs/LICENSES.md` + per-clip source/license fields + sha256 manifest |
| No raw keystroke retention | COMPLETE | Only summarized per-key stats persisted |
| Centralized events incl. D1/D7/D30, conversions, cheat rate, shares | COMPLETE (code) | Event dictionary §18 covered; PostHog consent-gated; forwarding requires key |

### Blueprint feature list (§4) & later sections

| Item | Status | Notes |
|---|---|---|
| Sprint/Copy Pro/Dictation/Transcription/Noise/Numbers/Daily | COMPLETE | See above |
| Career Mode first version | DEFERRED | Core-first ordering (§27); tracks map onto existing pools |
| Reproducibility/versioning (§3.16) | COMPLETE | Every result stamps exercise/scoring/normalization/challenge versions (tested) |
| Automated testing strategy (§3.17) | COMPLETE | Vitest: 13 files/114 tests; Playwright: 16 specs ×2 projects = 32 runs, all passing locally; CI runs lint+typecheck+unit+build+bundle-guard+e2e |
| Timezone decision (§32) | COMPLETE | ADR-002 |
| Migration from localStorage v1 data (§41) | COMPLETE/PARTIAL | v2 loaders tolerate old shapes; migration-to-account is one-shot marked; legacy streak key isolated |
| Real multi-user scenario (§42) | BLOCKED (environment) | Requires live Supabase; schema/views/policies + client flows implemented and unit/E2E-tested around; must be executed by operator after setup (steps documented in README) |
| Real audio scenario (§43) | COMPLETE except "no speechSynthesis in prod bundle" proven by grep + CI guard; replay/partial/pause metrics unit+component tested |
| Timed typing scenario (§44) | COMPLETE | Unit + E2E cover all nine assertions incl. insertions/deletions stability |
| Roadmap §7 items | DEFERRED | seasons/multiplayer/classrooms/custom tests — explicitly gated behind retention |

---

## C. Test evidence (this machine, final run)

| Check | Result |
|---|---|
| `npm run lint` (eslint 9, next/core-web-vitals) | ✅ 0 errors, 0 warnings |
| `npm run typecheck` (tsc --noEmit, strict) | ✅ clean |
| `npm test` (vitest) | ✅ **114 passed / 114** (13 files) |
| `npm run build` (static export) | ✅ 21 routes prerendered |
| `playwright test --project=chromium-desktop` | ✅ **16 passed** |
| `playwright test --project=mobile-chromium` | ✅ **16 passed** |
| Production bundle grep `speechSynthesis` (out/_next/**/*.js) | ✅ zero hits |
| Output grep placeholder domain | ✅ zero hits |
| Sitemap/robots emitted from config URL | ✅ verified in out/ |
| GH Pages build (`GITHUB_PAGES=true`) | re-verified in final step (below) |

CI (`.github/workflows/ci.yml`) reruns lint, typecheck, unit, build, the two
production-output guards, then the desktop E2E project on every push/PR.

## D. No-runtime-AI verification

Production runtime external touchpoints, exhaustively:

1. **Static host** — serves prebuilt HTML/JS/audio. No inference.
2. **Supabase (optional)** — Postgres reads/writes + magic-link email. Row-level
   data operations only; no LLM/ASR/TTS functions exist in the schema.
3. **PostHog/GA4 (optional, consent-gated)** — event ingestion only.
4. **AdSense (optional)** — ad markup injection when configured.
5. **Audio** — static MP3s generated OFFLINE during development
   (`scripts/generate-audio.mjs` via edge-tts), checksummed, never regenerated
   or streamed from any API.

Verified: `speechSynthesis` exists only in `src/lib/ttsDev.ts`, which is
dynamically imported behind a `process.env.NODE_ENV === "production"` early
return; the production export contains zero occurrences (grep + CI guard).
Recommendations, daily challenges, exercise streams, and skill analysis are
pure deterministic functions over reviewed content. **No LLM generation, ASR,
runtime TTS, or generative personalization exists in the runtime.**

## E. Remaining risks (honest)

1. **Shared features unproven against a live database.** Schema, policies,
   adapter and UI are written and tested around, but the §42 two-browser
   scenario needs an operator-supplied Supabase project (~10 minutes following
   README steps). Until then leaderboards show honest empty/setup states.
2. **Client-side anti-cheat is bypassable**, as acknowledged in-product; DB
   constraints hide non-ranked rows and bound absurd values but cannot prove
   human input. Formal proctoring is out of scope by design.
3. **Synthetic narration licensing** — dev-time neural voices are fine for
   bootstrap/demo; commercial scale should move to human recordings or an
   explicit redistribution license (`docs/LICENSES.md`).
4. **Full UI i18n framework** deferred; Indonesian support is real but
   route/page-level rather than framework-level (permitted §34 fallback).
5. **auth.users row deletion** requires Dashboard/support action after the
   app-level `delete_my_data()` wipes product data.
6. **Mobile typing** uses desktop keyboard-first capture; mobile gets usable
   landing/history/sharing/listening (blueprint §16 stance) but not optimized
   touchscreen typing.
7. **PostHog forwarding** is wired through their CDN loader shim; if the key is
   configured, verify event delivery once in a staging environment before
   trusting funnel dashboards.
