# Production Launch Runbook

Operational runbook for first launch, environment recreation, and disaster
recovery. Production is currently active at `https://typingarena.click/`; use
this runbook when creating or recovering an environment, not as a list of
current launch blockers. Companion documents: `docs/PRODUCTION_HANDOFF.md`
(current state and recovery summary),
`docs/PRODUCTION_SMOKE_MATRIX.md` (route matrix), `docs/ADR-004-trust-model.md`
(trust boundary), `docs/FINAL_ENGINEERING_FREEZE_EVIDENCE.md` (freeze proof).

For any recovery, start from the current `origin/main` and verify the migration
chain before making environment changes. Current production is migrated through
`0017_capability_retention_cleanup.sql`.

---

## A. Preconditions

| Item | Requirement |
|---|---|
| Repository | push access to `drewsebastians/TypingArena`; GitHub Actions enabled |
| Supabase | account able to create the PRODUCTION project (not a dev copy) |
| Domain decision | Current production uses `https://typingarena.click/`; this choice controls `NEXT_PUBLIC_SITE_URL`, base path, and DNS steps (§D) |
| Anonymous Auth | Anonymous Sign-Ins enabled in the production Supabase project |
| Secrets scope | only PUBLIC (`NEXT_PUBLIC_*`) values are used by the site build; never place service-role keys in browser-facing configuration |

## B. Supabase production activation

1. Create the production project; note the project URL + anon key
   (Settings → API). The anon key is safe to expose to browsers — RLS is the
   security layer. NEVER use the service-role key in the site build.
2. Apply migrations from a clean checkout:
   ```bash
   supabase link --project-ref <ref>
   supabase db push            # applies 0001→0017 additively, in order
   ```
   The chain is additive and rerunnable-from-clean. NEVER run `db reset`
   against production.
3. Verify: Dashboard → Database → Migrations lists 0001…0017 as applied;
   Table Editor shows `attempts`, `teams`, `assignments`,
   `assignment_completions`, `assessments`, `assessment_results`, `rooms`,
   `room_results`, `custom_tests`, `friend_challenges(+results)`, `profiles`,
   `api_keys`, `tournaments(+entries)`, `rate_limits`.
4. Auth → Providers: enable Anonymous Sign-Ins. Auth → URL configuration:
   Site URL = production origin. Email login and magic-link UI are not part of
   this product flow.
5. Scheduled cleanup: inspect existing schedules first. The active production
   project has one daily purge at `17 3 * * *`; do not create a duplicate. For a
   new environment with no purge schedule, enable `pg_cron`, then
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

Two supported modes are driven by the canonical URL. The GitHub Pages workflow
may keep `GITHUB_PAGES=true`; `next.config.ts` derives the emitted path from
`NEXT_PUBLIC_SITE_URL`.

| Mode | Env | Base path | Notes |
|---|---|---|---|
| GitHub Pages project site (alternate/legacy origin) | `GITHUB_PAGES=true`, site URL `https://<user>.github.io/<repo>` | `/repo` derived from the URL | Use only when intentionally creating a project-site deployment; this is not the current canonical origin |
| Custom domain on GitHub Pages (current production) | `NEXT_PUBLIC_SITE_URL=https://typingarena.click` | empty for a root domain | The production origin is `https://typingarena.click/`; configure the Pages custom domain for a recreated environment |
| Other root host | `NEXT_PUBLIC_SITE_URL=https://<domain>` | empty for a root domain | Use the hosting provider's domain setup instructions |

After switching: run the smoke script and verify sitemap/canonical flipped:
```bash
SITE_URL=https://<final-origin> node scripts/production-smoke.mjs
```

## E. Product analytics (deferred)

Owner decision (2026-10-30): do not configure PostHog or GA4 behavioral
analytics for now. Keep both provider keys unset and preserve the existing
consent gating. The app remains functional without analytics keys.

Do not run the first-week behavioral baseline or retention/cross-mode review
unless the owner reopens this decision. If reopened, first record the provider,
data region, retention and privacy review, then follow the consent checks in
[`owner-activation/04_ANALYTICS_CONSENT_CHECKLIST.md`](owner-activation/04_ANALYTICS_CONSENT_CHECKLIST.md).

## F. Ads

AdSense requires approval; until then slots stay reserved and inert (no fake
ads, no layout shift — reserved containers). Placements audited: list/result/
landing surfaces only; engines, multiplayer, assignment runner, and candidate
assessment flow contain ZERO ad code. If approved: set the client secret,
redeploy, confirm real markup appears only in reserved slots. Add `ads.txt`
at the domain root ONLY with the publisher ID AdSense actually issues.

## G. Search Console — priority

Search visibility is a priority. Use Google Search Console directly; GSC Wizard
is not the operating path and will not be renewed. As of 2026-10-30, property
verification and sitemap submission are not confirmed.

1. Open Search Console with the owner's Google account and inspect existing
   properties before adding anything. Reuse the verified URL-prefix property
   `https://typingarena.click/` or domain property `sc-domain:typingarena.click`
   if one already exists.
2. If neither property is verified, verify ownership through DNS or the
   documented HTML-file method. This requires access to the domain or hosting
   settings; do not claim verification until Search Console confirms it.
3. Submit the published sitemap `https://typingarena.click/sitemap.xml`.
4. Record the property type, submission date, sitemap status, last-read time,
   and any warnings or errors.
5. Inspect the canonical homepage, one English page (for example
   `/typing-test`), and one Indonesian page (for example `/tes-mengetik`).
   Confirm `/progress` remains excluded by robots Disallow and noindex.
6. Review Search results performance after data is available. Sitemap
   acceptance is not proof that URLs have been indexed.

## H. Production smoke tests

Automated (repeat any time):
```bash
SITE_URL=https://<origin> node scripts/production-smoke.mjs
```
Covers all routes, robots/sitemap contract, canonical, placeholders, JS chunk,
and static audio. Production closure on 2026-09-29 recorded 37/37 public checks
and 26/26 live backend checks; see [the handoff](docs/PRODUCTION_HANDOFF.md).

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
  neutralized, write `0018` or later to reverse its effect explicitly.
- Keep the previous GitHub Pages deployment available via the Pages UI
  history while validating a new release.
