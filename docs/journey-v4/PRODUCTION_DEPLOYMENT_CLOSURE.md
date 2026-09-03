# TypingArena v4 Production Deployment Closure

**Status: `PRODUCTION DEPLOYMENT COMPLETE`**

Closure date: 2026-09-03 (Asia/Jakarta)

This record closes the supplied TypingArena v4 production-closure prompt. The
updated integrated blueprint is present at
`docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v4.md`; its SHA-256 is
`8EA15C648BA71E94131EA3D20AF6E42B9DF41B42EB2E5959E375D50C26674282`.

## 1. Release identity

| Item | Evidence |
|---|---|
| v4 UX implementation PR | [PR #15](https://github.com/drewsebastians/TypingArena/pull/15), merged 2026-09-03T04:09:53Z |
| v4 UX head reviewed and merged | `2cd8c3fda032c59e23a319293fc473da1c10e657` → merge `85960725a246608b973cc572e3d97ac132d6af76` |
| Production hotfix PR | [PR #16](https://github.com/drewsebastians/TypingArena/pull/16), merged 2026-09-03T05:07:13Z |
| Hotfix | `670e0622b2ed03904b3888b6cbef02dc36a668f1` → merge `648cc81221b4da95447a06cbba0a1d6c0e2459df` |
| Final production application SHA | `648cc81221b4da95447a06cbba0a1d6c0e2459df` |
| Canonical production URL | `https://typingarena.click/` |
| Final Pages deployment | Deployment `6237387719`, status `success`, environment URL `https://typingarena.click/` |

The hotfix serializes the shared `submit_attempt` RPC payload into the
snake_case contract consumed by the production database function. It includes
unit coverage for the mapping and queue path; no schema, auth, RLS, DNS, or
production-secret changes were made.

## 2. Required local validation

All release gates were run after the hotfix merge.

| Command | Result |
|---|---|
| `npm ci --no-audit --no-fund` | PASS; 915 packages installed |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS; 22 files, 175 tests |
| `npm run build` | PASS; 30 static routes generated |
| `npm run test:e2e` | PASS; 73 passed, 5 skipped, 78 total |
| `node scripts/check-production-readiness.mjs` with demo target | PASS |
| `DEPLOY_TARGET=production node scripts/check-production-readiness.mjs` locally | FAILS CLOSED as designed when local production secrets are absent |
| Targeted RPC/queue hotfix tests | PASS; 23 tests |
| `node scripts/production-smoke.mjs https://typingarena.click` | PASS; 37 assertions, 0 failures |

The production-target readiness gate passed in the GitHub Actions production
workflow, where the configured production environment is available. PR #16
checks were green for CI, database integration, and E2E; Supabase Preview was
skipped by the repository's existing configuration.

## 3. Merge and deployment evidence

The original v4 merge was followed by a successful automatic canary and an
explicit production deployment. The RPC hotfix was then reviewed and merged
through the normal PR path, followed by a successful automatic canary and the
final explicit production deployment.

| Stage | Workflow | SHA | Result |
|---|---|---|---|
| v4 automatic post-merge canary | [Run 33714034877](https://github.com/drewsebastians/TypingArena/actions/runs/33714034877) | `85960725a246608b973cc572e3d97ac132d6af76` | PASS |
| v4 explicit production deploy | [Run 33714198801](https://github.com/drewsebastians/TypingArena/actions/runs/33714198801) | `85960725a246608b973cc572e3d97ac132d6af76` | PASS |
| hotfix automatic post-merge canary | [Run 33717558425](https://github.com/drewsebastians/TypingArena/actions/runs/33717558425) | `648cc81221b4da95447a06cbba0a1d6c0e2459df` | PASS; build and deploy jobs green |
| final explicit production deploy | [Run 33717763492](https://github.com/drewsebastians/TypingArena/actions/runs/33717763492) | `648cc81221b4da95447a06cbba0a1d6c0e2459df` | PASS; production readiness, build, artifact, and deploy green |

## 4. Production route, SEO, and asset smoke

The final public smoke against `https://typingarena.click` passed 37/37. It
covered the public route contract for Home, typing modes, Indonesian typing,
data-entry and punctuation practice, dictation, transcription, Career, Daily
Arena, leaderboard, seasons, friends, multiplayer, Teams, Custom, Assessments,
Progress, and Privacy, plus `robots.txt`, `sitemap.xml`, canonical metadata,
placeholder-domain checks, the HTML language attribute, the critical JS chunk,
and static dictation audio.

The smoke specifically confirmed:

- the canonical origin is `https://typingarena.click/`;
- `robots.txt` references the sitemap and excludes `/progress`;
- the sitemap contains canonical-origin URLs and excludes `/progress`;
- critical JavaScript and static audio resolve successfully; and
- no placeholder host or development-domain leakage appears in the public HTML
  or sitemap.

## 5. v4 UX proof in the deployed build

The final browser evidence captured nine screenshots at desktop, mobile, and
320px stress widths. The associated report records 26/26 passed assertions,
zero page errors, and zero unexpected console errors.

- Home renders a real typing workspace immediately, without a goal gate.
- Home uses the ordinary typing engine and contains no audio engine.
- The result view has one primary continuation, one secondary continuation,
  and no duplicate next-step card.
- Daily Arena, Progress, Teams, and the invalid Assessment-invite state render
  at their intended routes and responsive sizes.
- A fresh Privacy visit shows the consent choice before optional providers.
- The live active-task audit confirms the typing ad slot is present before the
  task starts and disappears when the task becomes active.

Evidence: [`browser-report.json`](../../artifacts/journey-v4/production/browser-report.json)
and the screenshots in
[`artifacts/journey-v4/production/`](../../artifacts/journey-v4/production/).

## 6. Live shared-backend validation

The final anonymous browser harness passed 26/26 checks with five recorded
operations, zero page errors, and zero unexpected console errors. The expected
HTTP 400 responses occurred only when a revoked/invalid Assessment invite was
intentionally checked; that is the required fail-closed behavior.

The disposable live flow proved:

1. ordinary Home practice completes locally and makes zero shared-backend
   requests;
2. an anonymous Team can be created, produces a join code, publishes a real
   timed assignment, and is joined by a second anonymous session;
3. the member's timed completion displays a server-derived score and the owner
   dashboard aggregates the completion;
4. a clean session recovers the Team through its management capability, which
   can be rotated, revoked, and used to delete the disposable Team and
   assignment data;
5. an Assessment can be created with a non-default saved module sequence;
6. a clean candidate resolves that exact sequence and submits a real timed
   result through the public invite;
7. the candidate result appears only in the organizer's summaries;
8. Assessment management capability rotation and revocation work, invite
   revocation is visible to candidates, and the revoked invite fails closed; and
9. the organizer privacy deletion flow removes the disposable shared
   Assessment data, after which the invite no longer resolves.

Evidence: [`live-backend-report.json`](../../artifacts/journey-v4/production/live-backend-report.json).
Opaque capability values, invite values, IDs, and fragments are intentionally
excluded from this record and from the saved diagnostic report.

## 7. Privacy, analytics, and advertising

- The final consent audit observed no analytics or advertising provider request
  before consent.
- No optional provider requests were observed after consent because the
  optional provider keys are not configured; this is an honest no-provider
  state, not a fabricated success signal.
- Active typing hides the ad slot while the task is running; ads are reserved
  outside active tasks.
- Privacy copy documents local-first practice, consent-gated analytics, and
  deletion. The live organizer deletion flow was exercised against disposable
  shared data.
- The release contains no new auth UI, runtime AI engine, fake leaderboard,
  fake team/assessment data, or exposed capability material.

The consent evidence is in
[`browser-report.json`](../../artifacts/journey-v4/production/browser-report.json);
the local analytics and E2E gates are included in the validation table above.

## 8. Recovery and rollback anchor

The previous known-good application anchor is
`349990e09e691f394246bcf8ed21001deda8dca8`, with its successful production
deployment recorded by [workflow run 33633176715](https://github.com/drewsebastians/TypingArena/actions/runs/33633176715)
and its public smoke passing 37/37.

No rollback was required: the hotfix addressed the only production defect
found during validation, and the final deployment and live flows are green.
If a regression is later proven, use the established Deploy workflow pinned to
the known-good application SHA or perform a normal source revert. Do not reset
the database, rotate unrelated secrets, or use destructive Git operations as a
rollback mechanism.

## 9. Residual notes

- Supabase Preview remains skipped because it is not configured in the existing
  repository workflow; this did not block the production-target readiness,
  build, deploy, or live-backend checks.
- Optional analytics and ad provider keys remain absent. The product therefore
  preserves its no-provider fallback and consent boundary until an owner
  separately configures those services.
- The expected invalid/revoked invite HTTP 400 is retained as a deliberate
  fail-closed response and is not an unresolved application error.

## 10. Evidence index

- [`docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v4.md`](../blueprint/TypingArena_Integrated_Ultimate_Blueprint_v4.md)
- [`scripts/production-smoke.mjs`](../../scripts/production-smoke.mjs)
- [`scripts/capture-journey-v4-production.mjs`](../../scripts/capture-journey-v4-production.mjs)
- [`scripts/production-live-backend-smoke.mjs`](../../scripts/production-live-backend-smoke.mjs)
- [`artifacts/journey-v4/production/browser-report.json`](../../artifacts/journey-v4/production/browser-report.json)
- [`artifacts/journey-v4/production/live-backend-report.json`](../../artifacts/journey-v4/production/live-backend-report.json)

## 11. Final statement

**PRODUCTION DEPLOYMENT COMPLETE** — the v4 blueprint-driven UX journey and
the shared-attempt serialization hotfix are merged, the final production
commit is deployed at `https://typingarena.click/`, public and browser smoke
checks pass, live shared Team and Assessment flows pass with disposable data
cleaned up, and no critical residual issue remains.
