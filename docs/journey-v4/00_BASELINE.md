# Journey v4 baseline

Date: 2026-09-02 (Asia/Jakarta)

## Execution state

- Branch: `codex/ux-journey-v4`
- Starting SHA: `349990e09e691f394246bcf8ed21001deda8dca8`
- Research baseline SHA: `349990e09e691f394246bcf8ed21001deda8dca8`
- `origin/main`: `349990e09e691f394246bcf8ed21001deda8dca8` after `git fetch --all --prune`
- Worktree was clean before implementation.
- No DNS, Pages, production, or remote branch mutation was performed.

## Baseline validation

| Gate | Result | Evidence |
|---|---|---|
| `npm ci --no-audit --no-fund` | PASS | 915 packages installed; Windows cache cleanup required elevated execution |
| `npm run lint` | PASS | ESLint completed with exit 0 |
| `npm run typecheck` | PASS | TypeScript completed with exit 0 |
| `npm test` | PASS | 21 files, 173 tests |
| `npm run build` | PASS | Next.js static export; 30 prerendered routes |
| `npm run test:e2e` | PASS (elevated) | 70 passed, 4 skipped; browser launch required elevated execution |
| non-elevated Playwright attempt | ENVIRONMENTAL | Chromium `spawn EPERM`; no application assertion was reached |

## Route registry inventory

The registry contains the existing Home, 25 product/utility destinations, and no legacy Lessons/Games/Certification routes. The implementation preserves these paths:

`/`, `/typing-test`, `/typing-test/1-minute`, `/typing-test/5-minute`, `/typing-test/indonesian`, `/tes-mengetik`, `/data-entry-test`, `/punctuation-typing-test`, `/dictation`, `/dictation/english`, `/dictation/indonesian`, `/noise-challenge`, `/transcription-practice`, `/transcription-library`, `/career`, `/daily-arena`, `/leaderboard`, `/seasons`, `/multiplayer`, `/friends`, `/teams`, `/custom`, `/assessments`, `/progress`, `/privacy`.

## Current UX reality at the baseline

- Home renders the real canonical `TypingTestPanel`/`TypingEngine`, but only after a six-card GoalGrid and Step 1 / Step 2 framing.
- Home dynamically swaps Dictation and Transcription engines for selected goals.
- The header exposes direct Typing Test, Dictation, and Progress links plus mixed Practice / Compete / More menus rather than the v4 Practice / Arena / Progress / For Teams model.
- `ResultCard` presents Share, listening, friend, Daily Arena, and Next exercise as peer actions; `TypingTestPanel` adds a second Dictation `NextStepCard`.
- Typing result copy promises future passage bias toward weak characters although no such next-stream adaptation is implemented.
- Progress places nickname and sync administration before Recommended Next.
- Arena and organizer routes do not yet share a route-aware section navigation component.
- Teams rows place management-link, revoke, leave, and delete controls beside the primary room action.
- Assessment candidates move from invite validation directly into module 1 without a lightweight intro.
- Practice active-task ad suppression is already enforced by `SafeAdSlot` plus the document exercise marker.
- Ordinary practice is device-local; shared actions use the existing anonymous identity and server-authoritative contracts.

## Baseline screenshots

Captured from the production static export before v4 implementation:

- `artifacts/journey-v4/before/home-desktop-1440x900.png`
- `artifacts/journey-v4/before/home-desktop-1280x800.png`
- `artifacts/journey-v4/before/home-tablet-768x1024.png`
- `artifacts/journey-v4/before/home-mobile-390x844.png`
- `artifacts/journey-v4/before/home-mobile-375x667.png`
- `artifacts/journey-v4/before/home-stress-320x568.png`
- `artifacts/journey-v4/before/typing-desktop-1440x900.png`
- `artifacts/journey-v4/before/typing-mobile-390x844.png`
- `artifacts/journey-v4/before/dictation-desktop-1440x900.png`
- `artifacts/journey-v4/before/dictation-mobile-390x844.png`
- `artifacts/journey-v4/before/transcription-desktop-1440x900.png`
- `artifacts/journey-v4/before/transcription-mobile-390x844.png`
- `artifacts/journey-v4/before/progress-desktop-1440x900.png`
- `artifacts/journey-v4/before/progress-mobile-390x844.png`
- `artifacts/journey-v4/before/daily-desktop-1440x900.png`
- `artifacts/journey-v4/before/teams-desktop-1440x900.png`
- `artifacts/journey-v4/before/assessments-desktop-1440x900.png`

## v4-installed documentation

The supplied blueprint is installed verbatim at `docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v4.md`. Historical v2 and closure documents remain in place as provenance.
