# External Action Register

These items require owner credentials, a hosted origin, or real post-launch
traffic. They are intentionally not simulated in the repository.

| ID | Action | Why it is external | Evidence needed to close | Status |
| --- | --- | --- | --- | --- |
| EXT-01 | Apply Supabase migrations 0001–0015 to the production project and enable Anonymous Sign-Ins. | Requires a Supabase project and operator access. | Migration log, auth setting, and hosted shared-action smoke. | EXTERNAL ACTION REQUIRED |
| EXT-02 | Configure `NEXT_PUBLIC_SITE_URL`, Supabase URL/anon key, and hosting secrets in the deployment environment. | Secrets and canonical production origin are not present in this workspace. | Redacted deployment configuration plus readiness gate output. | EXTERNAL ACTION REQUIRED |
| EXT-03 | Run `SITE_URL=<real-origin> node scripts/production-smoke.mjs`. | The repository has no staging/production URL or credentials. | Full smoke output: route, SEO, JS, and WAV checks pass. | EXTERNAL ACTION REQUIRED |
| EXT-04 | Confirm production CORS/site URL, RLS, rate limits, purge schedule, and Edge Function configuration. | These are managed in the deployed Supabase project. | Operator checklist and a fresh DB/security smoke. | EXTERNAL ACTION REQUIRED |
| EXT-05 | Configure PostHog or GA4 only after consent/privacy review. | Provider keys and retention settings are owner-controlled. | Consent-on/off capture test and first dated baseline. | EXTERNAL ACTION REQUIRED |
| EXT-06 | Apply for/enable AdSense and publish approved legal/consent disclosures. | Publisher approval and legal review cannot be performed from code. | Approved publisher id, hosted ad-boundary test, and policy review. | EXTERNAL ACTION REQUIRED |
| EXT-07 | Merge PR #4 and deploy. | Owner controls merge and deployment; this task must not merge/deploy. | Owner merge SHA, deployment URL, and hosted smoke. | EXTERNAL ACTION REQUIRED |
| EXT-08 | Collect strategic baseline and review retention/cross-mode funnels. | Requires real consented users and a defined observation window. | Dated measurement report using the plan in `docs/analytics/`. | POST-LAUNCH VALIDATION |
| EXT-09 | Perform human screen-reader, Safari, real-device, contrast, and Core Web Vitals pass. | CI Chromium is not a substitute for those environments. | Accessibility/performance run log with defects triaged. | POST-LAUNCH VALIDATION |

No secret, publisher approval, hosted result, or strategic metric is fabricated
by this closure.
