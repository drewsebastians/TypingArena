# Hosted Shared-Flow Smoke Record

Captured: 2026-08-31 (Asia/Jakarta)

## Status

**NOT RUN — production shared backend is not configured or authorized.**

The safe, credential-free hosted Pages smoke did run against the
API-confirmed demo origin:

- Target: https://drewsebastians.github.io/TypingArena/
- Result: 37 passed, 0 failed
- Coverage: public routes, robots.txt, sitemap.xml, canonical, language,
  JavaScript chunk, and static dictation WAV
- Published revision: main at b99779bc208c5abd2aa2e67e618927a2db949c42

That result proves the currently published static demo surface only. It does
not prove PR #4 is deployed and does not prove any Supabase-backed shared
flow.

## Shared flows intentionally withheld

The following were not executed because no production Supabase project/ref,
anon key, anonymous-auth setting, or owner authorization is available:

- anonymous identity bootstrap and ranked/shared submission;
- friend challenge creation/result submission;
- capability-link issue, recovery, rotation, and revocation;
- team creation, join-by-code, assignment publication, and completion;
- assessment invite resolution, candidate submission, and owner-only result read;
- multiplayer host-token authority and evidence-derived result flow;
- shared-data deletion and production purge verification.

These flows require disposable shared resources and controlled writes. The
owner-run sequence is documented in
docs/owner-activation/03_HOSTED_SMOKE_RUNBOOK.md and
docs/owner-activation/07_MERGE_DEPLOY_GO_NO_GO.md.

## Safe rerun command

After the owner has selected the final served origin, the credential-free
static check can be rerun with:

    SITE_URL=https://final-origin.example node scripts/production-smoke.mjs

The Supabase/Auth configuration and shared-flow steps must be run by the owner
after the production project and deployment environment are configured.
