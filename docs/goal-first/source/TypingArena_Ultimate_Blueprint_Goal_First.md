# TypingArena — Ultimate Blueprint
## Option 2: Goal First

**Blueprint version:** 1.0  
**Prepared:** 2026-08-30  
**Repository:** `drewsebastians/TypingArena`  
**Repository baseline inspected:** `main` @ `9109fe824ca8b241f3d22129f094f0ee15c51ccd`  
**Figma wireframe reference:** https://www.figma.com/design/vM7Ncr9GRINv0rwbW1n6Qd  
**Runtime AI policy:** No AI inference in production runtime. AI may be used during development only.

---

# 0. Executive Summary

TypingArena already has a technically mature foundation. The inspected repository contains production-grade typing, dictation, and transcription engines; English and Bahasa Indonesia content; deterministic scoring; static audio; local history; server-authoritative ranked submissions; Daily Arena; leaderboards; seasons; friend challenges; multiplayer; teams/classrooms; custom tests; employer assessments; Supabase RLS/RPC trust boundaries; analytics adapters; advertising slots; SEO routes; CI; DB integration tests; Playwright coverage; production-readiness tooling; and a launch runbook.

Therefore, **Option 2 — Goal First is not a rebuild**. It is a controlled product and UX architecture migration that must preserve the proven engine, scoring, security, and deployment foundations while changing how users enter, understand, and move through the product.

The new product loop is:

> **Visit → choose a goal → receive the right setup → start immediately → finish → understand the result → take the next relevant action → return.**

The most important architectural implication is that the approved Goal-First direction is also **no-account-first**. The current repository still contains optional magic-link email authentication, account-backed cross-device history, and creator/admin flows that depend on an authenticated user. The target implementation removes visible Login / Sign up / Account concepts without weakening backend authorization.

The target state is:

- six user goals are the primary entry point;
- the first three goals can launch a real exercise directly from the homepage;
- there is no visible Login, Sign up, Account, password, email-auth, or account menu;
- ordinary practice remains fully local-first;
- shared or ranked features silently establish a pseudonymous anonymous backend identity only when needed;
- the public identity is a nickname, not an email/account;
- Progress is explicitly **“on this device”** and does not promise cross-device sync;
- durable creator resources such as Teams, Custom Tests, and Employer Assessments use secure management/recovery capability tokens rather than email accounts;
- current server-authoritative scoring and RLS/RPC integrity remain intact;
- ads never appear inside an active task;
- all useful existing routes remain functional and SEO-safe;
- production runtime remains deterministic and AI-free.

---

# 1. Product North Star

## 1.1 Core promise

**TypingArena helps people get better at turning what they see or hear into accurate text — and prove that skill when they need to.**

The product organizes around three fundamental skill families:

1. **See → Type** — speed, accuracy, punctuation, data entry.
2. **Hear → Type** — dictation and listening accuracy.
3. **Hear → Transcribe** — longer-form audio-to-text accuracy and playback discipline.

These skills feed four broader outcomes:

- improve personal performance;
- prepare for work;
- compete with others;
- teach, coach, or assess other people.

## 1.2 Primary user question

The homepage should lead with:

> **What do you want to get better at today?**

The six canonical goals are:

| Goal | Outcome | Primary action |
|---|---|---|
| **Type Faster** | Increase speed and accuracy | Start a configured typing sprint |
| **Listen Better** | Improve listening and dictation accuracy | Start dictation |
| **Transcribe Accurately** | Improve longer audio-to-text precision | Start transcription |
| **Prepare for Work** | Practice job-relevant text-entry skills | Open Career Mode |
| **Compete** | Compare performance with others | Enter Daily Arena / competition |
| **Teach / Assess** | Create structured practice or skill checks | Open Teams / Assessments |

## 1.3 Product principles

### P1 — Goal before tool
The primary experience starts with user intent, not a large directory of feature names.

### P2 — Immediate useful action
The first real exercise must be reachable without an onboarding wizard, login wall, or setup ceremony.

### P3 — Human skill is the product
No LLM, ASR, runtime TTS, generated exercise content, or AI scoring is permitted in production runtime.

### P4 — Local-first by default
Practice history, streaks, personal bests, weak-key analysis, and recommendations remain device-local unless a shared feature genuinely requires server persistence.

### P5 — Server trust where trust matters
Ranked/shared features retain the existing server-authoritative evidence model. The UI must not weaken it for convenience.

### P6 — No account UX
The product does not present Login, Sign up, Account, email-auth, password, or global account settings to normal users.

### P7 — Ads never interrupt skill execution
Ads may exist on discovery, explanatory, result, leaderboard, or library surfaces, but never inside an active timed exercise or assessment module.

### P8 — Every route must earn its existence
Every indexable route must remain a complete useful destination, not a thin SEO shell.

---

# 2. Current Repository Baseline

## 2.1 Baseline snapshot

The inspected baseline is:

`main @ 9109fe824ca8b241f3d22129f094f0ee15c51ccd`

Observed repository characteristics:

- Next.js 16 App Router;
- React 19;
- TypeScript strict-oriented project;
- Tailwind CSS v4;
- static-export deployment model;
- Supabase Postgres + Auth + Realtime;
- migrations `0001` through `0014`;
- GitHub Actions for CI, DB integration, and deploy;
- Vitest unit/component suite;
- Playwright desktop/mobile E2E;
- production-readiness and production-smoke scripts;
- static EN/ID corpora and static WAV audio assets;
- no-runtime-AI guard;
- no open PRs found during the baseline inspection.

The existing completion evidence reports a previously frozen functional baseline with 162/162 unit/component tests, 23/23 Playwright specs for desktop and mobile, and 103/103 DB assertions after migrations 0001–0014. These are **pre-Goal-First baseline figures** and must be rerun after the migration.

## 2.2 Existing strengths that must be preserved

Do not replace or weaken these merely to simplify UI implementation:

- `TypingEngine.tsx` timing and scoring semantics;
- true five-minute endurance behavior;
- `DictationEngine.tsx` playback analytics;
- `TranscriptionEngine.tsx` longer-form audio workflow;
- deterministic exercise identity/versioning;
- scoring/alignment/correction logic in `src/lib`;
- official-ranked configuration binding;
- `submit_attempt()` authoritative server recomputation;
- ranked acceptance/rejection rules;
- Daily Arena Asia/Jakarta product-day logic;
- RLS and explicit-grant trust boundary;
- friend-result validation;
- multiplayer host authority and evidence-derived final results;
- team assignment evidence binding;
- assessment invite lifecycle validation;
- static licensed audio and no-runtime-AI guard;
- production readiness and smoke tooling.

## 2.3 Current gaps versus Goal First

| Current repository state | Goal-First target | Change type |
|---|---|---|
| Homepage hero + immediate typing panel + large flat tool grid | Six user goals first, contextual workspace second | Major UX architecture |
| Header exposes a long flat list of feature routes | Compact category navigation + More + proper mobile menu | IA refactor |
| Progress renders `AccountPanel` | Device-local progress with no account UI | Product/data contract change |
| Magic-link email auth exists | No visible email/auth flow | Identity architecture change |
| `submitAttempt` requires a signed-in user | Shared features silently establish anonymous identity | Backend adapter change |
| Cross-device history sync is promoted | No cross-device history promise | Product simplification |
| Teams creator/admin assumes signed-in user | Anonymous owner + secure manage/recovery capability | Backend + UX |
| Custom Tests ownership assumes user account | Anonymous owner + manage token | Backend + UX |
| Assessment creator/admin assumes user account | Anonymous creator + manage token | Backend + UX |
| Mobile header uses horizontal scrolling route strip | Proper compact mobile menu | UX/accessibility |
| Routes assemble UI patterns independently | Shared shell/config/task/result patterns | Component architecture |

## 2.4 Implementation conclusion

This is **not safe as a one-batch visual restyle**. The no-account identity contract must be established before the full UI migration. Otherwise, Goal-First pages would still contain hidden account dependencies and later batches would need to undo large amounts of work.

---

# 3. Source-of-Truth Hierarchy

When implementation details conflict, use this order:

1. **This Ultimate Blueprint** — target product behavior and Definition of Done.
2. **Goal-First Figma wireframe** — information hierarchy, page composition, responsive intent.
3. **Existing security/scoring ADRs and regression tests** — trust, scoring, product-day, authorization.
4. **Current production code** — reuse unless explicitly superseded here.
5. **Current README and historical completion report** — historical reference; update after migration.

The Figma file is a **wireframe and UX contract**, not a requirement to rewrite the technical stack or replace Geist solely because the wireframe used another design font.

---

# 4. Target Information Architecture

## 4.1 Desktop global navigation

Primary navigation:

- **Typing Test**
- **Dictation**
- **Practice**
- **Arena**
- **Progress**
- **More**
- locale control (`EN ↔ ID`)
- local streak indicator

There is no username/account/email display in the global header.

## 4.2 Menu grouping

### Typing Test

- Typing Speed Test
- 1 Minute Typing Test
- 5 Minute Typing Test
- Indonesian Typing Test
- Tes Mengetik Cepat
- Data Entry Test
- Punctuation Typing Test

### Dictation

- Dictation Practice
- English Dictation
- Dikte Bahasa Indonesia
- Noise Challenge

### Practice

- Transcription Practice
- Transcription Library
- Career Mode
- Custom Tests

### Arena

- Daily Arena
- Leaderboard
- Ranked Seasons
- Multiplayer
- Friend Challenges

### More

- Teams & Classrooms
- Employer Assessments
- Privacy

## 4.3 Mobile navigation

Replace the current horizontal scrolling route strip with:

- brand;
- language control;
- menu button;
- optional streak if space allows.

The menu must be an accessible drawer/dialog with the same category grouping as desktop.

## 4.4 URL policy

Keep the existing useful public routes. Goals are a **navigation/orchestration layer** over those routes and engines, not a reason to create dozens of new keyword URLs.

---

# 5. No-Account Identity and Persistence Architecture

## 5.1 Identity levels

### Level A — Local visitor

Used for ordinary practice.

- no backend identity required;
- no email;
- no account;
- local history and streak on device;
- optional nickname stored locally.

### Level B — Shared pseudonymous identity

Created silently only when a visitor uses a server-backed feature such as ranked submission, Daily Arena, Teams, Custom creator/admin, or Assessment creator/admin.

Target implementation:

- Supabase Anonymous Auth;
- persistent browser session;
- no visible authentication ceremony;
- user-facing wording remains “No account required.”

### Level C — Resource management/recovery capability

Used for durable creator-owned resources where losing the browser session would otherwise orphan administration.

Required for:

- Teams/Classrooms owner management;
- Custom Tests owner management;
- Employer Assessments owner management.

A high-entropy management/recovery token is issued. The database stores only its hash.

## 5.2 Anonymous identity bootstrap

Introduce one adapter with a contract equivalent to:

```ts
ensureSharedIdentity(): Promise<{ userId: string }>
```

Behavior:

1. if the backend is not configured, throw the existing honest remote-unavailable error;
2. if an auth session exists, reuse it;
3. otherwise create a Supabase anonymous session;
4. ensure a profile row exists;
5. never request email, password, OTP, or magic link.

Do not silently create backend identities for visitors who only perform local practice.

## 5.3 Nickname model

Nickname is the normal public identity.

Rules:

- optional until a shared/ranked feature needs it;
- prompt before first public/social submission if missing;
- 2–24 characters;
- sanitized;
- stored locally for reuse;
- mirrored to the anonymous shared profile when available;
- never expose auth UUID as the user-facing identity;
- “Change nickname” belongs on relevant shared surfaces or utility controls, not an Account page.

## 5.4 Progress/history contract

The product promise becomes:

> **Progress on this device.**

Local storage remains canonical for normal practice history.

The product must no longer promise:

- email-linked cloud history;
- account-based cross-device sync;
- account recovery of ordinary practice history.

Server persistence remains appropriate for:

- public ranked attempts;
- Daily Arena;
- team/classroom assignment evidence;
- multiplayer authoritative results;
- other shared competitive or assessment artifacts where the existing trust model requires persistence.

## 5.5 Retire visible account model

Remove from production UI:

- `AccountPanel`;
- email field;
- “Email me a link”;
- “Sign in” / “Sign out”;
- “Delete account”;
- cross-device history import/sync messaging;
- account email display.

Do **not** rewrite migrations `0001`–`0014`. Use forward migrations and adapter changes.

## 5.6 Management/recovery token rules

Management tokens must:

- contain at least 128 bits of entropy;
- use cryptographically secure randomness;
- be stored as hashes in the database;
- be scoped to exactly one resource;
- be revocable and rotatable;
- be rate-limited when validated;
- never enter analytics;
- never appear in public views;
- never become a sitemap or canonical URL dimension.

Prefer a non-secret resource ID in query state and the secret token in URL fragment, for example:

```text
/teams?team=<id>#manage=<token>
/custom?test=<id>#manage=<token>
/assessments?assessment=<id>#manage=<token>
```

The final syntax may differ, but secret-bearing state must remain non-indexable and non-analytic.

## 5.7 Privacy controls

Replace account deletion with two explicit controls:

1. **Clear progress on this device** — removes local practice data.
2. **Delete shared data from this device identity** — server-side deletion for the current anonymous identity and owned/shared data according to policy.

The consequence of each action must be explained before confirmation.

---

# 6. Target Application Architecture

## 6.1 Preserve core stack

Continue using:

- Next.js App Router;
- static export;
- Supabase direct client;
- Postgres RLS/RPC validation;
- Realtime where needed;
- reviewed static content;
- current CI/deployment model.

## 6.2 Presentation architecture

Introduce a small shared application/design layer rather than independently assembling every route.

Recommended responsibility structure:

```text
src/
  app/
    ...existing routes...
  components/
    shell/
      AppHeader.tsx
      DesktopNav.tsx
      MobileMenu.tsx
      AppFooter.tsx
    goals/
      GoalGrid.tsx
      GoalCard.tsx
      GoalWorkspace.tsx
      GoalSummaryBar.tsx
    tool/
      ToolPageShell.tsx
      ToolConfigBar.tsx
      ActiveTaskBoundary.tsx
      TaskStatusStrip.tsx
      ResultSection.tsx
      NextStepCard.tsx
      RelatedTools.tsx
    identity/
      NicknamePrompt.tsx
      SharedFeatureStatus.tsx
      ManageLinkPanel.tsx
    monetization/
      SafeAdSlot.tsx
    ...existing engines and domain panels...
  lib/
    goals.ts
    routeRegistry.ts
    sharedIdentity.ts
    resourceAccess.ts
    ...existing domain logic...
```

Exact names may change; responsibilities should not collapse back into giant route components.

## 6.3 Central route registry

Create one route metadata registry used by:

- global menus;
- homepage goal mapping;
- related-tool links;
- sitemap consistency tests;
- analytics category tagging;
- route smoke coverage.

Avoid maintaining separate hand-written route lists in Header, Homepage, Sitemap, and tests.

---

# 7. Visual and Interaction System

## 7.1 Direction

Goal-First visual language:

- white/light neutral background;
- black/near-black typography;
- subtle zinc/gray borders;
- restrained amber accent based around `#F5B82E`;
- rounded cards and pills;
- clarity and utility over decorative illustration.

The product should not become a neon gaming interface or a generic corporate SaaS dashboard.

## 7.2 Typography

Keep the current Geist / Geist Mono technical setup unless a later high-fidelity design decision explicitly changes it.

Suggested hierarchy:

- H1: 32–40 px desktop / 26–30 px mobile;
- H2: 20–28 px;
- card title: 15–18 px semibold/bold;
- body: 14–16 px;
- metadata/status: 11–13 px.

## 7.3 Layout widths

Recommended:

- global shell: `max-w-6xl`;
- active tool: `max-w-4xl` to `max-w-5xl`;
- explanatory/reading content: `max-w-3xl`.

## 7.4 Core card types

- goal card;
- configuration card/bar;
- active task card;
- result card;
- explanation card;
- next-step card;
- resource management/recovery card;
- ad slot.

## 7.5 Active task focus state

When an exercise is active:

- reduce surrounding visual noise;
- hide/suppress ads near the task;
- keep essential navigation available but subordinate;
- avoid layout shifts;
- preserve keyboard focus;
- preserve paste/focus/integrity behavior;
- keep timer/score status consistent.

---

# 8. Homepage Specification — `/`

## 8.1 Above the fold

Desktop order:

1. global header;
2. H1: **“What do you want to get better at today?”**
3. support copy: choose a goal, start immediately, no account required;
4. six goal cards in a 3×2 grid.

Mobile:

- one-column goal stack;
- no horizontal carousel for primary goals;
- first goals should be discoverable without excessive scrolling.

## 8.2 Goal cards

Each card contains:

- simple icon/mark;
- goal title;
- one-line outcome;
- explicit CTA.

Avoid internal scoring or backend terminology in goal cards.

## 8.3 Goal workspace

Default selection: **Type Faster**.

Selecting a goal updates a contextual workspace below the grid.

### Type Faster

- language;
- duration;
- mode;
- real `TypingEngine` flow;
- result;
- next recommendation.

### Listen Better

- language;
- clip/difficulty controls;
- real `DictationEngine`;
- result;
- next recommendation.

### Transcribe Accurately

- language/difficulty/clip;
- real `TranscriptionEngine`;
- result;
- library CTA.

### Prepare for Work

Show Career track choices and route into `/career`.

### Compete

Show Daily Arena as the primary entry, plus Leaderboard and Multiplayer.

### Teach / Assess

Show Teams/Classrooms and Employer Assessments with concise difference copy.

## 8.4 Advertising

Homepage ad may appear only:

- after an exercise result; or
- below inactive discovery/supporting content.

Never place it inside an active engine.

## 8.5 Supporting sections

After the primary workspace:

1. **Master the 3 skills that matter** — See/Typing, Hear/Dictation, Transcribe.
2. **A clear path from practice to proof** — Train → Improve → Compete → Prove.
3. **Explore more to go further** — Daily Arena, Career Mode, Teams, Assessments.
4. Footer.

Remove the current giant flat tool-discovery grid from the root page.

---

# 9. Route Matrix

| Route | Primary goal | Main pattern | Shared identity | Ad policy | Indexing |
|---|---|---|---|---|---|
| `/` | All | Goal grid + contextual workspace | Only for shared action | Post-result / discovery | Index |
| `/typing-test` | Type Faster | Typing tool | Only ranked/shared submit | Post-result | Index |
| `/typing-test/1-minute` | Type Faster | 60s preset | Only ranked/shared submit | Post-result | Index |
| `/typing-test/5-minute` | Type Faster | 5-min endurance | Only ranked/shared submit | Post-result | Index |
| `/typing-test/indonesian` | Type Faster | Indonesian preset | Only ranked/shared submit | Post-result | Index |
| `/tes-mengetik` | Type Faster | Indonesian localized tool | Only ranked/shared submit | Post-result | Index |
| `/data-entry-test` | Prepare for Work | Data-entry typing | Only shared submit | Post-result | Index |
| `/punctuation-typing-test` | Prepare for Work | Precision typing | Only shared submit | Post-result | Index |
| `/dictation` | Listen Better | Dictation tool | Only shared submit | Post-result | Index |
| `/dictation/english` | Listen Better | EN preset | Only shared submit | Post-result | Index |
| `/dictation/indonesian` | Listen Better | ID preset | Only shared submit | Post-result | Index |
| `/noise-challenge` | Listen Better | Noise-tier dictation | Only shared submit | Post-result | Index |
| `/transcription-practice` | Transcribe Accurately | Audio + editor | Only shared submit | Post-result | Index |
| `/transcription-library` | Transcribe Accurately | Filtered clip library | No to browse | Between content blocks | Index |
| `/career` | Prepare for Work | Track chooser + runner | Only when shared feature requires | After track/result | Index |
| `/daily-arena` | Compete | Daily challenge + board | Yes, silently | Post-result/standings | Index |
| `/leaderboard` | Compete | Ranked board | No to view | Below board | Index |
| `/seasons` | Compete | Live + archived ladders | No to view | Below content | Index |
| `/multiplayer` | Compete | Create/join room | Yes, silently | Lobby/result only | Index |
| `/friends` | Compete | Create/open challenge | Nickname/token based | Result/discovery only | Index |
| `/teams` | Teach / Assess | Create/join/manage team | Anonymous + manage token | Outside assignment runner | Index |
| `/custom` | Practice / Teach | Create/open custom practice | Anonymous + manage token | Outside active practice | Index |
| `/assessments` | Teach / Assess | Creator/admin or candidate invite | Anonymous creator; candidate token | Never during candidate modules | Index base route |
| `/progress` | Improve | Device-local history | Not required | Bottom/non-task only | **Noindex** |
| `/privacy` | Utility | Privacy + controls | Only for shared deletion | Optional low-priority | Index |

---

# 10. Route-Family Specifications

## 10.1 Typing family

Routes:

- `/typing-test`
- `/typing-test/1-minute`
- `/typing-test/5-minute`
- `/typing-test/indonesian`
- `/tes-mengetik`
- `/data-entry-test`
- `/punctuation-typing-test`

Shared composition:

1. concise H1 + promise;
2. preset/config controls;
3. active typing task;
4. result;
5. ad after result;
6. scoring/explanation relevant to the route;
7. next recommended/related test.

Preset routes must initialize the advertised preset, not merely change heading copy.

Five-minute route must preserve true full-clock endurance semantics.

## 10.2 Dictation family

Routes:

- `/dictation`
- `/dictation/english`
- `/dictation/indonesian`
- `/noise-challenge`

Shared composition:

1. H1 and clip context;
2. language/difficulty/noise controls as applicable;
3. accessible audio controls;
4. text input;
5. submit/result;
6. playback metrics;
7. ad after result;
8. next clip / related practice.

Transcript remains hidden until submission.

## 10.3 Transcription

### `/transcription-practice`

Use the full transcription workspace with:

- longer editor;
- audio controls;
- playback stats;
- result comparison;
- next clip.

### `/transcription-library`

Provide:

- language filter;
- difficulty filter;
- length filter;
- topic filter;
- reviewed clip cards;
- direct open/start;
- no “AI transcription” positioning.

## 10.4 Career Mode — `/career`

Keep the five existing tracks:

- Data Entry;
- Office / Admin;
- Numbers & Codes;
- Punctuation Precision;
- Transcription.

Hierarchy:

1. H1 + “job-relevant practice, not certification” disclosure;
2. track cards;
3. module/time expectations;
4. real runner;
5. score band + module breakdown;
6. recommended next practice;
7. ad after completion.

No account requirement.

## 10.5 Daily Arena — `/daily-arena`

Target:

- today’s Asia/Jakarta challenge;
- explicit “same challenge for everyone today” explanation;
- nickname prompt only when required;
- one primary Start action;
- no ad during active challenge;
- post-result placement + Daily leaderboard;
- tomorrow rollover explanation.

Preserve server challenge-date/version binding.

## 10.6 Leaderboard — `/leaderboard`

Target:

- mode/language/duration filters;
- readable rank table;
- clearly explain server-accepted ranked results only;
- personal placement only when current anonymous identity has one;
- no login prompt.

## 10.7 Seasons — `/seasons`

Target:

- current live month first;
- archived months below;
- read-only archive explanation;
- consistent links to competition views.

## 10.8 Multiplayer — `/multiplayer`

Flow:

1. nickname;
2. Create room or Join room;
3. room code / host control;
4. lobby presence;
5. countdown;
6. active race — no ads;
7. validated final board;
8. rematch if host.

Live progress is advisory; final validated board remains authoritative.

## 10.9 Friend Challenges — `/friends`

Flow:

- create deterministic challenge;
- share link;
- recipient opens same exercise;
- recipient chooses nickname;
- result through existing validating RPC;
- comparison/challenge result.

Maintain the documented casual-integrity limitation honestly.

## 10.10 Teams & Classrooms — `/teams`

No account concept.

Landing choices:

- **Create team/class**
- **Join with code**

### Create flow

1. silently ensure shared anonymous identity;
2. create team server-side;
3. show join code;
4. issue management/recovery link/token;
5. tell creator to save it if another device may be needed;
6. open dashboard.

### Join flow

1. nickname;
2. join code;
3. silently ensure shared identity;
4. join membership;
5. open assignments.

### Dashboard

- members;
- assignments;
- completion rate;
- per-assignment summary;
- admin/owner controls;
- no member emails.

Assignment runners use real engines and never show ads while active.

## 10.11 Custom Tests — `/custom`

Flow:

1. create title + passage;
2. sanitize and validate length;
3. create unlisted practice link;
4. issue owner management/recovery token;
5. recipient practices immediately;
6. custom attempts remain unranked by policy.

No “My tests requires sign in.”

## 10.12 Employer Assessments — `/assessments`

### Base creator/admin mode

- explain operational skill check vs validated certification;
- choose modules;
- set title/window;
- silently establish anonymous owner identity;
- generate candidate invite;
- generate owner management/recovery token;
- keep results owner-private.

### Candidate invite mode

- no signup/account;
- validate invite lifecycle;
- show title/module count;
- run exact saved module sequence;
- no ads during modules;
- submit validated summary;
- completion acknowledgement.

Invite/query variants canonicalize to the base route and must not become separate indexable URLs.

## 10.13 Progress — `/progress`

Title:

> **Progress on this device**

Sections:

- skill summary;
- typing/dictation/transcription counts;
- streak;
- personal bests;
- weak keys/bigrams;
- recent activity;
- recommended next exercise;
- local export/clear;
- shared-data deletion if anonymous identity exists.

Remove AccountPanel and sync banners that imply cloud history.

## 10.14 Privacy — `/privacy`

Explain in plain language:

- what stays local;
- what is sent only for shared features;
- anonymous backend identity;
- nickname/public results;
- analytics consent;
- advertising rules;
- management/recovery links;
- local deletion;
- shared-data deletion.

---

# 11. Engine and Result Contracts

## 11.1 Engine preservation

The UI migration wraps the existing engines. It must not duplicate scoring calculations in route/page components.

## 11.2 Unified active-task lifecycle

Every core exercise should expose a common lifecycle to surrounding UI:

```text
configuring → ready → active → completing → result → next-action
```

The lifecycle drives:

- ad suppression;
- focus-mode presentation;
- analytics;
- result placement;
- navigation safeguards if required.

## 11.3 Result contract

Every result answers:

1. **How did I do?**
2. **What went wrong?**
3. **What should I do next?**

Typing examples:

- gross/net WPM;
- accuracy;
- corrected/unfixed errors;
- weak keys/bigrams;
- personal best.

Audio examples:

- normalized/word/punctuation score;
- replay ratio;
- pause count;
- effective WPM where applicable.

## 11.4 Recommendations

Recommendations remain deterministic and rule-based from local history. Goal selection may constrain the recommendation candidate set but must not introduce runtime AI.

---

# 12. Advertising Blueprint

## 12.1 Allowed placements

- after a completed result;
- between explanatory sections;
- below leaderboards/library content;
- discovery surfaces;
- non-task footer/content areas.

## 12.2 Forbidden placements

- inside active typing;
- inside active dictation;
- inside active transcription;
- inside Daily timed challenge;
- inside multiplayer race;
- inside team assignment runner;
- inside employer candidate assessment modules;
- any placement that shifts task layout while running.

## 12.3 Technical contract

Evolve/wrap the current ad component with task awareness, conceptually:

```tsx
<SafeAdSlot
  slot="..."
  context="result"
  activeTask={false}
/>
```

When `activeTask === true`, render no ad.

## 12.4 External approval

AdSense approval remains an external operational state. The product must behave cleanly with no publisher configuration.

---

# 13. Analytics Blueprint

## 13.1 Principles

- consent-gated;
- PII-free;
- no email identity;
- no management/recovery tokens;
- no full typed text;
- no assessment answers in analytics.

## 13.2 Goal-First events

Add or map:

- `goal_first_view`
- `goal_selected`
- `goal_workspace_ready`
- `goal_direct_start`
- `goal_to_route_click`
- `tool_config_changed`
- `task_started`
- `task_completed`
- `result_next_action_clicked`
- `nickname_set`
- `anonymous_identity_created`
- `manage_link_created`
- `manage_link_recovered`

Retire account-login/signout events from normal product analytics after account UX removal.

## 13.3 Funnels

### Acquisition → first value

`landing_view → goal_selected → task_started → task_completed`

### Improvement loop

`task_completed → result_next_action_clicked → next task started`

### Competition

`goal_selected(compete) → daily/multiplayer/friend → valid result`

### Teach/Assess

`goal_selected(teach_assess) → resource created → invite/join used → completion`

---

# 14. SEO Blueprint

## 14.1 Preserve route portfolio

Keep the existing useful route inventory and distinct search intent.

## 14.2 Canonical policy

- each static tool route canonicalizes to itself;
- query/fragment UI state does not create canonical variants;
- `/assessments?invite=...` canonicalizes to `/assessments`;
- team/custom management state canonicalizes to base route;
- `/progress` remains noindex and omitted from sitemap.

## 14.3 Indexable page requirements

Each indexable tool route contains:

- distinct H1;
- genuinely useful interactive/browse experience;
- concise explanation;
- relevant scoring/usage transparency;
- related next action;
- no keyword stuffing.

## 14.4 Registry-driven consistency

Use the route registry in sitemap tests so a route cannot silently disappear from public coverage.

---

# 15. Accessibility Blueprint

Target WCAG 2.2 AA-oriented implementation.

Requirements:

- all configuration controls keyboard accessible;
- visible focus states;
- mobile menu focus trap and Escape close;
- semantic heading hierarchy;
- correct button/link semantics;
- audio controls have accessible names;
- result/status live regions used carefully;
- color is not the only error/correctness indicator;
- reduced-motion preferences respected;
- no forced autoplay audio;
- touch targets approximately 44 px where practical;
- responsive changes do not destroy active task data;
- desktop and mobile tested.

---

# 16. Performance Blueprint

## 16.1 Goals

- preserve fast static pages;
- avoid loading every heavy feature on the homepage;
- preserve route-level code splitting;
- avoid ad-induced CLS.

## 16.2 Guidelines

- lazy-load homepage goal engines not currently selected;
- dynamically load heavy social/admin panels where useful;
- keep corpus/static data imports route-specific when possible;
- reserve ad dimensions;
- do not add an animation framework for basic transitions;
- maintain static-export compatibility;
- inspect build chunks after major route-family batches.

---

# 17. Security and Trust Blueprint

## 17.1 Preserve server-authoritative ranked trust

Clients provide evidence; the server recomputes authoritative values and decides ranked acceptance.

Do not weaken:

- direct attempts INSERT/UPDATE revocations;
- official-ranked config binding;
- RLS owner/member boundaries;
- multiplayer host authority;
- assignment-to-real-attempt binding;
- assessment invite lifecycle;
- result rate limits.

## 17.2 Anonymous Auth is not “trust the browser”

Anonymous Auth changes how identity is acquired, not how authorization works. Backend authorization continues to use `auth.uid()` and server-side policy/RPC checks.

## 17.3 Capability-token security

Management tokens:

- are bearer secrets;
- are hashed in DB;
- are one-resource scoped;
- can be rotated/revoked;
- are rate-limited;
- never appear in public views;
- never enter analytics;
- do not grant broader access than the intended resource.

## 17.4 Migration policy

Never rewrite migrations `0001`–`0014`. Add fix-forward migrations beginning after the current chain.

---

# 18. No-Runtime-AI and Content Blueprint

Hard invariants:

- no LLM API;
- no ASR API;
- no runtime generative content;
- no runtime TTS;
- no `speechSynthesis` production path;
- reviewed static EN/ID corpora;
- static pre-generated audio;
- deterministic versioned exercises.

AI may be used during development, coding, research, or asset preparation, but production user interactions must not depend on AI inference.

The existing CI guard must remain.

---

# 19. Backend Evolution

Exact SQL is implementation work and must follow fresh schema inspection, but the intended forward direction is:

## Migration 0015 — Anonymous identity compatibility

Objectives:

- support anonymous Supabase users in profile creation;
- ensure policy/RPC assumptions do not require email;
- preserve authenticated-role RLS behavior for anonymous Auth users;
- keep authoritative write restrictions unchanged.

Also update local Supabase config and production runbook to enable anonymous sign-in.

## Migration 0016 — Resource management/recovery capabilities

Add hashed capability-token support for:

- Teams;
- Custom Tests;
- Assessments.

Add server-side operations for:

- issue/rotate/revoke token;
- validate token;
- recover/reattach management to a new anonymous identity where allowed;
- rate-limit recovery attempts.

## Migration 0017 — Data minimization and cleanup alignment

If required after audit:

- align purge behavior for abandoned anonymous identities;
- minimize unnecessary practice-result server retention;
- define shared-data deletion for anonymous identity;
- update expiration cleanup for new capability rows.

Migration numbering may expand if isolated security fixes are needed. Do not combine unrelated fixes into one giant SQL file.

---

# 20. Component and Code Migration Map

## 20.1 Preserve and wrap

- `TypingEngine.tsx`
- `DictationEngine.tsx`
- `TranscriptionEngine.tsx`
- reusable logic from `ResultCard.tsx`
- `ErrorHeatmap.tsx`
- proven domain logic in `src/lib`.

## 20.2 Heavily refactor

- `Header.tsx`
- `TypingTestPanel.tsx`
- `SkillProfile.tsx` placement/summary
- `TeamsPanel.tsx`
- `CustomPanel.tsx`
- `AssessmentsPanel.tsx`
- `CareerPanel.tsx`
- `MultiplayerPanel.tsx`
- `SeasonsPanel.tsx`
- `TranscriptionLibraryPanel.tsx`.

## 20.3 Retire from production UI

- `AccountPanel.tsx`

Migrate any still-useful privacy/deletion logic before deletion.

## 20.4 Libraries to evolve

- `src/lib/remote.ts` — anonymous shared identity instead of visible email account contract;
- `src/lib/sync.ts` — targeted ranked/shared persistence instead of account history sync;
- `src/lib/history.ts` — device-local canonical history and nickname;
- `src/lib/i18n.ts` — Goal-First shell/copy;
- `src/lib/analytics.ts` — Goal-First event model, no account events;
- `src/lib/config.ts` — shared identity/backend settings if needed;
- SEO/sitemap helpers — registry-driven route coverage.

---

# 21. Copy Rules

## 21.1 Preferred wording

- “Start typing”
- “Listen and type what you hear”
- “Practice weak areas”
- “Same challenge for everyone today”
- “Progress on this device”
- “No account required”

## 21.2 Avoid in primary UI

- RPC;
- RLS;
- hydration;
- anonymous auth;
- scoring version IDs;
- normalization algorithm names.

Technical transparency belongs in scoring explanations, Privacy, and documentation.

## 21.3 No deceptive claims

Career Mode is not certification.

Employer Assessments remain an operational/practice skills check unless independently validated later.

---

# 22. Testing Blueprint

## 22.1 Minimum gates per implementation batch

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Additionally:

- targeted Playwright for affected routes;
- DB integration for migrations/identity/RLS/RPC/ranked/social/team/custom/assessment changes;
- no-runtime-AI guard remains green.

## 22.2 New unit/component coverage

Add tests for:

- goal registry;
- goal mapping;
- GoalWorkspace state;
- route registry uniqueness;
- anonymous identity bootstrap idempotency;
- nickname storage/sanitization;
- management-token parsing/redaction;
- active-task ad suppression;
- local-only Progress semantics;
- absence of email/account UI.

## 22.3 New E2E coverage

Desktop + mobile:

1. Goal-First homepage renders;
2. all six goal cards keyboard reachable;
3. Type Faster can start directly on homepage;
4. Listen Better can start directly on homepage;
5. Transcribe Accurately can start directly on homepage;
6. active task has no rendered ad;
7. post-result ad is outside task;
8. mobile menu works accessibly;
9. no Login / Sign up / Account / email-auth CTA on global product surfaces;
10. Progress says “on this device” and contains no account panel;
11. anonymous ranked flow establishes shared identity and submits valid evidence;
12. anonymous team create/join flow;
13. management-link recovery flow;
14. anonymous Custom Test creator flow;
15. anonymous Assessment creator + no-signup candidate flow;
16. existing five-minute/audio/library/career/leaderboard/degradation behavior remains green.

## 22.4 DB integration additions

Prove:

- anonymous Auth user can call intended RPCs;
- anonymous user cannot bypass direct-write restrictions;
- anonymous ranked result is server-recomputed;
- nickname input is sanitized and contains no private email requirement;
- team management token cannot manage another team;
- rotated/revoked token fails;
- Custom token is resource-scoped;
- Assessment token is resource-scoped;
- candidate invite cannot become admin capability;
- deletion removes intended shared identity data;
- backward-compatible historical rows remain valid where retained.

## 22.5 Production/static checks

Extend readiness/smoke tooling to detect:

- accidental Login / Sign up / Account UI reintroduction;
- runtime AI endpoint leakage;
- missing Goal-First root markers;
- missing public routes;
- accidental indexing of `/progress`;
- token/query leakage into canonical URLs;
- placeholder config.

---

# 23. Deployment and Operations

## 23.1 Deployment model

Keep static-export frontend + Supabase shared backend.

## 23.2 New external activation

Production runbook must include:

- enable Supabase anonymous sign-in;
- confirm rate limits appropriate for anonymous session creation;
- verify anonymous profile creation;
- validate management-token RPC grants;
- remove magic-link email configuration from mandatory launch steps if no longer used.

## 23.3 Rollback

UI batches must be revertible without rolling back historical DB migrations.

New migrations should be forward-compatible where practical until corresponding UI is deployed.

## 23.4 Production smoke

Verify:

- root Goal-First content;
- representative typing/dictation/transcription route;
- static audio;
- leaderboard read;
- anonymous shared action when backend configured;
- no visible account UI;
- sitemap/robots/canonical;
- no placeholder configuration.

---

# 24. Success Metrics

Do not invent numeric targets before baseline analytics exists. Measure:

## Activation

- landing → goal selection;
- goal selection → task start;
- task start → completion;
- time to first task start.

## Improvement loop

- result → next action click;
- same-session second task;
- D1/D7 return by first selected goal;
- streak continuation.

## Goal distribution

- Type Faster;
- Listen Better;
- Transcribe Accurately;
- Prepare for Work;
- Compete;
- Teach / Assess.

## Shared-feature conversion

- Daily participation;
- nickname completion;
- multiplayer create/join;
- friend challenge create/open;
- team create/join;
- assessment create/invite completion.

## Monetization quality

- ad impressions per completed useful session;
- CLS attributable to ad slots;
- abandonment before vs after ad-containing sections;
- zero active-task ad violations.

---

# 25. Ultimate Definition of Done

## Product / UX

- [ ] Homepage is Goal First with six goals.
- [ ] Type Faster, Listen Better, and Transcribe Accurately can launch a real task directly from `/`.
- [ ] Compact global IA replaces the current flat route-heavy header.
- [ ] Mobile uses a proper menu rather than a full horizontal route strip.
- [ ] All current useful public routes remain reachable and functional.
- [ ] Route families use consistent config/task/result/next-action patterns.
- [ ] Figma layout intent is materially represented on desktop and mobile.

## No-account architecture

- [ ] No visible Login / Sign up / Account / email-auth UI remains.
- [ ] `AccountPanel` is removed from production rendering.
- [ ] Shared features bootstrap pseudonymous anonymous identity silently.
- [ ] Nickname is the public identity.
- [ ] Progress is explicitly device-local.
- [ ] No cross-device history-sync promise remains.
- [ ] Teams, Custom Tests, and Assessments can be created without email account.
- [ ] Durable creator resources have secure management/recovery capability.

## Engines

- [ ] Typing scoring/timers preserved.
- [ ] Five-minute route still runs full clock.
- [ ] Dictation/transcription playback metrics preserved.
- [ ] Career modules use real engines.
- [ ] Team assignments and candidate modules use real engines.

## Trust / security

- [ ] Ranked attempts remain server-authoritative.
- [ ] Direct-write bypasses remain closed.
- [ ] Official ranked config binding remains enforced.
- [ ] Anonymous identity does not weaken RLS/RPC boundaries.
- [ ] Management tokens are hashed, scoped, revocable, and rate-limited.
- [ ] No management token enters analytics, public views, sitemap, or canonical URLs.

## Advertising

- [ ] No ad renders inside any active task.
- [ ] No ad renders inside active candidate assessment modules.
- [ ] Post-result/discovery ads degrade safely when AdSense is absent.

## Privacy

- [ ] Local data controls work.
- [ ] Shared anonymous identity deletion works.
- [ ] Privacy copy accurately explains local/shared data.
- [ ] No email is required or displayed as identity.

## SEO

- [ ] Existing useful public route coverage remains.
- [ ] `/progress` remains noindex.
- [ ] Query/token variants canonicalize safely.
- [ ] Sitemap/robots/canonical production smoke passes.

## No-runtime-AI

- [ ] Existing guard remains green.
- [ ] No runtime LLM/ASR/TTS/generative dependency is introduced.

## Quality gates

- [ ] lint clean.
- [ ] typecheck clean.
- [ ] all unit/component tests green.
- [ ] all Playwright desktop tests green.
- [ ] all Playwright mobile tests green.
- [ ] all DB integration scenarios green.
- [ ] production build green.
- [ ] production readiness script green.
- [ ] deployed production smoke green.

## Documentation

- [ ] README describes Goal First and the no-account architecture.
- [ ] ADR/trust docs cover anonymous identity and management capabilities.
- [ ] production runbook updated.
- [ ] production smoke matrix updated.
- [ ] historical pre-Goal-First completion report is clearly superseded or marked historical.

---

# 26. Implementation Guardrails

1. **Do not perform a big-bang rewrite.** Follow the Grand Batching Plan.
2. **Do not rewrite migrations `0001`–`0014`.** Add forward migrations.
3. **Do not weaken server-authoritative scoring to simplify anonymous UX.**
4. **Do not replace real engines with mock cards to imitate Figma.**
5. **Do not introduce runtime AI.**
6. **Do not add SEO routes without distinct user/search value.**
7. **Do not place ads inside active tasks.**
8. **Do not leave email/account copy after identity migration.**
9. **Do not promise cross-device progress.**
10. **Do not delete proven feature logic until its replacement path is regression-tested.**
11. **Do not leak capability tokens to analytics, logs, canonical URLs, or public views.**
12. **Do not treat anonymous Auth as weaker authorization.** Keep RLS/RPC server checks authoritative.

---

# 27. Repository Evidence Used

Primary artifacts inspected for this blueprint include:

- `README.md`
- `BLUEPRINT_COMPLETION_REPORT.md`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/progress/page.tsx`
- `src/components/Header.tsx`
- `src/components/AccountPanel.tsx`
- `src/components/TeamsPanel.tsx`
- `src/components/AssessmentsPanel.tsx`
- `src/lib/remote.ts`
- `supabase/config.toml`
- `supabase/migrations/0001...0014`
- `.github/workflows/*`
- `tests/*`
- `e2e/smoke.spec.ts`
- production readiness/smoke documentation and scripts.

Repository state was inspected on 2026-08-30; the latest accessible `main` commit at inspection was `9109fe824ca8b241f3d22129f094f0ee15c51ccd`.

---

# 28. Final Target Statement

When this blueprint is complete, TypingArena will retain the technical maturity of the existing repository while becoming materially simpler to understand and use:

> **A visitor arrives, states what they want to improve, starts the right exercise immediately, sees a trustworthy result, and knows exactly what to do next — without creating an account, without runtime AI, and without advertising interrupting the skill itself.**
