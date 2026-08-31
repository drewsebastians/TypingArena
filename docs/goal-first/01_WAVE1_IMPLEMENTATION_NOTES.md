# Goal-First Wave 1 — Implementation Notes

Status: mandatory Wave 1 scope implemented on `codex/goal-first-wave1`.
Optional B07–B09 route-family extension is intentionally deferred.

## Scope completed

- B00 baseline evidence captured before implementation.
- B01 canonical six-goal and route registries added with integrity tests.
- B02 anonymous Supabase Auth bootstrap and shared-action capability foundation added.
- B03 ordinary practice is local-first; visible account controls and migration UI retired.
- B04 route-registry navigation keeps progressive disclosure, adds a real mobile drawer,
  44px controls, focus containment, Escape handling, and focus restoration.
- B05 `/` is a Goal-First landing page. The first three goals mount the real typing,
  dictation, and transcription engines; the remaining goals link to real destinations.
- B06 task lifecycle signals, active-task ad suppression, result sections, and next-action
  cards are shared across the Wave 1 engines.

## Identity and persistence decisions

Ordinary typing, dictation, and transcription remain usable without a backend and save
their canonical history on the device. Ranked/shared submissions, Daily, Teams, Custom
creator management, Assessments, and multiplayer establish an anonymous Supabase Auth
identity lazily when the shared action requires it. Nickname is the only visible shared
identity; no email, password, magic-link, sign-out, or account-sync UI is exposed.

Teams, Custom tests, and Assessments use resource-scoped management capabilities. The
raw high-entropy token is returned only when issued and lives in the URL fragment during
recovery; the database stores only a SHA-256 digest. Capabilities are scoped by resource
type and id, rate-limited, rotatable, revocable, and never included in analytics,
server logs, public views, or the sitemap.

## Evidence

| Check | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 19 files, 166 tests |
| `npm run build` | PASS — static export, 30 routes |
| `npm run test:e2e` | PASS — 55 passed, 1 intentional desktop skip; desktop Chromium + Pixel 7 mobile |
| Production readiness | PASS — 20/20 static Piper WAV assets; sitemap/robots; no placeholder or legacy auth UI |
| Runtime-AI bundle guard | PASS — no `speechSynthesis` or runtime AI/TTS endpoint fingerprints in `out/_next/*.js` |
| Source audit | PASS — no direct client attempt writes; no token-bearing analytics/logging paths found |
| `node --check scripts/db-integration.mjs` | PASS |
| Real DB integration | NOT RUN — Supabase CLI and Docker are unavailable in this environment |

The DB integration script now includes anonymous-style identities, hash-only capability
storage, type/resource scoping, recovery, rotation, revocation, and client table isolation.
It should be run after `supabase db reset` in CI or on a machine with the local Supabase
stack available.

## Visual/accessibility evidence

Before/after screenshots are stored under:

- `artifacts/goal-first/wave1/before/`
- `artifacts/goal-first/wave1/after/`

The after set covers the Goal-First home at 1440×900, 1280×800, 768×1024, 390×844,
375×667, and 320×568; typing, dictation, and transcription at 1440×900 and 390×844;
Progress at 1440×900 and 390×844; Daily at 1440×900; Teams at 1440×900; and
Assessments at 1440×900. The mobile hamburger is 44×44, the drawer traps Tab/Shift+Tab
focus, Escape closes it, and focus returns to the trigger. The `<html lang>` reacts to
locale changes. The 320px screenshot and browser assertion show no horizontal navigation
rail or horizontal page overflow.

## Baseline and environment constraints

- Starting SHA: `59a5da35a9a464dc63c479471a523add972461`.
- Baseline comparison ref: `origin/main` at `b99779bc208c5abd2aa2e67e618927a2db949c42`.
- The requested `git fetch --all --prune` could not update `.git/FETCH_HEAD` because the
  managed environment denied writes under `.git`; no remote state is claimed beyond the
  recorded local ref.
- `npm ci` remains blocked by the pre-existing package-lock/package.json mismatch
  (`@emnapi/runtime` is missing from the lock). Existing installed dependencies were used
  for the verified gates.

## Deferred later-wave work

Deeper Daily/Leaderboard/Seasons polish, friend/multiplayer UX polish, final Teams/Custom/
Assessments dashboards, whole-product WCAG consistency, final 320px table affordance work,
full SEO/analytics/ad production closure, and production launch activation remain later
work. B07–B09 (typing route-family shell migration, audio route-family shell migration,
and Career/Library alignment) were not represented as complete in this wave.
