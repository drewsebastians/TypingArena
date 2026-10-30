# External Action Register

This register separates completed production work from the current Search
Console priority, deferred analytics choices, optional provider setup, and
human validation. Production closure was completed on 2026-09-29; historical
evidence is recorded in [PR #19](https://github.com/drewsebastians/TypingArena/pull/19).

## Completed production closure

| ID | Action | Evidence | Status |
| --- | --- | --- | --- |
| EXT-01 | Apply the production migration chain and enable Anonymous Sign-Ins. | PR #19 records migration `0017_capability_retention_cleanup.sql` applied and anonymous sign-ins enabled. | COMPLETED |
| EXT-02 | Configure the canonical production origin and public Supabase build settings. | Auth Site URL was verified as `https://typingarena.click`; the production readiness gate passed and the production deploy completed successfully. | COMPLETED |
| EXT-03 | Run production public and shared-backend smoke checks. | Public smoke 37/37 and live backend smoke 26/26 passed during PR #19 closure. | COMPLETED |
| EXT-04 | Verify production RLS and capability-retention cleanup. | RLS remained enabled; one daily purge schedule remained active at `17 3 * * *`; cleanup left zero expired, over-retention revoked, or orphan capabilities and four active capabilities attached to valid resources. | COMPLETED |
| EXT-07 | Complete the final operational-closure merge and production release. | PR #19 merged as `be53b071a0922d236995dc9d67bf08b983115d2f`; production Deploy run [36508416755](https://github.com/drewsebastians/TypingArena/actions/runs/36508416755) succeeded. | COMPLETED |

## Provider and API decisions

These actions require owner accounts or provider approval. They are not launch
blockers and are not marked complete without provider evidence.

| ID | Action | Evidence needed | Status |
| --- | --- | --- | --- |
| EXT-05 | Configure PostHog or GA4 behavioral analytics. | Owner decision on 2026-10-30: no behavioral analytics for now; leave keys unset and preserve consent gating. | DEFERRED — OWNER DECISION |
| EXT-06 | Apply for AdSense and publish any required approved disclosures. | Publisher approval and policy review. | OPTIONAL — OWNER CONTROLLED |
| EXT-10 | Verify the TypingArena property in direct Google Search Console, submit the sitemap, and review indexing. | Reuse the verified `https://typingarena.click/` or `sc-domain:typingarena.click` property; submit `https://typingarena.click/sitemap.xml`; record the result. GSC Wizard will not be renewed. | OPEN — PRIORITY; DIRECT ACCOUNT ACCESS REQUIRED |
| EXT-11 | Activate the Tournament API only if an owner chooses to expose it. | Intentional activation, API key handling, and a deployment check; see `docs/api/openapi.yaml`. | OPTIONAL — NOT REQUIRED BY THE UI |

## Post-launch validation and deferred work

| ID | Action | Evidence needed | Status |
| --- | --- | --- | --- |
| EXT-08 | Collect a consented strategic baseline and review retention/cross-mode funnels. | Deferred with behavioral analytics by owner decision on 2026-10-30. Reopen only if the owner later chooses to enable a provider and gather consented data. | DEFERRED — OWNER DECISION |
| EXT-09 | Perform human screen-reader, Safari, real-device, contrast, and Core Web Vitals review. | A dated accessibility/performance log with findings triaged. | OPEN — POST-LAUNCH VALIDATION |

## Current disposition

No pre-launch action remains open. EXT-10 is a current owner priority but
remains open until direct Search Console property verification, sitemap
submission, and indexing review are recorded. The connected GSC Wizard trial
has ended; the owner chose direct Search Console instead.

Behavioral analytics are deferred: EXT-05 provider setup and EXT-08 baseline/
retention review are not planned for now. Leave PostHog/GA4 keys unset and
preserve consent gating. EXT-09 screen-reader, Safari, real-device, contrast,
and Core Web Vitals review remains open and requires human validation. EXT-06
and EXT-11 remain optional owner-controlled actions. These dispositions are
not evidence of a production defect. No provider secret, approval, hosted
result, or strategic metric is claimed without evidence.

For current production facts and environment recovery, see
[`docs/PRODUCTION_HANDOFF.md`](../PRODUCTION_HANDOFF.md).
