# Production Handoff — External Actions Checklist

Everything implementable in-repo is implemented. The items below require
human/external action and are the ONLY blockers between this repository and a
production launch. None of them block development, CI, or demo deploys.

## 1. Required before first production deploy

| # | Action | Where | Notes |
|---|--------|-------|-------|
| 1 | Create the production Supabase project; apply all migrations (`supabase db push`) | Supabase dashboard / CLI | Migrations 0001→0004 are additive & rerunnable from clean |
| 2 | Set repo/environment **secrets**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub → Settings → Secrets | The deploy workflow passes them to the build |
| 3 | Set repo **variable** `NEXT_PUBLIC_SITE_URL` (final https canonical origin) | GitHub → Settings → Variables | Must match the custom domain; drives sitemap/robots/canonicals/invite links |
| 4 | Run "Deploy" workflow with `target=production` | GitHub Actions | Fails closed if any of the above is missing/placeholder |

## 2. Required for auth + share links

| # | Action | Where |
|---|--------|-------|
| 5 | Add `<SITE_URL>/progress` to Supabase Auth → Redirect URLs | Supabase dashboard |
| 6 | Configure magic-link email template/sender | Supabase dashboard |

Friend invites (`/friends?id=…`), assessment invites (`/assessments?invite=…`),
multiplayer codes and custom-test shares are origin-relative — they inherit
`NEXT_PUBLIC_SITE_URL` automatically once step 3 is done.

## 3. Optional monetization/analytics

| # | Action | Where |
|---|--------|-------|
| 7 | AdSense approval; then set `NEXT_PUBLIC_ADSENSE_CLIENT` secret | Google AdSense / GitHub secrets | Ads stay outside active practice areas regardless |
| 8 | PostHog project; set `NEXT_PUBLIC_POSTHOG_KEY` secret | PostHog | Loads only after user consent |
| 9 | GA4 measurement ID; set `NEXT_PUBLIC_GA_ID` secret | Google Analytics | Consent-gated, IP anonymized |
| 10 | Verify Search Console ownership of the production domain | Google Search Console |

## 4. Scheduled maintenance

| # | Action | Where |
|---|--------|-------|
| 11 | Schedule `select public.purge_expired();` daily via pg_cron or external cron | Supabase | Clears expired custom tests + friend challenges |
| 12 | Deploy tournament edge function when activating the API: `supabase functions deploy tournament-api` | Supabase CLI | Spec: `docs/api/openapi.yaml`; keys hashed in `public.api_keys` |

## Verification after configuration

1. `curl https://<site>/robots.txt` — contains `Disallow: /progress`.
2. `curl https://<site>/sitemap.xml` — absolute URLs use the custom domain.
3. Sign in via magic link on two devices; complete one typing test each;
   confirm both devices show both results after hydration.
4. Create a team, join from a second account, publish an assignment, complete
   it as the member; verify the dashboard shows the server-derived score.
