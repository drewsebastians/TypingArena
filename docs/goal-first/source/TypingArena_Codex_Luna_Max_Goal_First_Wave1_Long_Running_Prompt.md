# TypingArena — Codex Luna Max Long-Running Implementation Prompt
## Goal-First Wave 1: Repository Re-baseline → No-Account Foundation → Goal-First Core → Core Practice Migration

**Intended model:** Codex — Luna Max  
**Execution style:** very long-running, autonomous, evidence-gated, multi-batch implementation  
**Repository:** `drewsebastians/TypingArena`  
**Verified current public `main` at prompt preparation:** `b99779bc208c5abd2aa2e67e618927a2db949c42`  
**Current merge:** PR #3 — Pass VII independent UI/UX audit + evidence-gated polish  
**Approved product direction:** **Option 2 — Goal First**  
**Figma reference:** `https://www.figma.com/design/vM7Ncr9GRINv0rwbW1n6Qd`  
**Runtime-AI policy:** AI may assist development; **production runtime must remain non-AI**.

---

# 0. YOUR ROLE

Act as the senior staff engineer, product architect, UX engineer, database/security engineer, test engineer, and release-readiness owner for this implementation wave.

You are not being asked to write a plan only.

You are being asked to:

1. inspect the actual repository state;
2. reconcile the approved Goal-First target with the already-merged Pass VII work;
3. implement several dependency-linked batches in one long-running session;
4. preserve all validated engineering/security/scoring guarantees;
5. run real tests and browser verification;
6. create evidence;
7. commit work in logical internal batches;
8. if repository credentials and GitHub tooling permit, push one implementation branch and open a PR;
9. **do not merge the PR or deploy production automatically**.

You should continue autonomously through the defined scope without repeatedly asking the owner for decisions that can be resolved from repository evidence, tests, Figma, this prompt, or sound engineering judgment.

Do **not** stop merely because the task is large. Work in internal batches, checkpoint with commits, rerun gates, and continue.

---

# 1. PRIMARY MISSION

Transform the current production-hardened TypingArena from its existing tool-first / grouped-tool experience into the approved **Goal-First** experience while preserving:

- deterministic real typing/dictation/transcription engines;
- server-authoritative ranked integrity;
- existing anti-forgery trust boundaries;
- static EN/ID content and licensed static audio;
- no-runtime-AI policy;
- public route portfolio and SEO value;
- local-first ordinary practice;
- honest degraded/offline behavior;
- ad-safe active exercises;
- desktop/mobile accessibility;
- the validated Pass VII navigation, typography, locale, result-hierarchy, focus, dark-mode, and responsive improvements wherever compatible.

The target user loop is:

> **Visit → choose a goal → get the right setup → start immediately → complete a real exercise → understand the result → take the next relevant action → return.**

The target product does **not** require visible user accounts.

Shared features may use a pseudonymous anonymous backend identity internally, but the product must not require or advertise:

- Login
- Sign up
- email magic links
- password/account setup
- Account dashboard
- cross-device account synchronization as a core promise

The visible identity concept should be a **nickname**, not an email account.

---

# 2. AUTHORITATIVE SOURCE ORDER

Use this priority order when sources differ.

## Tier 1 — Actual current repository and passing tests

The repository is the truth about what exists and what must not be accidentally broken.

At prompt preparation, current `main` is:

`b99779bc208c5abd2aa2e67e618927a2db949c42`

But **do not assume this remains HEAD when you run**.

First fetch and verify the latest `origin/main`.

If `origin/main` advanced, re-baseline before editing.

## Tier 2 — Approved Goal-First target

If these files are present in the working environment, read them fully before implementation:

- `TypingArena_Ultimate_Blueprint_Goal_First.md`
- `TypingArena_Grand_Batching_Plan_Goal_First.md`

They may be supplied outside the repository.

If they are not available, this prompt contains the authoritative implementation subset for this wave.

## Tier 3 — Figma Goal-First wireframe

Reference:

`https://www.figma.com/design/vM7Ncr9GRINv0rwbW1n6Qd`

If an installed Figma/plugin integration can inspect the file, use it.

If Figma access is unavailable, do **not** block the implementation. Use the exact textual Goal-First requirements in this prompt and the existing code/UI as the source.

Figma is a UX/layout contract, **not** permission to replace real engines with static mockups.

## Tier 4 — Pass VII evidence

Read and preserve the intent of:

- `docs/UI_UX_AUDIT_PASS_VII.md`
- `docs/UI_UX_BEFORE_AFTER.md`
- `docs/UI_UX_RECOMMENDATIONS_FROZEN.md`
- `artifacts/ui-ux/before/`
- `artifacts/ui-ux/after/`

## Tier 5 — Historical architecture/security documentation

Read as necessary:

- `README.md`
- `BLUEPRINT_COMPLETION_REPORT.md`
- `docs/ADR-001-deployment.md`
- `docs/ADR-002-product-day.md`
- `docs/ADR-003-scoring.md`
- `docs/ADR-004-trust-model.md`
- `docs/FINAL_ENGINEERING_FREEZE_EVIDENCE.md`
- `docs/PRODUCTION_HANDOFF.md`
- `docs/PRODUCTION_LAUNCH_RUNBOOK.md`
- `docs/PRODUCTION_SMOKE_MATRIX.md`

---

# 3. CURRENT PASS VII STATE — MUST BE TREATED AS THE STARTING POINT

The previous OpenCode run began from:

`9109fe824ca8b241f3d22129f094f0ee15c51ccd`

and merged PR #3 into `main` at:

`b99779bc208c5abd2aa2e67e618927a2db949c42`

The implementation reported:

- desktop 1440×900 and 1280×800 testing;
- tablet 768×1024 spot testing;
- mobile 390×844, 375×667, and 320×568 stress testing;
- 24 before + 24 after screenshots over 12 representative routes;
- 162/162 unit/component tests;
- 23/23 desktop Playwright;
- 23/23 mobile Playwright;
- static build success;
- backend integration green after the PR;
- live production smoke 37/37;
- no DB schema change;
- no scoring change;
- no security/RLS change;
- no runtime AI change;
- no route removal.

## Pass VII validated changes already merged

### Navigation

Previous 15 top-level destinations were replaced with grouped progressive disclosure.

Current implementation uses four visible desktop primaries:

- Practice
- Compete
- Teams / Groups
- Progress

with grouped dropdowns.

Mobile changed from a horizontal pill rail to a hamburger/drawer.

### Homepage

The previous 19-card wall was reduced/grouped into:

- Practice
- Compete
- Work / Teams & creation

with “Explore all tools” progressive disclosure.

### Typography

Arial override was removed; Geist Sans / Geist Mono are now intended.

### Locale

A `LocaleProvider` was introduced, and `document.documentElement.lang` is intended to track the selected locale.

### Backend degraded-state copy

Developer-facing README/setup copy was replaced with user-facing messaging.

### Result hierarchy

Primary WPM was enlarged; details were progressively disclosed.

### Active exercise focus

Typing exercises set an `html[data-exercise-active]` state and dim the header.

### Dark mode

Dark continuity token work was added.

### Lightweight primitives

`src/components/ui/primitives.tsx` exists with at least:

- `PageHeading`
- `SectionCard`
- `EmptyState`
- `Notice`

---

# 4. IMPORTANT: RE-VERIFY PASS VII CLAIMS — DO NOT BLINDLY TRUST THE SUMMARY

The previous run is useful evidence, but the current source must still be inspected.

Two examples that deserve explicit re-verification:

## 4.1 Mobile hamburger target

At prompt preparation, the current source used approximately:

`h-9 w-9`

for the hamburger.

That is normally **36×36 CSS pixels**, not ≥44×44.

The previous summary claimed the touch target effectively met 44 px.

Do not repeat that claim without measuring the actual hit target.

If it is <44×44, correct it to an appropriate ≥44 px target without making the header visually clumsy.

## 4.2 Drawer “focus trap”

The current source visibly handles:

- body scroll lock;
- Escape close;
- initial focus on the close button.

However, inspect whether focus is actually contained/trapped within the modal drawer while it is open.

Do not claim a focus trap unless Tab / Shift+Tab behavior proves it.

If not actually trapped, fix it using a robust lightweight implementation or a native accessible pattern without adding a large dependency unnecessarily.

## General rule

For every prior “PASS” claim:

> verify → preserve if true → fix if incomplete → document exact evidence.

Do not regress the valid Pass VII improvements.

---

# 5. NON-NEGOTIABLE PRODUCT / ENGINEERING INVARIANTS

These are hard constraints.

## 5.1 No runtime AI

Production runtime must not use:

- LLM inference;
- generative APIs;
- speech recognition / ASR;
- runtime TTS;
- `speechSynthesis`;
- AI-generated exercise content on demand.

Preserve static reviewed corpora and static pre-generated audio.

The existing no-runtime-AI guard must remain green.

## 5.2 Preserve scoring semantics

Do not redesign scoring mathematics in this wave.

Preserve:

- typing WPM/accuracy semantics;
- typed-scope behavior;
- corrections and heatmap logic;
- playback metrics;
- deterministic exercise/version identity;
- official ranked configuration rules.

## 5.3 Preserve server-authoritative ranked integrity

Do not weaken:

- `submit_attempt()` as authoritative write path;
- server-side metric recomputation;
- direct attempt INSERT/UPDATE restrictions;
- official ranked exercise binding;
- Daily challenge date/version binding;
- public leaderboard acceptance rules;
- multiplayer host authority;
- assignment-to-real-attempt binding;
- assessment lifecycle validation.

## 5.4 Do not rewrite historical migrations

Current historical chain starts at `0001` and currently ends at `0014`.

Never edit old migration files to make the new design look cleaner.

Use **forward-only** migrations starting at the next available sequence number.

## 5.5 Preserve routes

Do not remove useful existing routes.

All existing public routes must continue to resolve and remain meaningful.

Do not create unnecessary new SEO routes merely to represent homepage goals.

## 5.6 Ads must never interrupt an active skill task

No ad inside:

- active typing test;
- active dictation;
- active transcription;
- Daily timed challenge;
- multiplayer active race;
- team assignment runner;
- candidate assessment module.

Ads may appear:

- after result;
- on discovery/browse surfaces;
- between explanatory sections;
- below leaderboard/library content.

## 5.7 No visible account system in the target UX

The final state of this wave should not surface normal product UI asking the visitor to:

- create an account;
- log in;
- enter email for magic link;
- sign out;
- migrate history to an account.

If a shared feature needs backend identity, establish it silently via anonymous identity.

## 5.8 Ordinary practice remains local-first

Typing/dictation/transcription ordinary practice must work without backend configuration.

No shared backend outage should prevent ordinary practice.

## 5.9 Preserve honest degradation

When backend/shared features are unavailable, explain what the user can still do.

Never fabricate shared results, rooms, standings, or backend state.

---

# 6. GIT / WORKTREE SAFETY — DO THIS BEFORE ANY CODE CHANGE

You may be running inside an arbitrary Codex worktree.

Perform a complete safety inspection first.

Run and record at least:

```bash
git status --short --branch
git rev-parse HEAD
git branch --show-current
git remote -v
git fetch --all --prune
git rev-parse origin/main
git log --oneline --decorate -n 15
git worktree list
git stash list
```

## 6.1 If the working tree is clean

Create/use a dedicated branch based on the latest verified `origin/main`.

Preferred name:

`codex/goal-first-wave1`

If that branch already exists for this exact work, inspect it before reuse.

## 6.2 If there are pre-existing uncommitted changes

Do **not**:

- `git reset --hard`
- broad checkout/restore
- delete files
- discard untracked files
- blindly stash hundreds of files
- overwrite someone else’s work

Instead:

1. inventory the changes;
2. determine whether they belong to this task;
3. if unrelated and another clean worktree can be created safely, create a dedicated worktree from `origin/main`;
4. otherwise work around them carefully or stop only when destructive risk is unavoidable.

Document any pre-existing state.

## 6.3 Do not edit `main` directly

Use a feature branch/worktree.

## 6.4 Commit after meaningful internal batches

Do not leave one enormous undifferentiated commit.

Suggested commit boundaries appear later in this prompt.

---

# 7. EXECUTION SCOPE FOR THIS LONG-RUNNING SESSION

## Mandatory scope

Complete the functional equivalent of:

- **B00** — Re-baseline and evidence lock
- **B01** — Goal/route contracts + shared primitives reconciliation
- **B02** — Anonymous shared identity foundation
- **critical early subset of B12** — capability/recovery foundation necessary to avoid shipping dead creator/admin flows after visible account removal
- **B03** — local-first persistence contract + visible account retirement
- **B04** — global shell reconciliation, preserving Pass VII improvements
- **B05** — real Goal-First homepage
- **B06** — shared task lifecycle + safe ad boundary

## Conditional extension scope

After all mandatory-scope hard gates are green, continue in the **same run** into:

- **B07** — typing route-family migration
- **B08** — dictation/transcription active route-family migration
- **B09** — transcription library + Career Mode migration

Continue into B07–B09 if:

- architecture is stable;
- no unresolved security defect exists;
- database migration tests are green or have a clearly external-only environment limitation;
- test runtime/environment remains usable;
- changes remain reviewable.

Do **not** start the later full competition/Teams/Assessments redesign wave beyond what is required for no-account functionality in this session.

Specifically, do not attempt the entirety of:

- B10 competition polish,
- B11 social competition polish,
- B12 final creator/admin UX polish,
- B13 final Progress/Privacy redesign,
- B14 SEO/analytics monetization closure,
- B15 all-route accessibility polish,
- B16 final production closure,

unless a small piece is strictly required to keep this wave correct.

This prompt is intentionally a large **Wave 1**, not the entire multi-wave program.

---

# 8. INTERNAL BATCH 00 — RE-BASELINE FROM THE MERGED PASS VII STATE

Create:

`docs/goal-first/00_WAVE1_BASELINE.md`

Record:

- actual starting SHA;
- relationship to `origin/main`;
- existing branch/worktree state;
- current route inventory;
- current migration inventory;
- current unit/component count;
- current Playwright count;
- current DB integration count;
- current static build result;
- current production readiness result if runnable;
- current live smoke result if network/tooling permits;
- current relevant screenshots/artifacts;
- current account/auth dependency inventory;
- current Pass VII state.

## Baseline test expectation

Run, where environment permits:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Then static serve + representative or full Playwright as appropriate.

If local Supabase/Docker is available:

- run fresh DB reset;
- run DB integration.

If local DB integration cannot run because of environment/tooling:

- do not fabricate PASS;
- use existing CI evidence as historical baseline only;
- plan to run the workflow after branch push if possible.

## Browser baseline

Capture representative current-state screenshots before Goal-First changes, at minimum:

- home desktop 1440×900
- home mobile 390×844
- home 320×568 stress
- typing pre-test desktop/mobile
- progress desktop/mobile
- daily or leaderboard
- teams
- assessments

Store under a new isolated path, e.g.:

`artifacts/goal-first/wave1/before/`

Do not overwrite Pass VII artifacts.

---

# 9. INTERNAL BATCH 01 — ROUTE / GOAL CONTRACTS AND PRIMITIVES

The repository already has some primitives.

Do not duplicate them blindly.

Inspect:

`src/components/ui/primitives.tsx`

Extend or reorganize only where useful.

## 9.1 Create a single route registry

Create a source of truth conceptually like:

`src/lib/routeRegistry.ts`

It should cover at least:

- stable route ID;
- path;
- English label;
- Indonesian label or translation key;
- category;
- primary Goal-First goal;
- indexability;
- active-task capability;
- backend/shared requirement;
- ad eligibility classification;
- related route IDs.

Do not force all UI copy into this registry if it makes i18n worse.

Use it where it eliminates real duplication:

- navigation;
- related links;
- goal mapping;
- sitemap validation;
- route tests.

## 9.2 Create Goal-First registry

Create conceptually:

`src/lib/goals.ts`

Canonical goals:

1. **Type Faster**
2. **Listen Better**
3. **Transcribe Accurately**
4. **Prepare for Work**
5. **Compete**
6. **Teach / Assess**

Each should define:

- stable ID;
- localized title/subtitle;
- icon/visual token;
- primary CTA;
- workspace type or destination;
- default tool config;
- related routes.

## 9.3 Shared Goal-First components

Create/prepare, using sensible names:

- `GoalGrid`
- `GoalCard`
- `GoalWorkspace`
- `GoalSummaryBar` if useful

## 9.4 Shared task shell contracts

Prepare:

- `ToolPageShell`
- `ActiveTaskBoundary`
- `ResultSection`
- `NextStepCard`
- `RelatedTools`

Do not force mature engine internals into an over-general generic abstraction.

## 9.5 Tests

Add tests for:

- route uniqueness;
- route registry completeness;
- `/progress` marked private/noindex;
- goal IDs unique;
- every goal maps to a valid workspace/destination;
- every registered related route exists.

### Suggested checkpoint commit

`refactor: add Goal-First route and goal contracts`

---

# 10. INTERNAL BATCH 02 — ANONYMOUS SHARED IDENTITY FOUNDATION

This is a security-sensitive batch.

The product must become no-account **without** replacing server identity with an insecure browser-generated UUID.

Use Supabase anonymous Auth (or the actual supported equivalent in the installed/current Supabase version).

## 10.1 Do not guess Supabase configuration

Inspect:

- installed Supabase CLI/config behavior;
- current `supabase/config.toml`;
- current auth/profile triggers/policies;
- official configuration if network/documentation access exists.

Use the real supported configuration key.

If production enabling requires an external Supabase dashboard toggle, implement repository support and document the external action.

## 10.2 Add forward migration(s)

Use the next migration number after the verified current chain.

Likely starts at:

`0015_...sql`

but determine actual next number dynamically.

Migration objectives:

- profile/user initialization works for anonymous Auth users without email;
- no policy/function requires a non-null email;
- anonymous Auth users continue to use `auth.uid()` and authenticated-role RLS correctly;
- existing account-originated historical rows remain compatible;
- current explicit write restrictions remain intact.

## 10.3 Introduce shared identity adapter

In `src/lib/remote.ts` or a focused extracted module, introduce a clean contract such as:

```ts
ensureSharedIdentity()
getSharedIdentity()
getSharedUserId()
```

Behavior:

1. ordinary local practice does not call it unnecessarily;
2. if backend is unconfigured, preserve honest unavailable behavior;
3. if an auth session already exists, reuse it;
4. if no session exists, create a Supabase anonymous Auth session;
5. ensure profile row;
6. never ask for email/password/OTP;
7. persist session using the existing Supabase client behavior;
8. be idempotent under multiple simultaneous callers.

Add concurrency protection if two components can request identity at once.

## 10.4 Nickname contract

The visible shared identity should be a nickname.

Requirements:

- 2–24 chars, or another existing safely bounded range if already established;
- sanitized server-side and client-side;
- stored locally for reuse;
- mirrored to the profile for shared/public display;
- no email fallback;
- never show raw auth UUID as a normal public identity.

Do not force nickname entry for purely local practice.

Prompt only when a shared/public action genuinely needs a display name.

## 10.5 Early capability/recovery foundation

Removing visible accounts creates a recovery problem for long-lived resources.

Do not defer this architectural hole if no-account UI will ship before later waves.

Implement the **minimal secure backend foundation** now for resources whose management currently depends on account ownership:

- Teams/Classrooms
- Custom Tests
- Employer Assessments

You do not need to fully redesign those pages visually in this wave, but they must not become dead or unrecoverable by design.

### Capability-token rules

Management/recovery token:

- cryptographically high entropy, at least ~128 bits;
- bearer secret;
- DB stores only a secure hash;
- scoped to exactly one resource;
- rotatable;
- revocable;
- validation attempts rate-limited;
- never returned by public views;
- never stored in analytics;
- never placed in sitemap/canonical metadata;
- never logged.

Prefer URL-fragment transport for recovery/manage links where practical, e.g.:

`/teams?team=<public-id>#manage=<secret>`

because fragments are not transmitted as HTTP request paths and are less likely to leak via ordinary server logs/referrers.

If repository constraints make a different design safer, document the reasoning.

### Do not overcomplicate

Do not build a general-purpose ACL framework if three resource-scoped management capabilities suffice.

## 10.6 DB integration tests

Add real negative/positive tests.

Must prove:

- anonymous auth identity can access intended RPC;
- anonymous identity cannot directly insert/update attempts;
- server still recomputes ranked metrics;
- anonymous user cannot read another user’s private attempts;
- management token can access only intended resource;
- wrong-resource token denied;
- revoked token denied;
- raw token hash is not selectable/public;
- candidate invite/join code cannot act as management token;
- rate limiting works or is structurally enforced/testable.

### Suggested checkpoint commit

`feat: add anonymous shared identity and resource recovery foundation`

---

# 11. INTERNAL BATCH 03 — LOCAL-FIRST PERSISTENCE + RETIRE VISIBLE ACCOUNTS

The implementation must now make the no-account product promise truthful.

## 11.1 Ordinary practice canonical storage

Keep local history as canonical ordinary practice history.

Practice should remain fully usable:

- offline;
- without Supabase;
- without shared identity.

## 11.2 Explicit persistence matrix

Implement/document a clear distinction:

| Activity | Local history | Server |
|---|---:|---:|
| ordinary typing practice | yes | not required |
| ordinary dictation practice | yes | not required |
| ordinary transcription practice | yes | not required |
| Career practice | yes | server only if existing shared evidence genuinely required |
| ranked attempt | yes | yes |
| Daily ranked attempt | yes | yes |
| team assignment completion | yes/optional local | yes |
| multiplayer authoritative final result | optional local | yes |
| assessment candidate result | optional candidate-local | yes |
| custom practice | yes | resource metadata only as needed |

Do not create unnecessary server writes for every anonymous practice session.

## 11.3 Remove visible account UX

The final UI after this batch should not expose:

- `AccountPanel`
- email field
- “Email me a link”
- “Sign in”
- “Sign out”
- “Delete account”
- “Import local history”
- “sync history across devices” promise

Delete/refactor `AccountPanel.tsx` only after its useful privacy/deletion behavior has been migrated.

## 11.4 Shared feature bootstrap

Any route/action that previously failed merely because `getCurrentUser()` returned null should be reviewed.

Where the user is starting a shared action, use `ensureSharedIdentity()` at the correct moment.

Examples include, as applicable:

- ranked attempt submission;
- Daily;
- Teams create/join;
- Custom creator management;
- Assessment creator management;
- Multiplayer room ownership if current backend semantics require Auth.

Do **not** create anonymous auth identity on every page load.

## 11.5 Cross-device sync

The target user-facing promise is:

> **Progress on this device.**

Remove ordinary account-based cross-device history promises.

Do not destructively drop historical remote data in this wave unless necessary.

Backward compatibility can remain internally.

## 11.6 Privacy controls

Provide backend utilities for:

- clear local progress;
- delete current anonymous shared identity data where technically/policy appropriate.

Do not surface a misleading “delete account” concept.

## 11.7 Analytics cleanup

Stop emitting visible-account events such as:

- `account_login`
- `account_signout`

Add anonymous/no-account events such as:

- `anonymous_identity_created`
- `nickname_set`
- `manage_link_created`
- `manage_link_recovered`

Never include token or auth UUID in analytics properties.

## 11.8 Tests

Add a production-source/UI grep or proper E2E assertion proving no user-facing account flow remains.

Be careful with historical documentation strings: do not fail legitimate ADR history merely because it mentions “account”.

Scope the production UI check to current app/component output.

### Suggested checkpoint commit

`refactor: make practice local-first and remove visible account flows`

---

# 12. INTERNAL BATCH 04 — RECONCILE GLOBAL SHELL WITH GOAL FIRST WITHOUT REGRESSING PASS VII

Pass VII already fixed navigation overload.

Goal First does **not** require undoing that work.

## 12.1 Preserve the progressive-disclosure principle

Never reintroduce:

- 15 flat top-level pills;
- horizontal mobile navigation rail.

The exact label grouping may change only if the approved Goal-First design materially benefits.

Choose the smallest coherent IA change.

A valid outcome may retain the current four-primary architecture if it remains compatible with the Figma/Goal-First hierarchy.

Do not churn labels for the sake of matching an earlier textual sample if the current architecture is already better and validated.

## 12.2 Fix any incomplete Pass VII a11y claims

Explicitly verify and correct:

- hamburger hit target ≥44×44;
- drawer Tab and Shift+Tab containment;
- focus returns to launcher;
- Escape close;
- body scroll lock;
- current route state;
- dropdown keyboard access;
- visible focus;
- locale switch labels;
- responsive overflow.

## 12.3 Global username display

The target UX has no account identity in the global shell.

If `Header.tsx` currently renders a stored username/nickname globally, decide whether that materially helps Goal First.

Default direction:

- remove global username display;
- keep streak;
- nickname belongs in shared feature context, not as an account-like global identity badge.

If Figma explicitly shows a nickname, follow Figma.

## 12.4 Footer

Simplify footer IA and retain:

- human skill/no-runtime-AI trust statement;
- privacy;
- major tool categories.

Do not clutter with technical version numbers unless they add real user value.

## 12.5 i18n

Preserve reactive locale provider.

All newly introduced Goal-First labels and navigation content should be localized EN/ID.

Do not leave a half-bilingual homepage.

### Suggested checkpoint commit

`refactor: reconcile global shell for Goal-First navigation`

---

# 13. INTERNAL BATCH 05 — IMPLEMENT THE REAL GOAL-FIRST HOMEPAGE

This is the central product change.

The current homepage still begins with:

- old value proposition;
- immediate `TypingTestPanel`;
- SkillProfile;
- then grouped tool discovery.

That is an improvement over the 19-card wall but is **not yet the approved Goal-First experience**.

Replace the primary hierarchy.

## 13.1 Above the fold

The main question should be equivalent to:

> **What do you want to get better at today?**

Support copy should emphasize:

- choose a goal;
- start immediately;
- no account required;
- English + Bahasa Indonesia;
- human/deterministic skill practice.

Keep one concise trust message such as deterministic / no runtime AI.

Do not front-load deep technical scoring language.

## 13.2 Six goal cards

Render six clear goal cards:

1. Type Faster
2. Listen Better
3. Transcribe Accurately
4. Prepare for Work
5. Compete
6. Teach / Assess

Desktop target:

- 3×2 or a visually equivalent balanced grid.

Mobile:

- one-column stack or another clear no-horizontal-scroll structure.

Each card:

- outcome-led title;
- one short explanation;
- clear selection/CTA;
- accessible button/link semantics;
- localized.

## 13.3 Goal workspace

Selecting a goal updates the main contextual workspace below the grid.

Default selected goal:

**Type Faster**

Do not make the homepage six static links only.

The first three goals must be capable of starting a **real exercise directly on the homepage**.

### Type Faster

Use the real typing engine/panel.

Allow suitable configuration:

- language;
- duration;
- mode where appropriate.

### Listen Better

Use the real dictation engine/panel.

Allow suitable:

- language;
- clip/difficulty configuration.

### Transcribe Accurately

Use the real transcription engine/panel.

Allow suitable:

- language;
- difficulty/clip.

### Prepare for Work

Show concise Career Mode track choices and route into the existing Career experience.

### Compete

Primary action should lead naturally to Daily Arena; also expose Leaderboard/Multiplayer without a card wall.

### Teach / Assess

Explain the difference between:

- Teams/Classrooms
- Employer Assessments

and route accordingly.

## 13.4 Do not fake the engines

Do not implement decorative mock previews that do not actually score.

The existing real engines/panels are the underlying capability.

Reuse/wrap them.

## 13.5 Lazy-loading / bundle size

The homepage must not eagerly load every heavy social/admin panel.

The first three workspaces may be dynamically loaded as appropriate.

Only load the selected workspace if practical.

Inspect `next build` chunk behavior.

## 13.6 Homepage result flow

After a direct homepage exercise:

- primary result;
- useful secondary metrics;
- “what to do next”;
- personal/weak-area recommendation when available;
- optional ad only after result;
- relevant route CTA.

Do not show a result dashboard before any attempt exists.

## 13.7 Supporting sections after workspace

Implement concise supporting sections inspired by the approved Goal-First structure:

### Master the 3 skills that matter

- See → Type
- Hear → Type
- Hear → Transcribe

### A clear path from practice to proof

- Train
- Improve
- Compete
- Prove

### Explore more to go further

Curated links only, e.g.:

- Daily Arena
- Career Mode
- Teams
- Assessments

Do **not** recreate the 19-card wall lower on the page.

## 13.8 Trust disclosure

Preserve Pass VII’s correct conclusion:

Technical trust messaging is valuable but should be progressively disclosed.

Keep a concise trust pill / line.

Keep detailed scoring/content explanation in a `<details>` or supporting section.

## 13.9 Analytics

Add:

- `goal_first_view`
- `goal_selected`
- `goal_workspace_ready`
- `goal_direct_start`
- `goal_to_route_click`

Keep payloads PII-free.

### Suggested checkpoint commit

`feat: implement Goal-First homepage with real skill workspaces`

---

# 14. INTERNAL BATCH 06 — SHARED ACTIVE-TASK LIFECYCLE + SAFE ADS + RESULT CONTRACT

The homepage and route families need one reliable task boundary.

## 14.1 Active lifecycle

Create a minimal shared lifecycle, conceptually:

```text
idle/configuring
→ ready
→ active
→ completing
→ result
```

Do not over-engineer.

It can be an interface/callback/context if that is simpler than a global state machine.

## 14.2 Active-task shell behavior

When active:

- dim/de-emphasize secondary chrome;
- suppress ads;
- avoid distracting discovery content near task;
- retain required navigation and accessibility controls;
- prevent layout jumps.

Existing `html[data-exercise-active]` may be evolved into a general solution covering typing, dictation, and transcription.

Do not leave focus mode typing-only if homepage directly runs all three.

## 14.3 Safe advertising wrapper

Evolve `AdSlot` or add a wrapper such as `SafeAdSlot`.

Contract:

- renders no ad during `active`;
- may reserve layout space outside active tasks where useful;
- absent AdSense configuration remains visually clean;
- no task content moves unexpectedly when ad initializes.

Add direct component tests.

## 14.4 Shared result hierarchy

Every core result should answer:

1. How did I do?
2. What went wrong / what should I notice?
3. What should I do next?

Typing:

- WPM;
- accuracy;
- fixed/unfixed errors;
- weak keys/bigrams;
- personal best as available.

Audio:

- normalized/word/punctuation score as relevant;
- replay ratio;
- pause count;
- effective WPM for transcription where existing logic supports it.

Do not duplicate scoring calculations in UI.

## 14.5 Recommendation

Continue using deterministic/rule-based local-history recommendations.

No runtime AI.

### Suggested checkpoint commit

`refactor: unify active-task, result, and ad-safe boundaries`

---

# 15. MANDATORY WAVE-1 GATE BEFORE OPTIONAL ROUTE MIGRATION

At this point, stop editing and run a serious gate.

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run targeted E2E for:

- home desktop;
- home mobile;
- home 320 stress;
- direct Type Faster flow;
- direct Listen Better flow;
- direct Transcribe Accurately flow;
- locale switch;
- mobile drawer;
- Progress no visible account UI;
- representative ranked/shared identity flow if backend available;
- no ad inside active task.

Run DB integration after a fresh migration reset if environment permits.

## Do not continue to B07–B09 if:

- an unresolved security/RLS/auth defect exists;
- anonymous identity migration is not proven;
- ordinary practice is broken offline;
- homepage real task flow is not stable;
- core build is red.

If a DB runner is unavailable solely because Docker/local Supabase is unavailable, use CI after branch push if possible before declaring backend gate green.

---

# 16. OPTIONAL EXTENSION BATCH 07 — TYPING ROUTE-FAMILY MIGRATION

If mandatory gates are green, continue.

Routes:

- `/typing-test`
- `/typing-test/1-minute`
- `/typing-test/5-minute`
- `/typing-test/indonesian`
- `/tes-mengetik`
- `/data-entry-test`
- `/punctuation-typing-test`

## Goals

Apply the new shared shell/result/task/ad patterns consistently.

Preserve each route’s distinct search intent and functionality.

## Requirements

- real route preset, not heading-only variation;
- no ad during active typing;
- clear config;
- clear result;
- next action;
- concise scoring transparency;
- related tools;
- localized copy where appropriate;
- responsive 320 px.

## Critical regression

`/typing-test/5-minute` must still be a true full-clock endurance test.

Do not shorten/early-finish it merely for E2E convenience.

### Suggested checkpoint commit

`refactor: migrate typing route family to Goal-First tool shell`

---

# 17. OPTIONAL EXTENSION BATCH 08 — DICTATION + TRANSCRIPTION ACTIVE ROUTES

Routes:

- `/dictation`
- `/dictation/english`
- `/dictation/indonesian`
- `/noise-challenge`
- `/transcription-practice`

## Requirements

Preserve:

- static WAV source;
- hidden answer before submission;
- playback analytics;
- replay/pause/seek behavior;
- scoring semantics;
- no autoplay;
- EN/ID behavior;
- no ad during active audio task.

Transcription should keep a suitably large editor.

Noise Challenge must preserve its actual controlled noise behavior and not become a decorative selector.

### Suggested checkpoint commit

`refactor: migrate audio practice routes to shared task shell`

---

# 18. OPTIONAL EXTENSION BATCH 09 — TRANSCRIPTION LIBRARY + CAREER MODE

Routes:

- `/transcription-library`
- `/career`

## 18.1 Library

Preserve and improve:

- language filter;
- difficulty filter;
- length filter;
- topic filter;
- direct practice CTA;
- real clip metadata;
- no AI-transcription claims.

## 18.2 Career Mode

Keep the current five intended tracks if repository confirms them:

- Data Entry
- Office / Admin
- Numbers & Codes
- Punctuation Precision
- Transcription

Requirements:

- job-relevant practice;
- explicit “not certification” / not legally validated hiring instrument language as applicable;
- real modules using real engines;
- transparent score bands;
- local history;
- next practice recommendation;
- ad only after track/result.

### Suggested checkpoint commit

`refactor: align library and Career Mode with Goal-First practice system`

---

# 19. FURTHER SHARED-FEATURE COMPATIBILITY CHECK — DO NOT LEAVE DEAD FLOWS

Even though full competition/creator UX polish is a later wave, the no-account foundation changes their identity assumptions.

Before finishing this run, manually inspect or E2E smoke:

- `/daily-arena`
- `/leaderboard`
- `/seasons`
- `/friends`
- `/multiplayer`
- `/teams`
- `/custom`
- `/assessments`

For each, verify:

1. page renders;
2. no visible email sign-in requirement remains;
3. if a shared action requires identity, it can create/use anonymous identity;
4. no developer-facing backend copy regression;
5. no security shortcut was introduced;
6. no account-only dead-end remains.

If one of these cannot be made minimally functional without entering a large later-wave redesign:

- implement the smallest safe compatibility layer;
- document remaining visual/product refinement for the later batch;
- do not misrepresent it as complete.

---

# 20. ACCESSIBILITY REQUIREMENTS FOR THIS RUN

Target WCAG 2.2 AA-oriented behavior.

At minimum validate:

## Global

- semantic landmarks;
- heading hierarchy;
- visible focus;
- language attribute updates;
- color not sole status indicator;
- reduced-motion behavior for any new animation;
- no autoplay audio.

## Goal cards

- keyboard reachable;
- selected state discernible;
- not dependent on hover;
- correct button/link semantics.

## Mobile drawer

- launcher ≥44×44 actual hit target;
- focus moves into drawer;
- Tab remains inside while modal open;
- Shift+Tab remains inside;
- Escape closes;
- focus returns to launcher;
- backdrop close works;
- body does not scroll behind drawer.

## Tool configuration

- labels bound to inputs;
- select/pill states accessible;
- keyboard operation.

## Active exercise

- focus not stolen unexpectedly;
- task input remains keyboard primary;
- secondary chrome is dimmed visually but not made inaccessible.

## Results

- primary result is readable;
- important status can be announced without noisy live-region spam;
- detailed disclosures keyboard operable.

---

# 21. RESPONSIVE / VISUAL TEST MATRIX

Use real browser screenshots.

Required widths:

- 1440×900
- 1280×800
- 768×1024
- 390×844
- 375×667
- **320×568 stress**

At minimum capture AFTER images for:

- home;
- typing;
- dictation;
- transcription;
- progress;
- one competition route;
- teams;
- assessments.

Store under:

`artifacts/goal-first/wave1/after/`

If a specific route has meaningful pre/post difference, capture matched before/after.

Do not overwrite Pass VII images.

## Visual checks

- no horizontal page overflow at 320;
- no clipped dropdown/drawer;
- no card content collision;
- Goal-First hierarchy is obvious;
- active workspace is visually dominant;
- result primary metric hierarchy remains;
- dark background is continuous;
- ads do not invade task area;
- mobile menu does not cover unrecoverable controls.

---

# 22. TESTING REQUIREMENTS

Do not report “PASS” without running the command or retrieving real CI evidence.

## 22.1 Unit/component

Run full:

```bash
npm test
```

Add targeted tests for:

- route registry;
- goals registry;
- GoalWorkspace;
- anonymous identity bootstrap;
- nickname;
- management capability token parsing/redaction/helpers;
- SafeAdSlot;
- no account UI;
- active lifecycle.

## 22.2 Type/lint/build

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

## 22.3 Playwright

Run full desktop + mobile before final handoff if feasible.

Preserve prior coverage and add Goal-First cases.

New expected scenarios should include:

1. root renders six goals;
2. all six goals keyboard reachable;
3. Type Faster direct flow;
4. Listen Better direct flow;
5. Transcribe Accurately direct flow;
6. task active = no ad;
7. result = post-result ad eligible/outside task;
8. mobile drawer focus containment;
9. locale switch updates `<html lang>`;
10. no account/login/email CTA in production UI;
11. Progress is device-local in copy;
12. representative anonymous shared identity flow;
13. management token recovery negative/positive if browser/backend fixture supports it.

Do not delete older smoke cases merely to make suite green.

## 22.4 DB integration

A fresh DB reset is required after migrations.

Run existing plus new scenarios.

Never test only against a DB that was manually mutated and not freshly migrated.

## 22.5 Production readiness

Run existing readiness checks.

Extend if necessary.

## 22.6 No-runtime-AI

Run the existing bundle/source guards.

Confirm static audio manifest remains consistent.

---

# 23. SECURITY-SPECIFIC NEGATIVE TESTS

Because this wave changes identity, include adversarial checks.

At minimum:

## Ranked attempts

- direct insert denied;
- direct update-to-ranked denied;
- forged WPM claim server-recomputed/rejected/demoted as existing contract specifies;
- unofficial exercise cannot publish ranked score.

## Anonymous identity

- anonymous user cannot read another user’s private attempts;
- anonymous user cannot become another team owner by changing client payload;
- anonymous user cannot update arbitrary profile identity.

## Management capabilities

- token A cannot manage resource B;
- invalid token denied;
- revoked token denied;
- old token denied after rotation;
- token hash cannot be queried through client;
- join code cannot act as manage token;
- candidate assessment invite cannot act as manage token.

## Analytics / logs

Search source and built output to ensure manage secrets are not passed to:

- `track(...)`
- console logs
- public metadata
- canonical URLs
- sitemap
- rendered public text.

---

# 24. SEO REQUIREMENTS IN THIS WAVE

Do not attempt a giant SEO content expansion.

Preserve existing public route intent.

Required:

- no useful route removed;
- root canonical remains correct;
- `/progress` remains noindex;
- `/progress` remains absent from sitemap if that is the current policy;
- query/fragment manage/invite state must not create SEO variants;
- Goal-First homepage still has useful internal links to route families;
- static export still produces expected pages.

If the new route registry can safely drive sitemap validation without large churn, adopt it.

Do not create six goal URLs solely for the six homepage goals.

---

# 25. ADVERTISING REQUIREMENTS

The owner intends advertising monetization, but user value must remain primary.

## Allowed

- post-result;
- discovery;
- explanatory sections;
- leaderboard/library content.

## Forbidden

- active task;
- active candidate assessment;
- active assignment;
- active multiplayer race.

## Required test

Programmatically or via E2E assert that an active task has no rendered ad unit.

If an ad placeholder itself is visually distracting during active state, hide it entirely while active.

Reserve dimensions outside active state to avoid layout shift.

---

# 26. ANALYTICS REQUIREMENTS

Keep consent gating.

Do not log:

- email;
- auth UUID;
- typed content;
- assessment answers;
- management/recovery token;
- full invite secrets.

Add Goal-First events as needed.

At minimum:

- `goal_first_view`
- `goal_selected`
- `goal_workspace_ready`
- `goal_direct_start`
- `goal_to_route_click`
- `task_started`
- `task_completed`
- `result_next_action_clicked`
- `nickname_set`
- `anonymous_identity_created`
- `manage_link_created`
- `manage_link_recovered`

Use coarse categorical properties only.

---

# 27. PERFORMANCE REQUIREMENTS

The new homepage can become expensive if all three engines and all corpora are eagerly bundled.

Inspect actual build output.

Prefer:

- route/workspace code splitting;
- lazy loading for unselected goal workspaces;
- no heavy UI framework addition;
- no unnecessary animation package;
- no duplicate corpora imports.

Do not sacrifice first-interaction latency for Goal-First visual polish.

---

# 28. COPY REQUIREMENTS

Use outcome-led copy.

Prefer:

- “Start typing”
- “Listen and type what you hear”
- “Practice weak areas”
- “Same challenge for everyone today”
- “Progress on this device”
- “No account required”

Avoid exposing backend jargon in normal UI:

- RPC
- RLS
- hydration
- anonymous auth
- migration
- scoring-version identifiers

Technical explanations belong in details/privacy/docs.

Preserve truthful disclaimers:

- Career Mode is practice, not certification;
- Employer Assessments are operational/practice skill checks unless independent validation exists;
- no runtime AI;
- shared features may be unavailable when backend is not configured.

---

# 29. WHAT NOT TO DO

Do not:

1. rebuild the entire app from scratch;
2. replace real engines with a static Figma imitation;
3. change scoring math;
4. introduce runtime AI;
5. remove routes;
6. add paid dependencies without strong necessity;
7. add a large state-management library for a small local state problem;
8. edit old migrations;
9. create a fake backend fallback;
10. fake test results;
11. claim accessibility based only on class names;
12. claim a 44px hit target without measuring/computed evidence;
13. claim a focus trap if only initial focus is set;
14. remove Pass VII improvements merely because an earlier blueprint sample showed a different label grouping;
15. delete existing historical docs/evidence;
16. merge to `main`;
17. deploy production;
18. destroy unrelated uncommitted work.

---

# 30. ERROR RECOVERY / AUTONOMY RULES

## 30.1 If a test fails

Investigate.

Do not immediately weaken the test.

Classify:

- real regression;
- stale test expectation due intentional UX change;
- environment failure;
- external-service limitation.

Update tests only when the product contract intentionally changed.

## 30.2 If a command is flaky

Retry enough to distinguish deterministic failure from transient failure.

Capture logs.

## 30.3 If Docker / local Supabase unavailable

Do as much repository work and non-DB testing as possible.

If GitHub Actions can run the DB integration after branch push:

- push branch near final stage;
- retrieve CI result;
- fix if red.

Do not claim local DB PASS if it never ran.

## 30.4 If Figma inaccessible

Continue using this prompt and current repository.

Do not wait indefinitely.

## 30.5 If external Supabase anonymous-auth activation is required

Implement:

- code;
- local config;
- tests;
- runbook update;

then mark production activation as external/manual.

Do not simulate production activation.

---

# 31. DOCUMENTATION / EVIDENCE ARTIFACTS TO CREATE

At minimum create:

## 31.1 Baseline

`docs/goal-first/00_WAVE1_BASELINE.md`

## 31.2 Architecture

Create if identity architecture materially changes:

`docs/ADR-005-no-account-anonymous-identity.md`

It must explain:

- why visible accounts are removed;
- local-first practice;
- anonymous Auth for shared features;
- nickname;
- resource management/recovery token model;
- security boundaries;
- limitations/recovery tradeoffs;
- deletion/privacy implications.

## 31.3 Implementation evidence

`docs/goal-first/WAVE1_IMPLEMENTATION_EVIDENCE.md`

Include:

- starting SHA;
- ending SHA;
- internal batch commits;
- exact files/migrations changed;
- before/after screenshots;
- UX behavior;
- security behavior;
- tests with exact counts;
- environment limitations;
- unfinished later-wave items.

## 31.4 Optional route matrix

If useful:

`docs/goal-first/WAVE1_ROUTE_MATRIX.md`

Columns:

- route
- goal
- shell migrated?
- active task?
- anonymous identity?
- ad eligibility
- indexability
- desktop verified
- 390 verified
- 320 stress verified

---

# 32. RECOMMENDED INTERNAL COMMIT SERIES

Use logical commits similar to:

1. `docs: baseline Goal-First wave 1 from Pass VII main`
2. `refactor: add Goal-First route and goal contracts`
3. `feat: add anonymous shared identity and resource recovery foundation`
4. `refactor: make practice local-first and remove visible account flows`
5. `refactor: reconcile global shell for Goal-First navigation`
6. `feat: implement Goal-First homepage with real skill workspaces`
7. `refactor: unify active-task result and ad-safe boundaries`
8. `refactor: migrate typing route family to Goal-First shell` — optional
9. `refactor: migrate audio practice routes to shared task shell` — optional
10. `refactor: align library and Career Mode with Goal-First system` — optional
11. `test: expand Goal-First anonymous identity and accessibility coverage`
12. `docs: add Goal-First wave 1 implementation evidence`

You may combine commits if a smaller clean history is more coherent.

Do not mix unrelated security migration and visual polish in the same commit if it makes review difficult.

---

# 33. FINAL FULL GATE BEFORE HANDOFF

Before final response, run as much as the environment permits:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Run DB integration against fresh migrations.

Run existing production readiness script.

Run no-runtime-AI guard.

If static server smoke is available, run it.

If network access allows and it is safe, run deployed demo smoke only as a **baseline/observation** unless this branch has a preview deployment.

Do not claim the production site contains branch changes unless it actually does.

---

# 34. FINAL SOURCE / BUILD FORBIDDEN-PATTERN AUDIT

Search appropriately for:

- `speechSynthesis`
- obvious runtime AI/ASR/TTS API endpoints
- direct attempt insert/update bypasses
- visible `Email me a link`
- visible `Sign in`
- visible `Sign out`
- visible account sync copy
- management token included in `track(`
- management token printed/logged
- placeholder domains/secrets
- accidental manage token in sitemap/canonical generation.

Do not treat historical documentation sentences as production UI failures.

---

# 35. PR / PUSH POLICY

After all feasible local gates are green:

## If Git credentials and GitHub CLI/API are available

You may:

1. push the dedicated feature branch;
2. open one PR.

Suggested title:

> `Goal First Wave 1: no-account foundation + goal-first core UX`

Suggested PR body should include:

- baseline SHA;
- internal batches completed;
- migrations added;
- security invariants;
- test counts;
- screenshot/evidence paths;
- external/manual activation;
- deferred later-wave batches.

## Do not

- merge the PR;
- force-push unrelated history;
- delete branches;
- deploy production.

If CI runs on the PR, inspect it.

Fix branch failures where they are caused by this implementation.

---

# 36. SUCCESS CRITERIA FOR THIS RUN

## Mandatory success

The run is successful only if all of the following are true or transparently documented as an external environment blocker:

### Baseline / safety

- [ ] current main re-baselined;
- [ ] no unrelated work destroyed;
- [ ] baseline evidence created.

### Goal-First contracts

- [ ] six canonical goals exist in code;
- [ ] route/goal mapping has automated integrity checks.

### No-account foundation

- [ ] shared identity can be created without email/login UI;
- [ ] anonymous identity uses server-backed Auth identity, not insecure arbitrary UUID;
- [ ] ordinary practice remains backend-independent;
- [ ] visible Account/magic-link UI removed;
- [ ] nickname is the visible shared identity;
- [ ] creator/admin recovery capability foundation exists securely.

### Global shell

- [ ] Pass VII progressive-disclosure navigation preserved;
- [ ] no horizontal mobile nav rail returns;
- [ ] actual hamburger target ≥44×44;
- [ ] actual modal focus containment verified;
- [ ] locale reactivity preserved;
- [ ] dark continuity preserved.

### Homepage

- [ ] root is genuinely Goal First;
- [ ] six goals visible;
- [ ] first three goals start real exercises on the homepage;
- [ ] no giant tool-card catalog;
- [ ] result/next-action flow exists;
- [ ] technical trust detail remains progressive;
- [ ] homepage bundle is reasonably controlled.

### Task / ads

- [ ] typing/dictation/transcription active state suppresses ads;
- [ ] active focus treatment works beyond typing only;
- [ ] results preserve real scoring logic.

### Security

- [ ] old ranked anti-forgery tests stay green;
- [ ] anonymous identity cannot bypass RLS;
- [ ] resource management capability is scoped and hashed;
- [ ] management secrets do not leak.

### Quality

- [ ] lint green;
- [ ] typecheck green;
- [ ] unit/component green;
- [ ] build green;
- [ ] targeted Goal-First E2E green;
- [ ] full desktop/mobile E2E green before final handoff where environment allows;
- [ ] DB integration green or explicitly pending only because local/CI environment unavailable;
- [ ] no-runtime-AI guard green.

## Optional extension success

If B07–B09 are completed:

- [ ] typing route family uses shared shell;
- [ ] 5-minute semantics preserved;
- [ ] dictation/transcription route family uses shared shell;
- [ ] audio metrics preserved;
- [ ] Career and Library aligned;
- [ ] all corresponding tests green.

---

# 37. DEFERRED LATER-WAVE ITEMS — DO NOT MISREPRESENT AS COMPLETE

Unless you actually implement and prove them, explicitly carry forward:

- deeper Daily/Leaderboard/Seasons Goal-First polish;
- friend/multiplayer full UX polish;
- Teams final dashboard redesign;
- Custom final creator UX polish;
- Assessments final creator/results UX polish;
- standardized EmptyState rollout to every remaining roadmap panel;
- final 320px table scroll affordance polish where still needed;
- final Progress/Privacy information architecture;
- full SEO/analytics/ad production closure;
- whole-product WCAG consistency pass;
- final production launch closure.

This run may establish foundations that make those later batches much easier.

---

# 38. FINAL RESPONSE FORMAT — USE THIS EXACT STRUCTURE

When the long-running session ends, return a structured handoff.

## A. Executive status

One paragraph:

- what this run achieved;
- whether mandatory Wave 1 scope is complete;
- whether optional B07–B09 were completed.

## B. Git state

- starting SHA
- branch
- ending SHA
- commits created
- PR URL if opened
- whether anything was merged/deployed: explicitly say **NO** unless actually done by the owner/external system

## C. Internal batches

Table:

| Internal batch | Status | Key changes | Evidence |
|---|---|---|---|

## D. Architecture changes

- anonymous identity
- local-first persistence
- capability/recovery tokens
- account retirement
- route/goal registry
- task lifecycle

## E. Goal-First UX

- homepage behavior
- six goals
- direct workspace flows
- navigation reconciliation
- mobile/a11y corrections
- screenshots

## F. Security invariants

Report exact evidence that:

- direct attempts remain blocked;
- ranked recomputation remains server-side;
- official binding remains;
- resource token scope tests pass;
- no secret leakage found.

## G. Validation

Table:

| Check | Result | Exact count / note |
|---|---|---|

Include:

- lint
- typecheck
- unit/component
- build
- Playwright desktop
- Playwright mobile
- DB integration
- no-runtime-AI
- production readiness
- static/live smoke where applicable

Do not copy old Pass VII counts if the new run produced different counts.

## H. Visual/accessibility evidence

- tested viewports
- screenshot paths
- hamburger measured target
- focus containment behavior
- `<html lang>` behavior
- 320px overflow result

## I. External/manual actions

Only real external actions, e.g.:

- enable anonymous Auth in production Supabase dashboard if required;
- production secrets/config;
- eventual AdSense activation.

## J. Deferred later-wave backlog

Explicit list.

## K. Recommended next prompt scope

Recommend the next logical combined batches based on what actually remains.

---

# 39. FINAL EXECUTION PRINCIPLE

Do not optimize for “changed many files.”

Optimize for:

> **a coherent, test-proven product transition from the merged Pass VII state into the Goal-First architecture without regressing TypingArena’s security, scoring, runtime-AI policy, accessibility, route portfolio, or ordinary-practice reliability.**

Work autonomously, checkpoint intelligently, test aggressively, preserve evidence, and continue for as long as necessary to complete the mandatory multi-batch scope and, when safely possible, the optional core-route extension.
