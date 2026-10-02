# Production Handoff — Current State & Environment Recovery

Production is active. This document records the verified production baseline
and points to the procedures for creating or recovering an environment. The
first-launch checklist is closed; those procedures are not current launch
blockers.

## Current production state

| Area | Verified state |
| --- | --- |
| Canonical origin | `https://typingarena.click/` |
| Supabase schema | Migrations applied through `0017_capability_retention_cleanup.sql` |
| Supabase Auth | Anonymous sign-ins enabled; Auth Site URL is `https://typingarena.click` |
| Capability cleanup | One daily purge job at `17 3 * * *`; after cleanup, zero expired, over-retention revoked, or orphan capabilities remained, and four active capabilities remained attached to valid resources |
| Data boundary | RLS remained enabled on the relevant tables; the three identified disposable stabilization Teams and their child rows were removed during closure |
| Production verification | Public smoke 37/37 and live backend smoke 26/26 passed during closure |
| Release | PR #19 merged as `be53b071a0922d236995dc9d67bf08b983115d2f`; production Deploy run [36508416755](https://github.com/drewsebastians/TypingArena/actions/runs/36508416755) succeeded |

These closure facts are recorded in [PR #19](https://github.com/drewsebastians/TypingArena/pull/19).
No secrets are recorded here. Recheck the live state before any future
environment recovery or operational change.

## Environment creation or disaster recovery

Use [`docs/PRODUCTION_LAUNCH_RUNBOOK.md`](docs/PRODUCTION_LAUNCH_RUNBOOK.md)
for the detailed first-launch and recovery procedure. Its steps apply when
creating or rebuilding an environment, not as outstanding work for the active
production site.

The recovery sequence is:

1. Link the intended Supabase project and apply the additive migration chain
   through `0017_capability_retention_cleanup.sql` with `supabase db push`.
   Never run `supabase db reset` against production.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `NEXT_PUBLIC_SITE_URL` in the deployment environment. The current canonical
   origin is `https://typingarena.click/`; never place a service-role key in the
   browser build.
3. Enable Anonymous Sign-Ins and set the Supabase Auth Site URL to the selected
   production origin.
4. Confirm there is exactly one daily `purge_expired()` schedule at
   `17 3 * * *` before creating a schedule; avoid duplicate jobs.
5. Follow the runbook's readiness and smoke checks for the recovered
   environment.
6. Deploy the Tournament API only if intentionally activating that optional
   interface. No product UI depends on it.

## External follow-up

The [external action register](closure/EXTERNAL_ACTION_REGISTER.md) tracks
optional provider integrations and post-launch measurement or human validation.
Those items are not blockers for the active production deployment.

