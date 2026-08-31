# Rollback and Emergency Disable

## Prerequisites

- Record the last known-good commit/artifact, deployment URL, Supabase project
  ref, and incident owner before launch.
- Keep hosting rollback access and provider-disable access separate from normal
  application keys.

## Emergency order

1. If ads or analytics cause harm, remove the corresponding public provider key
   from the protected hosting environment and rebuild/republish the approved
   ad-disabled or analytics-disabled artifact.
2. If a static release is broken, roll back the hosting artifact to the last
   known-good reviewed ref. Confirm canonical, routes, audio, and robots after
   rollback.
3. If a shared backend defect exists, disable the affected shared feature at
   the hosting/config boundary where possible; leave local practice available.
4. For database defects, stop writes if necessary and use a reviewed forward
   migration or the approved Supabase incident/restore process. Never run
   `supabase db reset` against production.
5. Revoke/rotate exposed management capabilities or operational keys according
   to the owner incident procedure. Never paste bearer tokens into tickets or
   logs.

## Expected evidence

Incident timestamp, affected environment, action owner, old/new artifact or
config reference, hosted smoke after mitigation, and follow-up defect ID.

## Failure and recovery

Do not repeatedly retry a failing mutation. Preserve provider/deployment/
Supabase request IDs, keep the site in the safest known state, and require a
reviewed forward fix before re-enabling. Re-run all relevant hosted and manual
checks after recovery.

## Mutation and approval

Every disable, rollback, key rotation, capability revocation, or database
change mutates external state and requires owner/incident approval, except an
already-authorized emergency procedure explicitly delegated to the operator.
