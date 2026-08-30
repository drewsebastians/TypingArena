# TypingArena Owner Activation Pack

## Current decision

PR #4 is a repository handoff. The independent recommendation is **READY FOR
PR APPROVAL, EXTERNAL PRE-DEPLOY ACTIONS REMAIN** when the final-head checks are
green. The repository is not merged or deployed by this task. Use the exact
head/check IDs in `docs/closure/PR4_FINAL_INDEPENDENT_REVIEW.md` and the PR
itself as the authority; this overview is intentionally operational rather
than a second mutable status ledger.

## Read in this order

1. `01_SUPABASE_PRODUCTION_CHECKLIST.md`
2. `02_HOSTING_ENV_CHECKLIST.md`
3. `03_HOSTED_SMOKE_RUNBOOK.md`
4. `04_ANALYTICS_CONSENT_CHECKLIST.md`
5. `05_ADSENSE_PREAPPLICATION_CHECKLIST.md`
6. `06_ACCESSIBILITY_REAL_DEVICE_CHECKLIST.md`
7. `07_MERGE_DEPLOY_GO_NO_GO.md`
8. `08_ROLLBACK_AND_EMERGENCY_DISABLE.md`

## Non-negotiable boundaries

- Only the owner/operator may merge PR #4 or deploy production.
- Do not run production SQL, change Auth settings, rotate secrets, enable
  analytics, or enable ads from this review without explicit owner approval.
- Never print Supabase service-role keys, capability tokens, invite fragments,
  or candidate data to logs.
- Production activation is not proven by a green repository CI run. It requires
  the real project, origin, configuration, and hosted smoke evidence.

## Evidence packet to retain

Keep the PR URL, final commit SHA, CI/DB run URLs, migration log, redacted
hosting configuration record, hosted smoke output, and manual accessibility /
performance notes together. Staging evidence must be labelled staging and must
not be presented as production evidence.
