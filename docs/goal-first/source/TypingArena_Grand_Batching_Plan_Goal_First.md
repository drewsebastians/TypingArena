# TypingArena — Grand Batching Plan
## From Current Repository to Option 2 “Goal First” Ultimate Blueprint

**Plan version:** 1.0  
**Prepared:** 2026-08-30  
**Repository:** `drewsebastians/TypingArena`  
**Baseline inspected:** `main` @ `9109fe824ca8b241f3d22129f094f0ee15c51ccd`  
**Target specification:** `TypingArena_Ultimate_Blueprint_Goal_First.md`  
**Figma reference:** https://www.figma.com/design/vM7Ncr9GRINv0rwbW1n6Qd

---

# 0. Executive Plan

The Goal-First migration should be executed through **small, dependency-aware, regression-gated batches**.

The current repository is already functionally broad and security-hardened. The plan therefore protects the existing engineering baseline while changing the product architecture in the correct dependency order.

Critical path:

> **Baseline lock → target contracts → anonymous shared identity → local-first/no-account persistence → global shell → Goal-First homepage → shared task/result/ad primitives → route-family migrations → competition → no-account creator/admin recovery → Progress/Privacy → SEO/Analytics/Ads → mobile/accessibility consistency → full closure.**

The no-account identity work is deliberately early. Building the new visual UI first while leaving magic-link/account assumptions underneath Teams, Custom Tests, Assessments, ranked submissions, and Progress would create avoidable rework and potentially unsafe authorization shortcuts.

---

# 1. Migration Governance

## 1.1 Baseline to protect

At the inspected baseline:

- `main` = `9109fe824ca8b241f3d22129f094f0ee15c51ccd`;
- no open PRs were found;
- historical closure/readiness branches remain;
- migrations `0001`–`0014` exist;
- historical freeze evidence reports 162 unit/component tests, 23 Playwright desktop + 23 mobile specs, and 103 DB assertions;
- production readiness and smoke tooling exist;
- previous functional work was considered complete before this Goal-First UI/UX migration.

If `main` advances before implementation begins, **Batch 00 must re-baseline** the plan before any production changes.

## 1.2 Branching strategy

Recommended branch naming:

```text
goal-first/b00-baseline
goal-first/b01-contracts
goal-first/b02-anonymous-identity
...
```

Each batch should normally land as one reviewable PR, or one clearly bounded implementation branch containing logically separated commits.

Do not maintain the entire migration as one giant long-lived branch.

## 1.3 Required gates for every batch

Minimum:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Also required when relevant:

- targeted Playwright for every changed route;
- DB integration for migration/auth/RLS/RPC/shared-feature changes;
- no-runtime-AI checks remain green;
- inspect git diff for unrelated changes;
- no accidental formatting churn across untouched domain files.

## 1.4 Stop-the-line conditions

Stop and fix before continuing if any of these occur:

- ranked results can bypass authoritative RPC;
- five-minute timer semantics regress;
- static audio stops resolving;
- an ad renders inside an active task;
- `/progress` becomes indexable;
- visible Login / Sign up / Account UI reappears after account retirement;
- an old migration is edited;
- static export breaks;
- runtime AI/TTS/ASR enters production output;
- a management/recovery token appears in analytics, logs, canonical URLs, sitemap, or public response data.

---

# 2. Batch Dependency Map

```text
B00  Baseline & evidence lock
  ↓
B01  Target contracts + route/goal registry
  ↓
B02  Anonymous shared identity foundation
  ↓
B03  Local-first persistence + visible account retirement
  ↓
B04  Global shell/navigation/design primitives
  ↓
B05  Goal-First homepage
  ↓
B06  Shared task lifecycle + result + safe-ad boundary
  ├────────────────┬────────────────┐
  ↓                ↓                ↓
B07 Typing       B08 Audio       B09 Career/Library
  └────────────────┴────────────────┘
                   ↓
B10  Daily Arena + Leaderboard + Seasons
                   ↓
B11  Friends + Multiplayer
                   ↓
B12  Teams + Custom + Assessments no-account ownership
                   ↓
B13  Progress + Privacy final model
                   ↓
B14  SEO + Analytics + Ads + production contracts
                   ↓
B15  Mobile + accessibility + consistency polish
                   ↓
B16  Full regression + security closure + docs + launch readiness
```

B07–B09 may run in parallel only after B06 is merged and only when file ownership is cleanly separated.

---

# 3. Batch 00 — Baseline, Inventory, and Safety Lock

## Objective

Create a verified starting point before changing the previously frozen product.

## Scope

1. Fetch latest `main`.
2. Record exact HEAD SHA.
3. Confirm working tree state.
4. If local changes exist, inventory them; do not discard unrelated work.
5. Capture route inventory.
6. Capture component inventory.
7. Capture current migration chain.
8. Run all existing gates.
9. Capture representative screenshots of the current UI.
10. Record build warnings and bundle observations.
11. Run deployed-site smoke if available.

## Required inspection targets

- `package.json`
- `src/app/**`
- `src/components/**`
- `src/lib/**`
- `supabase/migrations/**`
- `.github/workflows/**`
- `e2e/smoke.spec.ts`
- production readiness/smoke scripts
- README / ADRs / production docs.

## Deliverable

Create:

`docs/goal-first/00_BASELINE.md`

Include:

- baseline SHA;
- test counts;
- route list;
- account/auth dependencies;
- backend/config status;
- known limitations;
- pre-existing uncommitted work if any.

## Acceptance gate

- no production behavior changes;
- baseline tests/build documented;
- no unresolved repository-state ambiguity.

---

# 4. Batch 01 — Goal/Route Contracts and Design Skeleton

## Objective

Create shared contracts that later batches can use without yet changing core domain behavior.

## Why this batch exists

The current code maintains route knowledge in multiple places: Header, Homepage, Sitemap, route files, and tests. Goal First needs one coherent information architecture and one goal mapping source.

## Scope

### 4.1 Route registry

Create a central registry such as:

`src/lib/routeRegistry.ts`

Recommended fields:

```ts
interface RouteDefinition {
  id: string;
  path: string;
  title: string;
  category: "typing" | "dictation" | "practice" | "arena" | "utility";
  primaryGoal: GoalId | null;
  indexable: boolean;
  activeTask: boolean;
  related: string[];
}
```

### 4.2 Goal registry

Create:

`src/lib/goals.ts`

Define exactly six canonical goals:

- type-faster;
- listen-better;
- transcribe-accurately;
- prepare-for-work;
- compete;
- teach-assess.

Each goal defines:

- UI label;
- description;
- CTA;
- default workspace/preset or destination;
- analytics ID.

### 4.3 Shared component interfaces

Create minimal primitives/contracts:

- `GoalCard`
- `GoalWorkspace`
- `ToolPageShell`
- `ActiveTaskBoundary`
- `ResultSection`
- `NextStepCard`.

They may initially be unused or used only in test fixtures.

### 4.4 Consistency tests

Add tests proving:

- no duplicate route paths;
- all sitemap routes exist in the registry;
- `/progress` is noindex;
- every goal points to a valid workspace/destination;
- related route IDs resolve.

## Likely files

- new `src/lib/routeRegistry.ts`
- new `src/lib/goals.ts`
- new `src/components/goals/*`
- new `src/components/tool/*`
- tests.

## Explicit non-goals

- no homepage rewrite yet;
- no Header rewrite yet;
- no auth migration yet.

## Acceptance gate

Current user-visible UI remains materially unchanged, while the new contracts are tested and ready.

---

# 5. Batch 02 — Anonymous Shared Identity Foundation

**Priority:** P0 architecture/security

## Objective

Replace the technical prerequisite “user must visibly sign in” with “shared features silently establish a pseudonymous anonymous backend identity.”

## Scope

### 5.1 Supabase anonymous sign-in

Enable anonymous sign-in in local/test configuration and document the corresponding production activation.

Implementation must use actual Supabase Anonymous Auth, not an arbitrary browser-generated user ID.

### 5.2 Forward migration

Create the next migration, expected to begin with `0015_*` after re-baselining.

Do not edit `0001`–`0014`.

Migration objectives:

- support Auth users without email in profile creation;
- audit policies/RPCs for hidden email assumptions;
- preserve authenticated-role RLS behavior for anonymous Auth users;
- preserve direct-write revocations;
- preserve historical account-originated rows.

### 5.3 Shared identity adapter

In `src/lib/remote.ts` or a new helper layer, add a contract equivalent to:

```ts
getSharedIdentity()
ensureSharedIdentity()
getSharedUserId()
```

`ensureSharedIdentity()`:

1. checks backend configuration;
2. reuses existing session;
3. otherwise creates anonymous Auth session;
4. ensures profile availability;
5. returns stable user ID;
6. contains no visible login ceremony.

### 5.4 Nickname infrastructure

Add helper behavior for:

- local nickname;
- shared profile nickname;
- sanitization;
- first-use prompt support.

### 5.5 Keep old email-auth implementation temporarily

Do not delete old account functions yet. B02 introduces and proves the replacement. B03 removes the old visible path after the new one is stable.

## DB integration requirements

Prove:

- anonymous Auth session works;
- profile creation works without email;
- anonymous identity can call intended server RPC;
- direct attempts INSERT/UPDATE remain denied;
- valid ranked evidence is still server-recomputed;
- anonymous user cannot read another user's private data;
- current non-anonymous behavior does not regress.

## Likely files

- `supabase/config.toml`
- `supabase/migrations/0015_*.sql`
- `src/lib/remote.ts`
- new `src/lib/sharedIdentity.ts` if extracted
- DB integration script/tests
- runbook docs.

## Acceptance gate

All existing security scenarios and new anonymous-identity scenarios pass.

---

# 6. Batch 03 — Local-First Persistence and Visible Account Retirement

**Priority:** P0 product contract

## Objective

Make the no-account promise true at the data and UI level before the new homepage advertises it.

## Scope

### 6.1 Establish persistence matrix

Implement/document this target:

| Artifact | Local | Server |
|---|---:|---:|
| Ordinary practice result | Yes | Not required |
| Ranked attempt | Yes | Yes |
| Daily ranked attempt | Yes | Yes |
| Team assignment evidence | Yes | Yes |
| Multiplayer authoritative final result | Optional local | Yes |
| Candidate assessment summary | Optional local | Yes |
| Custom practice attempt | Yes | Not ranked; server only where sharing requires |

### 6.2 Refactor sync assumptions

`src/lib/sync.ts` should no longer imply that every practice result is waiting for account cloud history.

Target:

- local practice succeeds completely without remote sync;
- ranked/shared persistence is explicit and purpose-specific;
- network failure never destroys local practice history.

### 6.3 Remove `AccountPanel` from Progress

Remove visible:

- email input;
- magic-link CTA;
- sign-in state;
- sign-out;
- “Delete account”;
- import-local-history-to-account;
- cross-device sync promise.

### 6.4 Replace deletion controls

Add separate flows:

- clear local progress;
- delete shared anonymous data for current device identity.

### 6.5 Analytics cleanup

Stop emitting account-login/signout/migration events in normal production flow.

Add anonymous identity lifecycle events without identifiers or PII.

### 6.6 Cleanup only after proof

When replacement is fully tested:

- delete `AccountPanel.tsx` if unreferenced;
- remove unused email-auth functions;
- remove unused account hydration/migration code;
- retain backward-compatible DB structures where historical data still depends on them.

## Tests

- ordinary practice works with backend unconfigured;
- Progress works with backend unconfigured;
- no email field rendered;
- no login/account CTA rendered;
- local history remains after reload;
- shared action can still persist via anonymous identity.

## Acceptance gate

Repository-wide production-surface check proves no visible Login / Sign up / Account / magic-link UI remains.

---

# 7. Batch 04 — Global Shell, Navigation, and Design Primitives

## Objective

Implement the Goal-First shell without yet rewriting every route's business logic.

## Scope

### 7.1 Header IA

Replace the current long flat nav with:

- Typing Test
- Dictation
- Practice
- Arena
- Progress
- More
- language switch
- streak.

No email/account/username identity in the global header.

### 7.2 Desktop category menus

Use the route registry to populate accessible menus.

### 7.3 Mobile menu

Replace horizontal route scrolling with a real drawer/dialog.

Requirements:

- keyboard accessible;
- focus moved into menu on open;
- focus returned to opener on close;
- Escape closes;
- categories grouped;
- no body horizontal overflow.

### 7.4 Footer

Align footer links with the simplified IA and the no-runtime-AI/no-account positioning.

### 7.5 Design primitives

Standardize:

- content width;
- neutral backgrounds;
- amber accent;
- border/radius;
- pills/buttons;
- spacing;
- task/result/ad containers.

Keep Geist unless a separately approved visual decision changes it.

## Likely files

- `src/components/Header.tsx` or replacement shell components
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/lib/i18n.ts`
- route registry
- shell tests.

## Acceptance gate

All existing routes remain reachable after the navigation rewrite.

---

# 8. Batch 05 — Goal-First Homepage

## Objective

Implement the approved Option 2 homepage as a real product experience, not a static marketing mockup.

## Scope

### 8.1 Root hierarchy

Replace current root sequence:

- old hero;
- immediate TypingTestPanel;
- SkillProfile;
- giant tool grid;

with:

- Goal-First question;
- six goal cards;
- contextual goal workspace;
- 3-skill explanation;
- Train → Improve → Compete → Prove;
- Explore more section.

### 8.2 Direct real workspaces

The following goals must launch real engines on `/`:

- Type Faster → `TypingEngine`;
- Listen Better → `DictationEngine`;
- Transcribe Accurately → `TranscriptionEngine`.

Do not use fake demo cards.

### 8.3 Higher-order goals

- Prepare for Work → Career track teaser/destination;
- Compete → Daily Arena primary + secondary competition links;
- Teach / Assess → Teams + Assessments choices.

### 8.4 Lazy loading

Do not preload all three heavy engines and all content families unnecessarily. Load the selected workspace efficiently.

### 8.5 Analytics

Implement Goal-First selection/start events.

### 8.6 Responsive behavior

Desktop:

- 3×2 goal grid;
- wide workspace.

Mobile:

- one-column goals;
- stacked workspace;
- no horizontal overflow.

## E2E acceptance

Desktop + mobile:

- all six goals selectable;
- first three start real tasks;
- at least one direct homepage task can complete and produce a real result;
- keyboard path works;
- no account CTA visible.

---

# 9. Batch 06 — Shared Task Lifecycle, Result Pattern, and Safe Ad Boundary

## Objective

Create the reusable route pattern before migrating route families.

## Scope

### 9.1 Common lifecycle

Standardize:

```text
configuring → ready → active → completing → result
```

Expose lifecycle state to surrounding page/shell.

### 9.2 `ActiveTaskBoundary`

Responsibilities:

- expose active/inactive state;
- provide focus-mode styling hooks;
- suppress monetization;
- optionally protect accidental route/navigation changes if an active task requires it.

### 9.3 Safe ads

Evolve/wrap `AdSlot` into `SafeAdSlot` behavior.

Required invariant:

> If any parent task is active, no ad markup is rendered inside that task boundary.

### 9.4 Unified result pattern

Create consistent:

- primary score;
- detail metrics;
- weaknesses;
- personal-best state where relevant;
- next action;
- related tool;
- post-result ad.

### 9.5 `ToolPageShell`

Standardize:

- H1/intro;
- config;
- task;
- result;
- explanation;
- related action.

## Tests

- SafeAdSlot active suppression;
- result state transitions;
- task completion lifecycle;
- no engine scoring duplication.

## Acceptance gate

No core engine semantics changed.

---

# 10. Batch 07 — Typing Route Family

## Objective

Migrate all see→type routes onto the Goal-First tool shell.

## Routes

- `/typing-test`
- `/typing-test/1-minute`
- `/typing-test/5-minute`
- `/typing-test/indonesian`
- `/tes-mengetik`
- `/data-entry-test`
- `/punctuation-typing-test`

## Scope

1. Shared H1/config/task/result/explanation layout.
2. Route presets initialize real configuration.
3. Preserve scoring version and integrity metadata.
4. Preserve paste/focus/burst handling.
5. Preserve true five-minute full-clock semantics.
6. Standardize result/next action.
7. Post-result ads only.
8. Route-specific explanatory copy.
9. Correct English/Indonesian wording.

## Target regression coverage

- 30s/60s timer behavior;
- five-minute stream/full clock;
- Indonesian corpus route;
- numeric mode;
- punctuation mode;
- paste blocking;
- keyboard access;
- no active-task ad.

## Acceptance gate

All existing typing-engine tests remain green and route-specific E2E passes on desktop/mobile.

---

# 11. Batch 08 — Dictation and Transcription Active Routes

## Objective

Migrate hear→type and transcription workspaces.

## Routes

- `/dictation`
- `/dictation/english`
- `/dictation/indonesian`
- `/noise-challenge`
- `/transcription-practice`

## Scope

1. Shared audio task shell.
2. Accessible audio controls.
3. Transcript hidden before submission.
4. Playback analytics preserved.
5. Noise Challenge retains noise tiers.
6. Transcription retains longer editor/full-clip semantics.
7. Unified result and next action.
8. Post-result safe ads.
9. Correct EN/ID content.

## Tests

- static audio resolves;
- playback reducer behavior;
- replay/pause/seek metrics;
- EN/ID clip paths;
- no autoplay;
- no ad during active audio task;
- result scoring unchanged.

---

# 12. Batch 09 — Transcription Library and Career Mode

## Objective

Migrate practice/discovery surfaces that are not core competition.

## Routes

- `/transcription-library`
- `/career`

## Transcription Library scope

- language filter;
- difficulty filter;
- length filter;
- topic filter;
- reviewed clip cards;
- direct start;
- mobile-friendly filter behavior;
- no AI wording.

## Career scope

Preserve five tracks:

- Data Entry;
- Office / Admin;
- Numbers & Codes;
- Punctuation Precision;
- Transcription.

Target UX:

- track cards;
- job relevance;
- module/time expectation;
- real runner;
- transparent score bands;
- “not certification” disclosure;
- local history;
- next recommendation;
- post-track ad only.

## Acceptance gate

Career continues using real engines and existing scoring/band logic.

---

# 13. Batch 10 — Daily Arena, Leaderboard, and Seasons

## Objective

Align core competitive surfaces with the no-account shared identity model.

## Routes

- `/daily-arena`
- `/leaderboard`
- `/seasons`

## Daily Arena

- viewable without shared identity;
- `ensureSharedIdentity()` only when needed for a shared/ranked action;
- prompt nickname if absent;
- no sign-in copy;
- preserve Asia/Jakarta challenge binding;
- preserve one-ranked-daily rule;
- no ad during challenge;
- result then Daily board.

## Leaderboard

- mode/language/duration filters;
- server-accepted results only;
- readable rank table;
- personal placement if current anonymous identity qualifies;
- no login prompt.

## Seasons

- current month first;
- archived ladders;
- read-only archive clarity;
- consistent competition links.

## DB gate

Re-prove:

- anonymous session cannot forge ranked row;
- server recomputation unchanged;
- official ranked config binding unchanged;
- Daily date/version checks unchanged.

---

# 14. Batch 11 — Friend Challenges and Multiplayer

## Objective

Finish lightweight social competition under Goal First.

## Friends scope

- nickname-first flow;
- deterministic challenge creation;
- share link;
- same exercise for recipient;
- validating result RPC;
- comparison/result view;
- casual-integrity limitation still disclosed honestly.

## Multiplayer scope

- nickname;
- Create room / Join room;
- room code;
- lobby;
- host control;
- countdown;
- active race focus state;
- no ads during race;
- validated final board;
- host rematch.

## Acceptance gate

Existing multiplayer host-token authority and evidence-derived final results remain intact.

---

# 15. Batch 12 — Teams, Custom Tests, and Employer Assessments: No-Account Ownership

**Priority:** P0/P1 security-sensitive  
**Recommended split if needed:** B12A capability layer, B12B Teams/Custom, B12C Assessments

## Objective

Complete the most structurally significant no-account migration: durable creator/admin features that currently rely on account ownership.

## 15.1 Capability-token backend layer

Add forward migration(s) after the current chain.

Required properties:

- cryptographically strong token;
- hash-only DB storage;
- one-resource scope;
- rotate/revoke support;
- rate-limited recovery;
- no public selection;
- no analytics/logging.

Server operations should support conceptually:

- issue management capability;
- validate capability;
- rotate capability;
- revoke capability;
- reattach/recover management on a new anonymous identity where policy allows.

## 15.2 Teams

### Create

1. ensure anonymous shared identity;
2. create team;
3. generate join code;
4. generate management/recovery capability;
5. display/save management link;
6. open owner dashboard.

### Join

1. nickname;
2. join code;
3. ensure anonymous identity;
4. join membership;
5. assignments available.

### Preserve

- owner/admin/member authorization;
- member cannot publish admin assignment;
- real assignment evidence binding;
- aggregate dashboard;
- no member email exposure.

## 15.3 Custom Tests

- anonymous creator;
- sanitized title/passage;
- unlisted practice link;
- management/recovery capability;
- creator controls without email;
- custom attempts remain unranked by server policy.

## 15.4 Employer Assessments

### Creator/admin

- anonymous owner;
- create saved module sequence;
- candidate invite token;
- management/recovery capability;
- private results;
- revoke invite;
- no “sign in on Progress” copy.

### Candidate

- candidate invite only;
- no account;
- exact saved modules;
- lifecycle states invalid/not-open/revoked/expired preserved;
- no ads during modules;
- server-validated summary.

## Mandatory DB integration

Prove:

- intended management token succeeds;
- token for another resource fails;
- revoked token fails;
- rotated old token fails;
- candidate invite cannot administer assessment;
- team join code cannot become owner capability;
- ordinary member cannot publish owner/admin assignment;
- recovery does not expose owner UUID/token hash;
- rate limiting works;
- direct-write protections remain closed.

## Acceptance gate

Do not merge this batch without fresh-stack DB integration success.

---

# 16. Batch 13 — Progress and Privacy Final Model

## Objective

Make the local-first/no-account promise coherent across utility pages.

## Progress — `/progress`

Target:

- title “Progress on this device”;
- local typing/dictation/transcription/career summary;
- streak;
- personal bests;
- weak keys/bigrams;
- recent activity;
- deterministic next recommendation;
- local export;
- clear local data.

Remove residual:

- signed-in status;
- account sync banners;
- import/migrate history language;
- email/account UI.

## Privacy — `/privacy`

Explain:

- device-local history;
- anonymous shared identity;
- ranked/shared server data;
- nickname/public results;
- analytics consent;
- advertising rules;
- management/recovery capabilities;
- local deletion;
- shared-data deletion.

Add a server-backed **Delete shared data from this device identity** action where shared identity exists.

## SEO gate

- `/progress` remains noindex;
- `/progress` stays out of sitemap.

---

# 17. Batch 14 — SEO, Analytics, Advertising, and Production Contracts

## Objective

Reconcile cross-cutting production systems after the main UX/identity migration.

## 17.1 SEO

- generate/validate sitemap against route registry;
- self-canonical per static route;
- invite/manage/query state canonicalizes to base route;
- `/progress` noindex;
- distinct metadata/content for each indexable tool route;
- no thin Goal URLs.

## 17.2 Analytics

- add Goal-First funnel events;
- retire account events;
- prohibit management tokens;
- prohibit typed text/assessment answers;
- maintain consent gating.

## 17.3 Ads

Audit every route:

- allowed slot classification;
- no active-task ad;
- no candidate-assessment module ad;
- reserved dimensions where relevant;
- no-config clean state.

## 17.4 Production readiness

Extend readiness checks for:

- Goal-First homepage markers;
- no account/login UI markers;
- no runtime AI;
- route/canonical hygiene;
- no placeholder configuration.

## 17.5 Production smoke matrix

Classify every route by:

- indexable/noindex;
- active task/no task;
- ad eligible/not eligible;
- backend required/optional;
- shared identity required/optional.

## Acceptance gate

Production build and static output satisfy all cross-cutting rules.

---

# 18. Batch 15 — Mobile, Accessibility, and Cross-Route Consistency

## Objective

Perform one dedicated interaction-quality pass after all major pages use the new architecture.

## Mobile audit

Validate approximately 390 px / Pixel-class layout:

- no horizontal overflow;
- goal cards stack cleanly;
- setup controls wrap cleanly;
- active editors remain usable;
- leaderboards remain readable;
- team/admin controls fit;
- candidate assessment fits;
- menu handles all grouped destinations.

## Accessibility audit

- focus order;
- visible focus;
- menu focus trap;
- Escape close;
- labels;
- audio control names;
- result/status announcements;
- reduced motion;
- color-independent state indicators;
- touch targets;
- keyboard-only core flows.

## Cross-route consistency audit

Every route must be checked for:

- correct shell;
- correct H1 hierarchy;
- appropriate config pattern;
- active-task focus state;
- result pattern;
- CTA tone;
- safe ads;
- no account wording;
- useful related next action.

## Deliverable

Create:

`docs/goal-first/UX_CONSISTENCY_MATRIX.md`

with every route marked PASS/FAIL and evidence.

## Acceptance gate

No unresolved P0/P1 UX/accessibility issues across desktop and mobile.

---

# 19. Batch 16 — Final Regression, Security Closure, Documentation, and Launch Readiness

## Objective

Prove the Goal-First migration achieved the Ultimate Blueprint without losing the repository's previous engineering guarantees.

## 19.1 Full application gates

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run serve:static
npm run test:e2e
```

Run production readiness checker.

## 19.2 Full fresh-stack DB gate

Run all migrations from `0001` through the new final migration against a fresh database.

Do not rely only on upgrading an already-mutated development database.

Run the full DB integration suite.

## 19.3 Migration audit

Confirm:

- migration order correct;
- no historical migration modified;
- fresh reset succeeds;
- anonymous Auth assumptions documented;
- capability grants least privilege;
- deletion/cleanup semantics explicit.

## 19.4 Forbidden-pattern audit

Search source and production output for:

- visible email magic-link UI;
- Login / Sign up / Account CTA;
- `speechSynthesis`;
- AI/ASR/TTS runtime endpoints;
- direct attempts inserts;
- management-token logging;
- token state in sitemap/canonical;
- placeholder domains/secrets.

Documentation may mention prohibited/historical behavior only when clearly explanatory.

## 19.5 Production smoke

Against deployed target, verify:

- root Goal-First UI;
- representative typing flow;
- dictation static audio;
- transcription;
- Progress noindex;
- leaderboard;
- anonymous shared action;
- Teams create/join if backend enabled;
- candidate Assessment invite using safe test fixture if available;
- sitemap/robots/canonical;
- no account UI;
- no runtime AI leakage.

## 19.6 Documentation closure

Update:

- `README.md`
- trust/identity architecture documentation;
- production handoff;
- production launch runbook;
- production smoke matrix;
- completion evidence.

Recommended new ADR:

`docs/ADR-005-no-account-anonymous-identity.md`

It should explain:

- why visible accounts were removed;
- anonymous Auth implementation;
- local-first history;
- management/recovery capability model;
- data deletion;
- trade-offs and lost-browser-state recovery.

## 19.7 Historical completion report

Do not erase history.

Either:

- mark the previous `BLUEPRINT_COMPLETION_REPORT.md` as pre-Goal-First historical evidence and create a new report; or
- add a clear supersession notice plus a new Goal-First completion report.

Recommended new file:

`GOAL_FIRST_COMPLETION_REPORT.md`

## Final acceptance gate

The migration is complete only when every checkbox in the Ultimate Blueprint Definition of Done has evidence.

---

# 20. Batch Evidence Template

Every batch should leave evidence using a consistent structure:

```md
# Batch XX Evidence

Baseline SHA:
Target branch:
Final SHA:

## Scope
- ...

## Files changed
- ...

## User-visible changes
- ...

## Security/data changes
- ...

## Tests
- lint: PASS
- typecheck: PASS
- unit: PASS (.../...)
- build: PASS
- targeted E2E: PASS (.../...)
- DB integration: PASS / N/A

## Manual checks
- desktop:
- mobile:
- keyboard:
- ad placement:

## Known limitations
- none / explicit list

## Carry-forward items
- only items assigned to a named later batch
```

Never use “will fix later” without assigning the item to an explicit later batch.

---

# 21. Suggested File-Ownership Boundaries

| Batch | Primary ownership |
|---|---|
| B01 | goal/route registry + new primitives |
| B02 | Supabase config/migration + identity adapter |
| B03 | history/sync/account retirement |
| B04 | header/layout/footer/i18n |
| B05 | root page + goal components |
| B06 | tool shell/result/ad primitives |
| B07 | typing routes/panels |
| B08 | dictation/transcription active routes |
| B09 | transcription library + career |
| B10 | daily/leaderboard/seasons |
| B11 | friends/multiplayer |
| B12 | teams/custom/assessments + capability migrations |
| B13 | progress/privacy |
| B14 | SEO/analytics/ads/readiness/smoke |
| B15 | cross-route UX/a11y tests + small fixes |
| B16 | docs/evidence/final closure; only necessary code fixes |

If a batch must touch a file primarily owned by a later batch, keep the change minimal and record why.

---

# 22. Risk Register

## R1 — Anonymous Auth treated as unauthenticated

**Risk:** Current policies/RPCs expect authenticated role/session.  
**Mitigation:** Use Supabase Anonymous Auth, not browser UUIDs. Prove RLS/RPC behavior in B02 before UI migration.

## R2 — Teams/Custom/Assessments become unrecoverable after browser data loss

**Risk:** Removing email accounts removes familiar recovery.  
**Mitigation:** Resource-scoped management/recovery capabilities in B12 plus explicit one-time save warning.

## R3 — Capability tokens create a new authorization bypass

**Risk:** Bearer secrets can be mishandled.  
**Mitigation:** Hash-only storage, resource scope, rotation, revocation, rate limiting, negative DB tests, analytics redaction.

## R4 — Old sync logic remains account-coupled

**Risk:** Removing AccountPanel but retaining hidden cloud-history assumptions causes silent errors.  
**Mitigation:** B03 explicitly rewrites persistence semantics before new homepage rollout.

## R5 — Homepage bundle becomes too heavy

**Risk:** Direct typing + dictation + transcription may preload multiple engines/content sets.  
**Mitigation:** Lazy-load selected goal workspace; inspect bundle output in B05/B06.

## R6 — Figma imitation replaces functionality with mock UI

**Risk:** Wireframe looks correct but exercises are fake.  
**Mitigation:** Hard rule: reuse real engines; E2E must complete real tasks from homepage.

## R7 — Ads leak into active tasks

**Mitigation:** Central active-task boundary + SafeAdSlot tests + E2E assertions.

## R8 — SEO regression from navigation simplification

**Mitigation:** Route registry, sitemap consistency tests, B14 SEO reconciliation, production smoke.

## R9 — Historical account-linked data breaks

**Mitigation:** Forward-only migrations; do not drop old structures without an explicit compatibility/data-retention decision.

## R10 — Scope explosion

**Mitigation:** Do not redesign scoring, add new game modes, add runtime AI, create unrelated SEO pages, or replace the backend during this migration.

## R11 — Anonymous session abuse increases backend load

**Mitigation:** Establish shared identity only when required; retain server rate limits; monitor anonymous session creation; document production rate-limit configuration.

## R12 — Management token leaks via URL handling

**Mitigation:** Prefer fragments for secrets; parse then store locally; strip/redact from analytics; never include in canonical URL, logs, page titles, or copied diagnostic payloads.

---

# 23. Explicitly Out of Scope

Unless separately approved, this migration does **not** include:

- runtime AI features;
- speech recognition/ASR;
- runtime TTS;
- payment/subscription system;
- certification claims;
- native mobile apps;
- new unrelated game modes;
- a new blog/content-hub architecture;
- changes to scoring mathematics;
- replacing Supabase;
- replacing Next.js;
- deleting Tournament API merely because user-facing IA changes;
- broad new SEO route generation;
- visual redesign beyond what is required to implement Goal First coherently.

---

# 24. Completion Sequence

The project reaches the target only after all of these stages are proven:

1. **Foundation safe** — B00–B03.
2. **Goal-First shell and homepage real** — B04–B06.
3. **All practice routes migrated** — B07–B09.
4. **Competition routes migrated** — B10–B11.
5. **No-account creator/admin workflows secure** — B12.
6. **Progress/Privacy coherent** — B13.
7. **SEO/Analytics/Ads production contracts reconciled** — B14.
8. **Mobile/accessibility/consistency pass complete** — B15.
9. **Fresh-stack regression, production smoke, and documentation closure complete** — B16.

No earlier batch may claim “Ultimate Blueprint achieved.”

---

# 25. Final One-Line Implementation Mission

> **Transform the current production-hardened TypingArena into the approved Goal-First, no-account experience while preserving its deterministic engines, server-authoritative integrity, local-first privacy, no-runtime-AI policy, SEO portfolio, and safe advertising boundaries.**
