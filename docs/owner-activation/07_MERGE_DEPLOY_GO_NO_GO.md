# Merge / Deploy Go-No-Go

## Repository-level go criteria

- PR #4 is open, non-draft, mergeable, and green on its exact final head.
- `npm ci --no-audit --no-fund`, lint, typecheck, unit tests, static build,
  independent Playwright suite, DB integration, readiness, runtime-AI scan,
  and static smoke are recorded with exact results.
- Security review has no P0/P1 repository blocker; public board views do not
  expose auth UUIDs; analytics/ad boundaries are proven for their scope.

## External pre-deploy criteria

- Production Supabase project identity and backup policy confirmed.
- Migrations `0001`–`0016` applied additively; Anonymous Sign-Ins, RLS/RPCs,
  allowed origin, rate limits, and purge schedule verified.
- Hosting env contains the correct canonical origin and Supabase public keys;
  production readiness passes.
- Hosted read-only smoke passes. Any shared smoke uses disposable resources and
  has cleanup evidence.

## Sequence

1. Owner reviews the final independent report and this page.
2. Owner completes Supabase and hosting checklists.
3. Owner runs hosted smoke and records the environment label/evidence.
4. Owner merges PR #4.
5. Owner deploys using the approved workflow/ref.
6. Owner reruns hosted smoke, real-device checks, and optional provider checks.
7. Owner records rollback reference and begins post-launch measurement.

## Stop conditions

Stop before merge for a red final workflow, unresolved P0/P1, unexplained
working-tree/PR divergence, or stale checks. Stop before deploy for missing
Supabase/Auth/config/origin/hosted evidence. Post-launch research is not a
pre-merge blocker, but it must remain explicitly open.

## Mutation and approval

Review and read-only checks do not merge/deploy. Merge, deployment, production
database/Auth/config changes, provider activation, and rollback require owner
approval.
