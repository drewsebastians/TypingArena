# TypingArena — Grand Batching Plan v2
## Current Goal-First Branch → Integrated Ultimate Blueprint Closure

**Document status:** Canonical execution roadmap  
**Prepared:** 30 August 2026  
**Repository:** `drewsebastians/TypingArena`  
**Public main reviewed:** `b99779bc208c5abd2aa2e67e618927a2db949c42`  
**Goal-First branch reviewed:** `codex/goal-first-wave1 @ 4c9dfdac1b5d7f9c250f4ab7c896b25ac74f664c`  
**Target:** `TypingArena_Integrated_Ultimate_Blueprint_v2.md`

---

# 0. Executive Plan

This plan is current-state-aware. It does not restart from B00 as though Wave 1 never happened.

Wave 1 already implemented substantial Goal-First architecture. The remaining execution path begins by closing the missing reproducibility/database proof, then migrates the remaining route families, aligns competition/social/admin surfaces, closes SEO/analytics/ads/accessibility, and finishes with hosted smoke and independent blueprint traceability.

Critical path:

> **Source/branch reconciliation → reproducible clean install + real DB proof → typing/audio/career route migration → competition/social coherence → creator/admin finalization → Progress/Privacy → SEO/analytics/ads → whole-product accessibility/performance → hosted preview → independent closure → owner merge/deploy → post-launch strategic validation.**

---

# 1. Status Vocabulary

Use only:

- **COMPLETE — PROVEN**: implementation exists and all required acceptance evidence exists.
- **IMPLEMENTED — PROOF PENDING**: code exists but a mandatory proof has not run or is not independently confirmed.
- **PARTIAL**: meaningful implementation exists, but Definition of Done is incomplete.
- **PENDING**: not materially implemented.
- **EXTERNAL ACTION REQUIRED**: cannot be completed with repository work alone.
- **POST-LAUNCH VALIDATION**: requires real traffic/user behavior.

Never call a security-sensitive batch complete if its required DB integration was not executed.

---

# 2. Current Batch Reclassification

| Original batch | Current status | Current reality |
|---|---|---|
| B00 Baseline | COMPLETE — PROVEN | Evidence committed |
| B01 Goal/route contracts | COMPLETE — PROVEN | Goal + route registries/tests |
| B02 Anonymous identity | IMPLEMENTED — PROOF PENDING | Migration 0015 + adapter implemented; DB integration not run |
| B03 Local-first/account retirement | COMPLETE — PROVEN at UI/unit level | Shared production actions depend on B02 proof |
| B04 Global shell | COMPLETE — PROVEN for Wave 1 surfaces | Whole-product consistency remains |
| B05 Goal-First homepage | COMPLETE — PROVEN locally | Real first three engines |
| B06 Task/result/ad boundary | COMPLETE — PROVEN locally | Cross-route rollout incomplete |
| B07 Typing family | PENDING | Deferred |
| B08 Audio active family | PENDING | Deferred |
| B09 Career/Library | PENDING | Deferred |
| B10 Daily/Leaderboard/Seasons | PARTIAL | Features exist; Goal-First/no-account polish remains |
| B11 Friends/Multiplayer | PARTIAL | Features exist; polish/coherence remains |
| B12 Teams/Custom/Assessments | PARTIAL | Capabilities integrated; DB proof/final UX remains |
| B13 Progress/Privacy | PARTIAL | Local-first model substantial; final closure remains |
| B14 SEO/Analytics/Ads | PARTIAL | Foundations exist; integrated closure remains |
| B15 Mobile/a11y/consistency | PARTIAL | Pass VII + Wave 1 cover core, not entire product |
| B16 Full closure | PENDING | Must be final engineering batch |

---

# 3. Governance

## 3.1 Worktree safety

Before continuation run:

```bash
git status --short --branch
git rev-parse HEAD
git branch --show-current
git fetch --all --prune
git rev-parse origin/main
git log --oneline --decorate --graph -n 30
git worktree list
git stash list
```

Do not destroy unrelated work.

## 3.2 Branch ancestry

The reviewed Goal-First branch was built from the Pass VII PR head and is one merge commit behind public `main` while containing its own Goal-First commits.

Before final PR, reconcile it safely with latest `origin/main` using the repository's normal merge/rebase policy.

## 3.3 Minimum gates for every code batch

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Add targeted Playwright for changed flows.

Add DB integration for migration/auth/RLS/RPC/capability/shared-data changes.

## 3.4 Stop-the-line conditions

Stop and fix if:

- direct ranked forgery becomes possible;
- migration chain fails from scratch;
- capability scope leaks;
- active task shows an ad;
- five-minute timing semantics regress;
- static audio breaks;
- `/progress` becomes indexable;
- runtime AI enters output;
- Goal-First engine becomes a mock/fake;
- clean install cannot be reproduced.

---

# 4. R0 — Canonical Blueprint and Branch Reconciliation

**Priority:** P0 documentation/branch hygiene  
**Status:** NEXT

## Objective

Create a single unambiguous source of truth and align branch lineage with current main.

## Work

1. Add:

```text
docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v2.md
docs/blueprint/TypingArena_Grand_Batching_Plan_v2.md
```

2. Preserve historical docs under `docs/goal-first/source/`.
3. Mark historical Goal-First v1 documents as superseded references rather than deleting them.
4. Update README/documentation index to point to canonical v2 docs.
5. Fetch latest main and reconcile the continuation branch safely.
6. Confirm no newer main change conflicts with Wave 1.

## Acceptance

- canonical docs exist;
- no source-of-truth ambiguity;
- branch includes latest main lineage without destructive history changes;
- working tree clean.

---

# 5. R1 — Reproducible Install + Anonymous/Capability DB Proof

**Priority:** P0 / REQUIRED BEFORE MERGE

Wave 1 explicitly left two critical gaps:

- `npm ci` lock mismatch;
- real DB integration not run.

## 5.1 Clean installation

Inspect `package.json`, `package-lock.json`, dependency tree, and the reported `@emnapi/runtime` mismatch.

Resolve the lockfile correctly.

Prove a clean:

```bash
npm ci
```

Do not rely only on pre-existing `node_modules`.

## 5.2 Fresh migration chain

Run a fresh database from migration 0001 through 0015 (or later if fixes are required).

Never edit 0001–0014.

If 0015 needs a fix, add 0016+.

## 5.3 DB integration proof

Must prove old security scenarios plus:

- anonymous profile creation;
- anonymous shared identity;
- authoritative ranked submission;
- direct attempts write denial;
- private history isolation;
- team/custom/assessment management token issue;
- hash-only storage;
- resource/type scope isolation;
- validate/recover;
- rotation/revocation;
- expiry;
- rate limiting;
- join code cannot manage a team;
- candidate invite cannot manage an assessment;
- ownership transfer semantics;
- deletion semantics.

## 5.4 CI fallback

If local Docker/Supabase is unavailable but GitHub Actions can run the stack:

- push a checkpoint;
- run the DB workflow;
- inspect logs;
- fix failures;
- only then mark B02 COMPLETE — PROVEN.

## Deliverable

`docs/goal-first/02_DB_IDENTITY_CAPABILITY_EVIDENCE.md`

---

# 6. R2 — B07 Typing Route-Family Migration

## Scope

- `/typing-test`
- `/typing-test/1-minute`
- `/typing-test/5-minute`
- `/typing-test/indonesian`
- `/tes-mengetik`
- `/data-entry-test`
- `/punctuation-typing-test`

## Objectives

- shared `ToolPageShell`;
- consistent configuration hierarchy;
- real preset behavior;
- shared active lifecycle;
- result hierarchy;
- next-action cards;
- post-result ad boundary;
- related tools;
- useful route-specific explanation;
- EN/ID correctness;
- 320px resilience.

## Strategic requirement

Typing results should deliberately offer a listening/dictation next step where sensible.

## Critical regression gate

The 5-minute route remains a true full-clock endurance test.

---

# 7. R3 — B08 Dictation / Transcription Active Routes

## Scope

- `/dictation`
- `/dictation/english`
- `/dictation/indonesian`
- `/noise-challenge`
- `/transcription-practice`

## Requirements

- shared audio task shell;
- accessible audio controls;
- answer hidden before completion;
- playback metrics preserved;
- no autoplay;
- no active-task ad;
- clear post-result next action;
- dictation→transcription discovery;
- EN/ID correctness;
- desktop/mobile evidence.

## Strategic importance

This is the route family that proves whether TypingArena is differentiated beyond WPM. Treat it as strategically critical.

---

# 8. R4 — B09 Transcription Library + Career Alignment

## Transcription Library

Audit and align:

- language;
- difficulty;
- length;
- topic;
- metadata;
- direct start;
- mobile filters;
- content-quality disclosures where useful;
- discovery ad placements.

## Career Mode

Preserve five tracks:

- data entry;
- office/admin;
- numbers & codes;
- punctuation precision;
- transcription.

Requirements:

- real engines;
- transparent score bands;
- local history;
- no certification claim;
- result→practice next action;
- post-result ads only.

---

# 9. R5 — B10 Competition Coherence

## Daily Arena

- preserve Asia/Jakarta product day;
- no visible account;
- anonymous identity only on shared action;
- nickname when required;
- one clear Start action;
- result then board;
- no active-task ad.

## Leaderboard

- server-accepted-only explanation;
- useful filters;
- mobile scroll/stack affordance;
- view without identity;
- no account CTA.

## Seasons

- current month first;
- archives clearly read-only;
- responsive tables/cards;
- relationship to Daily/Leaderboard clear.

Competition is a retention layer, not the primary product differentiator.

---

# 10. R6 — B11 Friends + Multiplayer

## Friends

- nickname-based;
- deterministic share challenge;
- validating RPC;
- honest casual-integrity limitation;
- comparison/result view;
- no account language.

## Multiplayer

- nickname;
- create/join;
- room code;
- host authority;
- lobby/countdown;
- active race focus;
- evidence-derived final standings;
- host rematch;
- no race ad.

Do not replace the proven multiplayer trust model merely for visual consistency.

---

# 11. R7 — B12 Teams / Custom / Assessments Finalization

**Current status:** PARTIAL

Wave 1 already added management capability links. This batch proves and finishes them.

## Teams

- anonymous create;
- management link generation;
- clear recovery explanation;
- join code + nickname;
- owner/admin/member permissions;
- assignment publishing;
- aggregate dashboard;
- no contact details;
- real engines for assignments;
- no active assignment ad;
- standardized empty/loading/error states.

## Custom Tests

- create without account;
- separate share vs management links;
- unlisted/private semantics;
- sanitation;
- practice-only enforcement;
- recovery;
- no secret analytics;
- no management-state indexing.

## Assessments

Creator:

- anonymous owner;
- module sequence;
- candidate invite;
- management link;
- revoke lifecycle;
- private results.

Candidate:

- no account;
- exact saved modules;
- invalid/not-open/revoked/expired states;
- no ad during modules;
- completion acknowledgement.

## Security gate

Close only after real negative DB scenarios pass.

---

# 12. R8 — B13 Progress / Privacy / Persistence Closure

## Progress

Finalize:

- “Progress on this device”;
- local histories;
- personal bests;
- streak;
- weak keys/bigrams;
- deterministic recommendation;
- recent activity;
- optional nickname for shared boards;
- no account/cross-device promise.

Audit shared-result queue copy. It must clearly mean shared/ranked upload, not cloud backup of ordinary practice.

## Privacy

Finalize:

- local export;
- local deletion;
- shared-data deletion;
- consequences for owned Teams/Custom/Assessments;
- management link explanation;
- analytics/ads disclosures;
- accurate data inventory.

Review whether deleting shared data deletes owned resources and ensure confirmation text/tests match reality.

---

# 13. R9 — B14 SEO and Route Utility Closure

For every indexable route verify:

- useful live task/browse value;
- distinct intent;
- H1/meta description;
- canonical;
- internal links;
- no accidental noindex;
- no duplicate/thin content;
- manage/invite state canonicalized safely;
- no secret token in metadata;
- mobile usefulness.

`/progress` must remain noindex and out of sitemap.

Use the route registry as canonical inventory.

Strategic requirement: major acquisition routes should lead to another useful mode, especially typing→audio.

---

# 14. R10 — Analytics and Strategic Validation Instrumentation

## Objective

Ensure the product can answer the original business thesis after launch.

Required funnels/events should measure:

- organic landing → start;
- start → completion;
- result → next action;
- typing → dictation;
- typing → transcription;
- dictation → transcription;
- Goal-First distribution;
- second exercise/session;
- Daily participation;
- social/share loop;
- Career use;
- D1/D7/D30 where tooling supports it.

Create:

`docs/analytics/STRATEGIC_VALIDATION_MEASUREMENT_PLAN.md`

No fabricated thresholds.

No PII, typed content, answer text, auth UUID, or management secret.

---

# 15. R11 — Ads / AdSense Pre-Application Readiness

## Objective

Maximize safe monetizable inventory without degrading the skill product.

Classify every route:

- active-task ad forbidden;
- post-result eligible;
- discovery eligible;
- outside-task eligible;
- no-ad.

Validate:

- no ad container inside active engines;
- no accidental-click adjacency;
- stable dimensions;
- dark/light contrast;
- mobile placement;
- consent behavior;
- no fake publisher IDs;
- ads inactive when real configuration absent.

AdSense account approval/publisher IDs remain external.

---

# 16. R12 — B15 Whole-Product Accessibility / Mobile / Performance / Consistency

Required viewports:

- 1440×900;
- 1280×800;
- 768×1024;
- 390×844;
- 375×667;
- 320×568.

Audit every route family for:

- keyboard navigation;
- visible focus;
- dialogs/drawers;
- 44px touch targets where appropriate;
- no horizontal page overflow;
- table scroll affordance;
- heading/label structure;
- dynamic `<html lang>`;
- dark continuity;
- loading/empty/error states;
- active-task focus;
- audio accessibility;
- ad CLS/layout shift.

Performance:

- clean chunk audit;
- homepage lazy workspaces;
- no unnecessary heavy dependency;
- static export preserved.

---

# 17. R13 — Hosted Preview / Production Readiness

Before owner merge/deploy decision:

- review production env variables;
- enable anonymous sign-ins in target Supabase when owner authorizes;
- plan/apply migration 0015+ in safe hosted environment;
- smoke shared flows;
- verify canonical domain config;
- analytics consent behavior;
- ads inactive without real IDs.

Hosted smoke should cover:

- Goal-First root;
- typing;
- dictation audio;
- transcription;
- ranked/Daily shared submission;
- leaderboard read;
- team create/join/manage recovery;
- custom create/share/manage recovery;
- assessment create/invite/candidate;
- shared deletion;
- `/progress` noindex;
- sitemap/robots;
- no runtime AI.

If only production exists and applying migration is risky, do not do it without explicit owner authorization.

---

# 18. R14 — B16 Blueprint Traceability and Independent Red-Team

Create:

```text
docs/closure/
  BLUEPRINT_TRACEABILITY_MATRIX.md
  FINAL_SECURITY_REVIEW.md
  FINAL_UX_ACCESSIBILITY_REVIEW.md
  FINAL_SEO_MONETIZATION_REVIEW.md
  EXTERNAL_ACTION_REGISTER.md
  FINAL_READINESS_REPORT.md
```

Every integrated-blueprint requirement should map to:

- code;
- test;
- browser evidence;
- DB evidence;
- external action;
- post-launch validation.

Red-team for reasons the product should not launch:

- broken no-account flows;
- capability leakage;
- misleading integrity claims;
- thin SEO pages;
- active-task ads;
- mobile failures;
- inaccessible dialogs/tables;
- content/audio quality problems;
- privacy mismatch;
- placeholder production state;
- old account wording;
- docs/repo divergence;
- audio not sufficiently central to journeys.

Closure requires zero unresolved launch blockers.

---

# 19. R15 — Owner-Controlled Merge and Deployment

Codex may prepare branch/PR if authorized.

Do not auto-merge or production-deploy unless explicitly requested.

Owner decision should consider:

- repository gates green;
- DB proof green;
- preview/hosted smoke green;
- red-team blockers resolved;
- external migration/config actions understood.

---

# 20. R16 — Post-Launch Strategic Validation

**Status:** POST-LAUNCH VALIDATION

Measure:

- typing-only vs audio-engaged users;
- typing→dictation conversion;
- typing→transcription conversion;
- repeat audio use;
- D1/D7 retention by mode engagement;
- exercises/session;
- Daily participation;
- SEO landing behavior;
- ad performance without task degradation.

Do not declare the business thesis validated from code completion alone.

---

# 21. Dependency Map

```text
R0 Canonical docs + branch reconciliation
 ↓
R1 Clean install + DB identity/capability proof
 ↓
R2 Typing routes ─────┐
R3 Audio routes ──────┼─→ R4 Career/Library
                      ↓
R5 Competition
 ↓
R6 Friends/Multiplayer
 ↓
R7 Teams/Custom/Assessments
 ↓
R8 Progress/Privacy
 ↓
R9 SEO/route utility
 ↓
R10 Strategic analytics
 ↓
R11 AdSense pre-application
 ↓
R12 Whole-product a11y/mobile/performance
 ↓
R13 Hosted preview readiness
 ↓
R14 Independent closure
 ↓
R15 Owner merge/deploy
 ↓
R16 Post-launch thesis validation
```

R2 and R3 may run in parallel only if file ownership is clean.

---

# 22. Batch Evidence Template

```md
# Batch Rx Evidence

Baseline SHA:
Ending SHA:
Branch:

## Scope completed
- ...

## Files changed
- ...

## Product behavior
- ...

## Security/data behavior
- ...

## Validation
- npm ci:
- lint:
- typecheck:
- unit:
- build:
- targeted E2E:
- full E2E:
- DB integration:
- production readiness:
- no-runtime-AI:

## Browser evidence
- desktop:
- mobile:
- 320 stress:

## External actions
- ...

## Remaining items
- only explicitly assigned later work
```

---

# 23. Final Engineering Closure Conditions

Engineering closure requires:

- clean reproducible install;
- fresh migration chain through latest;
- DB integration green;
- lint/typecheck/unit/build green;
- desktop/mobile Playwright green;
- no-runtime-AI green;
- production readiness green;
- no-account coherence across all shared routes;
- capability recovery proven;
- no active-task ads;
- SEO/canonical/noindex green;
- accurate privacy;
- hosted shared-flow smoke green or explicit external blocker;
- blueprint traceability complete;
- red-team blocker count = 0.

Business-strategy closure additionally requires post-launch user data.
