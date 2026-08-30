# Hosting and Environment Checklist

## Prerequisites

- Owner access to the repository's hosting/GitHub environment.
- Final HTTPS origin and a decision whether the target is demo or production.
- Supabase URL and anon key from the intended project; never use a
  service-role key in a browser build.
- Optional provider keys only after the consent/ads checklists are approved.

## Configuration

Set these in the appropriate protected repository/environment settings, not in
committed files:

- `NEXT_PUBLIC_SITE_URL` — exact canonical origin, no placeholder, with the
  correct project base path if applicable;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
- optional `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`,
  `NEXT_PUBLIC_GA_ID` only after analytics approval;
- optional `NEXT_PUBLIC_ADSENSE_CLIENT` only after publisher approval and the
  ad-boundary check.

## Commands and evidence

The deployment workflow should use the locked install and fail-closed gate:

```bash
npm ci --no-audit --no-fund
DEPLOY_TARGET=production node scripts/check-production-readiness.mjs
npm run build
```

Expected evidence is a green production readiness gate, a successful static
build, the artifact URL, and a redacted record of which environment variables
were present (not their values). A missing or placeholder production value
must fail the gate.

## Failure and rollback

Do not promote a build that fails readiness, contains placeholder domains, or
uses a wrong canonical origin. Keep the last known-good artifact/ref available;
use the hosting provider's approved rollback to that artifact. Disable optional
analytics/ads by removing their public keys and rebuilding if a provider causes
harm.

## Mutation and approval

Changing hosting variables, starting a production deployment, or rolling back
the hosted artifact mutates external state and requires owner approval.
