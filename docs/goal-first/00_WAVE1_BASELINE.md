# Goal-First Wave 1 baseline

Captured: 2026-08-30 (Asia/Jakarta)

## Repository safety

- Starting HEAD: `59a5da35a9a464dcfc63c479471a523add972461`
- Branch: `codex/goal-first-wave1`
- Worktree: clean before Wave 1 edits.
- `origin/main`: `b99779bc208c5abd2aa2e67e618927a2db949c42` (same repository tree as the checked-out Pass VII state).
- `git fetch --all --prune`: attempted, but this environment denied writing `.git/FETCH_HEAD`; the remote-tracking `origin/main` ref remains available and was recorded above.
- No unrelated uncommitted changes, stashes, or additional worktrees were present.
- No changes were made directly to `main`.

## Current repository inventory

### Public application routes

`/`, `/typing-test`, `/typing-test/1-minute`, `/typing-test/5-minute`,
`/typing-test/indonesian`, `/tes-mengetik`, `/data-entry-test`,
`/punctuation-typing-test`, `/dictation`, `/dictation/english`,
`/dictation/indonesian`, `/noise-challenge`, `/transcription-practice`,
`/transcription-library`, `/career`, `/daily-arena`, `/leaderboard`,
`/seasons`, `/friends`, `/multiplayer`, `/teams`, `/custom`, `/assessments`,
`/progress`, and `/privacy`.

The static build also emitted `/_not-found`, `/robots.txt`, and `/sitemap.xml`.

### Database

- Historical migrations: `0001_init.sql` through `0014_assignment_admin_policy_fix.sql`.
- Supabase is configured for authenticated-role RLS and server-authoritative RPCs.
- Attempts direct insert/update is revoked after the initial bootstrap; ranked writes use `submit_attempt()`.
- Teams, custom tests, rooms, assessments, and assignment evidence currently depend on an authenticated session.
- Local Supabase CLI and Docker were not installed in this environment, so fresh-stack DB integration was not runnable at baseline.

### Account/auth dependency inventory

- `src/lib/remote.ts` creates the Supabase client, reads `auth.getUser()`, exposes magic-link helpers, and gates shared RPC calls on a current user.
- `src/components/AccountPanel.tsx` renders the optional email/magic-link account flow and account deletion/import controls.
- `/progress` renders `AccountPanel` and describes cross-device sync.
- Teams, Custom, Assessments, Daily, and sync hydration contain current-user checks.
- `profiles` stores a public username; public views expose only username, not email.

### Pass VII state verified

- Desktop navigation uses grouped progressive disclosure; the mobile layout uses a drawer rather than a horizontal route rail.
- Geist/Geist Mono remain the configured fonts.
- `LocaleProvider` updates `document.documentElement.lang` reactively.
- `html[data-exercise-active]` currently dims the header for typing tasks.
- Result hierarchy and dark continuity tokens are present.
- The mobile launcher source class is `h-9 w-9` (36x36 CSS pixels), below the required 44x44 hit target.
- The drawer moves focus to its close button and locks body scroll, but source inspection found no Tab/Shift+Tab containment or focus restoration implementation; this is a Wave 1 correction.

## Baseline gates

| Check | Result | Evidence |
|---|---|---|
| `npm ci` | BLOCKED | Pre-existing lockfile drift: `@emnapi/runtime` is missing from `package-lock.json`; npm advised `npm install`. |
| `npm run lint` | PASS | Exit 0. |
| `npm run typecheck` | PASS | Exit 0. |
| `npm test` | PASS | 18 files, 162/162 tests. |
| `npm run build` | PASS | Next 16.3.2 static build; 30 routes emitted. |
| `npm run test:e2e` | BLOCKED | All 46 cases could not launch the installed Chromium headless shell (`spawn EPERM`); this is an environment execution restriction, not an application assertion result. |
| fresh Supabase DB reset/integration | BLOCKED | `supabase` CLI and Docker are not installed. |
| production readiness | PENDING | To be rerun after Wave 1 changes. |
| deployed/live smoke | NOT RUN | No preview/deployed branch target was available. |

## Baseline artifacts

Pass VII screenshots remain under `artifacts/ui-ux/` and are not overwritten.
New Wave 1 before/after screenshots are stored under
`artifacts/goal-first/wave1/before/` and `artifacts/goal-first/wave1/after/`
when browser execution is available.

## Constraints carried into implementation

The Wave 1 implementation must preserve deterministic engines and scoring,
server-authoritative ranked integrity, static audio, ordinary local-first
practice, honest backend degradation, existing useful routes, consent-gated
analytics, and the no-runtime-AI guard. Historical migrations `0001`–`0014`
remain immutable.
