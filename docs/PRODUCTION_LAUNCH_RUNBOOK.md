# Production Launch Runbook

Operational source of truth for TypingArena's first production launch.
Companion documents: `docs/PRODUCTION_HANDOFF.md` (checklist),
`docs/PRODUCTION_SMOKE_MATRIX.md` (route matrix), `docs/ADR-004-trust-model.md`
(trust boundary), `docs/FINAL_ENGINEERING_FREEZE_EVIDENCE.md` (freeze proof).

Current frozen main at time of writing: `936ee1e` → landed line
`0349d5b` (PR #1). Always re-check `git log -1 origin/main` before executing.

---

## A. Preconditions

| Item | Requirement |
|---|---|
| Repository | push access to `drewsebastians/TypingArena`; GitHub Actions enabled |
| Supabase | account able to create the PRODUCTION project (not a dev copy) |
| Domain decision | either GitHub Pages project URL (`https://<user>.github.io/<repo>`) or a custom HTTPS origin — this choice controls `NEXT_PUBLIC_SITE_URL`, base path, and DNS steps (§D) |
| Anonymous Auth | Anonymous Sign-Ins enabled in the production Supabase project |
| Secrets scope | only PUBLIC (`NEXT_PUBLIC_*`) values are used by the site build; never place service-role keys in browser-facing configuration |

## B. Supabase production activation

1. Create the production project; note the project URL + anon key
   (Settings → API). The anon key is safe to expose to browsers — RLS is the
   security layer. NEVER use the service-role key in the site build.
2. Apply migrations from a clean checkout:
   ```bash
   supabase link --project-ref <ref>
   supabase db push            # applies 0001→0016 additively, in order
   ```
   The chain is additive and rerunnable-from-clean. NEVER run `db reset`
   against production.
3. Verify: Dashboard → Database → Migrations lists 0001…0016 as applied;
   Table Editor shows `attempts`, `teams`, `assignments`,
   `assignment_completions`, `assessments`, `assessment_results`, `rooms`,
   `room_results`, `custom_tests`, `friend_challenges(+results)`, `profiles`,
   `api_keys`, `tournaments(+entries)`, `rate_limits`.
4. Auth → Providers: enable Anonymous Sign-Ins. Auth → URL configuration:
   Site URL = production origin. Email login and magic-link UI are not part of
   this product flow.
5. Scheduled cleanup: enable `pg_cron`, then
   ```sql
   select cron.schedule('typingarena-purge', '17 3 * * *',
     'select public.purge_expired();');
   ```
6. Tournament API: OPTIONAL. Deploy only if intentionally activating
   (`supabase functions deploy tournament-api`). No UI depends on it.

## C. GitHub production configuration

1. Settings → Secrets: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ optional `NEXT_PUBLIC_POSTHOG_KEY`,
   `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT`).
2. Settings → Variables: `NEXT_PUBLIC_SITE_URL=https://<final-origin>`
   (exact scheme/host, no trailing slash).
3. Actions → "Deploy" → Run workflow → `target=production`.
   The readiness gate FAILS CLOSED on missing or placeholder values.

## D. Domain / canonical setup

Two supported modes (driven by env, no code change):

| Mode | Env | Base path | Notes |
|---|---|---|---|
| GitHub Pages project site (current demo) | `GITHUB_PAGES=true`, site URL `https://<user>.github.io/<repo>` | `/repo` set automatically | Assets/canonical/sitemap already verified live at `https://drewsebastians.github.io/TypingArena` |
| Custom domain / Vercel-class host | `NEXT_PUBLIC_SITE_URL=https://<domain>`; do NOT set `GITHUB_PAGES` | empty | For GitHub Pages custom domains additionally configure the domain in Pages settings and commit a `CNAME` file if required |

After switching: run the smoke script and verify sitemap/canonical flipped:
```bash
SITE_URL=https://<final-origin> node scripts/production-smoke.mjs
```

## E. Analytics / consent

PostHog/GA4 initialize ONLY after the visitor grants analytics consent
(banner on first visit). With keys configured verify: network tab shows the
provider loading after "Accept", never before; payloads contain counters and
event names only — no typed text, keystrokes, answers, emails, tokens, or
host secrets (unit-tested in `tests/analytics.test.ts`). Absence of keys is
non-breaking by design.

## F. Ads

AdSense requires approval; until then slots stay reserved and inert (no fake
ads, no layout shift — reserved containers). Placements audited: list/result/
landing surfaces only; engines, multiplayer, assignment runner, and candidate
assessment flow contain ZERO ad code. If approved: set the client secret,
redeploy, confirm real markup appears only in reserved slots. Add `ads.txt`
at the domain root ONLY with the publisher ID AdSense actually issues.

## G. Search

1. Search Console → verify the production property (DNS or HTML file).
2. Submit `https://<origin>/sitemap.xml`.
3. Inspect canonical homepage + one EN page + one ID page ("Page indexing"
   report); confirm `/progress` is excluded (robots Disallow + noindex).

## H. Production smoke tests

Automated (repeat any time):
```bash
SITE_URL=https://<origin> node scripts/production-smoke.mjs
```
Covers all routes, robots/sitemap contract, canonical, placeholders, JS chunk,
static audio (37 checks; current demo passes 37/37).

Manual, once backend is connected (use disposable anonymous test sessions):
1. **Typing**: complete ordinary practice with the backend unavailable → local
   result renders; then run a ranked/shared action → anonymous identity is
   created lazily and the server-authoritative result is accepted or honestly
   degraded.
2. **Capability recovery**: create a Team, Custom test, or Assessment → copy
   the private management link → open it in a clean browser session → the
   exact resource is recovered, then rotate and revoke the link.
3. **Dictation/Transcription**: play static WAV, replay, submit → scores
   render; replay metrics recorded.
4. **Teams round-trip**: A creates team → B joins by code → A publishes a
   sprint assignment → B runs it → completion shows SERVER-derived score →
   A's dashboard shows aggregate.
5. **Assessment**: A creates assessment selecting non-default modules →
   candidate opens invite (no signup) → exact module sequence runs → submit →
   only A sees the summary; wrong/expired/revoked invites are refused.
6. **Multiplayer**: A creates room (host token) → B joins → B's start is
   DENIED server-side → A starts → both see live progress bars → results
   derived from evidence; forged claims rejected.
7. **Deletion**: local delete clears device history and queued sync data;
   shared-data delete removes shared attempts/profile/memberships/resources
   while leaving the anonymous Auth identity inert (verify in Supabase).

## I. Rollback

- Deployment rollback = re-run "Deploy" pinned to the last known-good SHA
  (GitHub Actions supports workflow_dispatch from a ref), or revert the
  offending commit on `main` and let CI re-prove.
- NEVER roll back the production database destructively. Migrations are
  additive; forward-fix with a new migration instead. If a migration must be
  neutralized, write `0015+` that reverses its effect explicitly.
- Keep the previous GitHub Pages deployment available via the Pages UI
  history while validating a new release.
