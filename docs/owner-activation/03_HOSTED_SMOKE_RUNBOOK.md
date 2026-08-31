# Hosted Smoke Runbook

## Prerequisites

- A real safe HTTPS origin, labelled demo, staging, or production.
- Owner approval for any shared write flow; default smoke is read-only.
- For configured shared tests, disposable identities/resources and a cleanup
  plan. Never use a real candidate or personal dataset.

## Read-only smoke

Run from the reviewed checkout:

```bash
SITE_URL="https://real-origin.example" node scripts/production-smoke.mjs
```

The script checks the homepage, public route/HTML reachability, canonical
origin, robots, sitemap, JavaScript, a static WAV, placeholder domains, and
runtime-AI signatures. Repeat with the real base path when the host serves a
project site.

Then manually verify clean and query-state URLs: the clean route is indexable,
while invite/challenge/management state is `noindex,nofollow`; backend-degraded
surfaces explain setup instead of showing fabricated rows.

## Optional controlled shared smoke

Only with explicit approval, use disposable anonymous identities and temporary
resources to exercise create/join/share, server-validated submission, board
visibility, capability recovery, and deletion. Do not print tokens, create
ranked production noise, or delete a real owner's data. Clean every disposable
resource and record the cleanup evidence.

## Expected evidence

Keep the command, environment label, timestamp, exit code, route summary,
canonical/robots/sitemap results, and redacted screenshots/logs. A hosted pass
does not prove production if the URL was staging.

## Failure and rollback

Stop on origin mismatch, JavaScript failure, broken audio, leaked placeholder /
AI signature, unexpected account prompt, fabricated board rows, or unsafe ad
placement. Do not retry mutating calls blindly; preserve the request/error
identifier and use the rollback runbook if a deployment change is implicated.

## Mutation and approval

Read-only smoke is non-mutating. Shared-flow smoke creates and deletes remote
data and therefore requires owner approval and disposable resources.
