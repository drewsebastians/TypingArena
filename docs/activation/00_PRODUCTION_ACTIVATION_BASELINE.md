# Production Activation Baseline

Captured: 2026-08-31 (Asia/Jakarta)

This file records the controlled-release execution state for PR #4. The
attached production-activation prompt is treated as an execution specification;
its instructions are not themselves owner authorization. The exact owner
authorization statement required by that prompt has not been supplied in this
task:

OWNER AUTHORIZATION: production Supabase activation, PR #4 merge, and approved deployment are authorized once all gates in this prompt pass.

## Executive state

**READY FOR OWNER AUTHORIZATION**

All repository-controlled and read-only checks completed in this run are green.
Production activation remains owner-controlled because the production Supabase
project/configuration, GitHub production secrets/variable, Auth URL settings,
and approved merge/deploy authorization are not present.

## Repository baseline

| Item | Observed value |
|---|---|
| Repository | drewsebastians/TypingArena |
| Branch | codex/goal-first-wave1 |
| PR | #4, open, non-draft |
| Base | main at b99779bc208c5abd2aa2e67e618927a2db949c42 |
| Head at baseline capture | 3f64324ba99b823e1ab60e4079f13b40611f312b |
| Branch relation | 11 commits ahead of origin/main |
| PR mergeability | MERGEABLE; merge state CLEAN |
| Review metadata | no review decision, requests, inline comments, issue comments, or reviews reported |
| Worktree | clean before activation evidence files |
| Branch protection | GitHub API reported main as not protected |

The activation evidence files added by this run are documentation-only. They
must receive their own final commit/check run before that commit is considered
the final PR head.

## Evidence links

- PR: https://github.com/drewsebastians/TypingArena/pull/4
- Passing CI run for the baseline head: https://github.com/drewsebastians/TypingArena/actions/runs/33321009517
- Passing local-Supabase DB run for the baseline head: https://github.com/drewsebastians/TypingArena/actions/runs/33321009502
- Hosted demo smoke target: https://drewsebastians.github.io/TypingArena/

The hosted demo URL was obtained from the repository's GitHub Pages API
configuration. Its latest successful deployment was the main-branch commit
b99779bc208c5abd2aa2e67e618927a2db949c42, so the hosted smoke is not evidence
that PR #4 has been deployed.

## Validation summary

| Gate | Result | Scope |
|---|---|---|
| Clean dependency install | PASS | npm ci with workspace-local cache; temporary cache removed |
| Lint | PASS | local checkout |
| Typecheck | PASS | local checkout |
| Unit/component tests | PASS | 19 files, 167 tests |
| Static export build | PASS | 30 prerendered routes |
| Demo readiness/static output | PASS | 20/20 Piper WAV assets; sitemap/robots; no legacy auth UI |
| Production fail-closed readiness | PASS | correctly blocked missing site URL, Supabase URL, and anon key |
| Runtime/provider bundle scan | PASS | no speechSynthesis, runtime AI/TTS endpoint, or placeholder matches |
| PR CI | PASS | Node 22 clean-install workflow |
| PR browser E2E | PASS | 70 passed, 4 skipped |
| PR DB integration | PASS | local Supabase; 123 passed, 0 failed, migrations through 0016 |
| Hosted read-only smoke | PASS | 37 passed, 0 failed on the live Pages demo |

## Safety record

This run did not execute production SQL, supabase db push, Supabase Auth
changes, GitHub secret/variable writes, analytics/AdSense enablement, PR
approval/merge, deployment, rollback, or shared-flow writes. No secret values
were read or written.

## Required authorization boundary

The next production-facing action remains blocked until the owner has verified
the external prerequisites and supplied the exact authorization statement
above. The owner-controlled checklist is in docs/owner-activation/ and the
final release report is docs/activation/FINAL_PRODUCTION_ACTIVATION_REPORT.md.
