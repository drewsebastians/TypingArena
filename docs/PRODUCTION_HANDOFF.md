# Production Handoff — External Actions Checklist

Everything implementable in-repo is implemented and frozen (see
`docs/FINAL_ENGINEERING_FREEZE_EVIDENCE.md`). The items below require
human/external action and are the ONLY blockers between this repository and a
production launch. None of them block development, CI, or demo deploys.

**Operational source of truth for first launch:**
`docs/PRODUCTION_LAUNCH_RUNBOOK.md` — detailed, step-by-step.
Route-by-route verification matrix: `docs/PRODUCTION_SMOKE_MATRIX.md`.
Executable checks: `node scripts/production-smoke.mjs` (usage inside).

## 1. Required before first production deploy

| # | Action | Where | Notes |
|---|--------|-------|-------|
| 1 | Create the production Supabase project; apply ALL migrations (`supabase db push`) | Supabase dashboard / CLI | Additive chain **0001→0015**; rerunnable from clean; never reset a live database |
| 2 | Set repo/environment **secrets**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub → Settings → Secrets | Deploy workflow passes them to the build |
| 3 | Set repo **variable** `NEXT_PUBLIC_SITE_URL` (final https canonical origin) | GitHub → Settings → Variables | Drives sitemap/robots/canonicals/invite links; must exactly match the served origin |
| 4 | Run "Deploy" workflow with `target=production` | GitHub Actions | Readiness gate FAILS CLOSED on missing/placeholder config |

## 2. Required for anonymous shared actions + share links

| # | Action | Where |
|---|--------|-------|
| 5 | Enable Anonymous Sign-Ins in Supabase Auth | Supabase dashboard |
| 6 | Set Supabase Auth Site URL to the final HTTPS origin | Supabase dashboard |

Friend invites (`/friends?id=…`), assessment invites (`/assessments?invite=…`),
multiplayer codes and custom-test shares are origin-relative — they inherit
`NEXT_PUBLIC_SITE_URL` automatically once step 3 is done.

## 3. Optional monetization/analytics (non-blocking)

| # | Action | Where | Notes |
|---|--------|-------|-------|
| 7 | AdSense approval; then set `NEXT_PUBLIC_ADSENSE_CLIENT` | Google AdSense / GitHub secrets | Ads stay outside active practice areas; site launches fine without ads |
| 8 | PostHog project; set `NEXT_PUBLIC_POSTHOG_KEY` | PostHog | Loads only after visitor consent |
| 9 | GA4 measurement ID; set `NEXT_PUBLIC_GA_ID` | Google Analytics | Consent-gated, IP-anonymized |
| 10 | Verify Search Console ownership; submit sitemap | Google Search Console | After DNS/domain is final |

## 4. Scheduled maintenance & optional API

| # | Action | Where | Notes |
|---|--------|-------|-------|
| 11 | Schedule `select public.purge_expired();` daily (pg_cron or external cron) | Supabase | Clears expired custom tests + friend challenges; mark done before full launch |
| 12 | Tournament API is OPTIONAL — deploy only if intentionally activating: `supabase functions deploy tournament-api` | Supabase CLI | Spec: `docs/api/openapi.yaml`; keys stored hashed in `public.api_keys`; no UI depends on it |

## Verification after configuration

Run the automated checks:
```bash
SITE_URL=https://<your-origin> node scripts/production-smoke.mjs
```
Then the human steps in `docs/PRODUCTION_LAUNCH_RUNBOOK.md` §H
(anonymous shared-action bootstrap, capability-link recovery, team assignment
round-trip, and assessment candidate submission).
