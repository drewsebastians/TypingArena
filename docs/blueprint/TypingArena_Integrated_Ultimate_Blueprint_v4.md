# TypingArena — Integrated Ultimate Blueprint v4
## Strategic Product North Star + UX/User-Journey Architecture + Current Repository Reality

**Document status:** Proposed canonical successor to repository `v2`, incorporating the owner's Home-workspace principle  
**Prepared:** 2 September 2026  
**Repository:** `drewsebastians/TypingArena`  
**Latest `main` reviewed for this synthesis:** `349990e09e691f394246bcf8ed21001deda8dca8` (research baseline; execution must re-check latest `origin/main`)  
**Latest merge reviewed:** PR #14 — custom-domain root migration preparation  
**Inputs reconciled:**
1. Repository canonical blueprint: `docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v2.md`
2. Current repository implementation and closure evidence on `main`
3. User-supplied `deep-research-report.md` dated 2 September 2026
4. Current-repo UX/user-journey review: `TypingArena_UX_User_Journey_Rearrangement_Recommendations_2026-09-02.md`
5. Existing ADRs, route registry, analytics model, UI/UX audit, production/closure documentation

**Runtime policy:** AI may assist development, research, coding, QA, and offline content preparation. **Production runtime must not use AI inference.**

---

# 0. Why v4 Exists

The repository's v2 blueprint remains the latest canonical blueprint currently stored in the repository, and the engineering closure has already implemented a mature multi-mode product. A v3 synthesis was prepared after the first current-repository UX review, but the owner then established a decisive additional product principle:

> **The real compact typing workspace itself must remain on the MAIN LANDING PAGE and must be the primary visual center of attraction before users explore other features.**

Here, “workspace” means the compact real typing interaction box — configuration controls, live timing/WPM/accuracy, typing stream/input interaction, and restart behavior — **not** the entire `/typing-test` route shell and not every TypingArena engine.

That owner decision changes one important part of the earlier recommendation. The earlier v3 draft proposed removing embedded practice from Home and using a CTA to a separate route. v4 rejects that part while preserving the rest of the journey logic.

v4 therefore combines:

1. the strategic and technical commitments in the current repository blueprint;
2. current `main` at the reviewed baseline `349990e09e691f394246bcf8ed21001deda8dca8`;
3. the owner's new landing-page-workspace principle;
4. the attached deep-research report and its competitor/UX evidence;
5. the current-repository page-by-page UX audit;
6. current route, engine, Progress, Arena, Teams, Assessment, analytics, ad-safety, security, and deployment reality.

v4 does **not** restart the product. It is intentionally a **minimal-change orchestration blueprint**.

The central UX objective is:

> **Let users feel TypingArena immediately on Home, then carry every completed interaction into one obvious next step.**

The desired product loop is:

> **Land on the real typing workspace → type immediately → understand the result → take one useful next action → see progress → optionally explore another skill, Arena, or For Teams.**

The organizer loop remains separate:

> **For Teams → create/join → assign/invite → real TypingArena exercise → results.**

This blueprint preserves the existing engines, scoring, security, local-first model, all public routes, SEO value, no-runtime-AI policy, static-audio model, competition integrity, organizer capabilities, analytics consent boundaries, and ad-safety rules. It changes primarily hierarchy, placement, public copy, continuity, and navigation.

---

# 1. Authority and Conflict-Resolution Rules

When documents or research disagree, use this order.

## 1.1 Product and UX authority

1. **This v4 blueprint**, once approved and installed.
2. Explicit later owner decisions.
3. Current repository reality and passing tests.
4. Security/scoring/privacy ADRs for their specialized domains.
5. Current route registry for public-route existence and SEO inventory.
6. Current implementation evidence.
7. User-supplied deep research for external benchmark principles.
8. Historical v2/v1 blueprints and prior UX reports for provenance.

## 1.2 Important interpretation rule

The 2 September deep-research report crawled a **legacy public TypingArena experience** at `www.typingarena.com`, exposing features such as Lessons, Games, Scorelist, Teachers, and Certification.

Those findings are valuable for:

- competitor patterns;
- activation principles;
- recognition-over-recall;
- progressive disclosure;
- teacher/learner segmentation;
- competition grouping;
- post-value identity timing;
- feedback loops;
- domain/trust awareness.

They are **not evidence that those legacy routes should be recreated in the current repository**.

The current repository is a different product reality.

---

# 2. Executive North Star

TypingArena should be a **human input-performance arena** that trains and measures how accurately and quickly people can turn what they **see or hear into text**.

Core proposition:

> **Train and prove how accurately and quickly you can turn what you see or hear into text.**

Product expression:

> **One arena for typing, listening, dictation, transcription, work-ready input skills, progress, and competition.**

The strategic moat thesis remains:

> **WPM acquires; audio differentiates.**

Typing-speed search demand is an acquisition wedge. Dictation and transcription are the strongest opportunity to make TypingArena feel meaningfully different from commodity WPM tools.

The v4 user-experience thesis is:

> **Start fast → complete something real → understand the result → get one useful next action → repeat → see progress → optionally compete or share.**

The organizer experience is separate:

> **For Teams → create/join → assign/invite → real TypingArena exercise → results.**

---

# 3. Current Repository Reality — September 2026

The current app is already materially beyond an MVP.

It includes:

- typing Sprint modes;
- 15/30/60-second typing;
- true five-minute endurance;
- Indonesian typing routes;
- data-entry and punctuation presets;
- English and Indonesian dictation;
- deterministic noise challenge;
- transcription practice;
- transcription library;
- Career Mode with five practice-assessment tracks;
- local Progress/history;
- streak and deterministic recommendation;
- Daily Arena;
- server-authoritative leaderboard;
- monthly seasons;
- cross-device friend challenges;
- real-time multiplayer;
- Teams/Classrooms;
- Custom Tests;
- Employer Assessments;
- privacy controls;
- anonymous shared identity;
- management capability links;
- static SEO route portfolio;
- consent-gated analytics;
- safe ad-slot boundaries;
- Supabase security/RPC validation;
- no-runtime-AI guards;
- static export and GitHub Pages deployment machinery.

The current product does **not** expose a traditional email/password account product.

Ordinary practice is local-first.

Shared actions establish anonymous server identity only when required.

This is not a temporary compromise. It is an intentional product decision.

---

# 4. The Core Problem v4 Solves

TypingArena's remaining experience problem is not feature insufficiency.

It is **feature orchestration and visual hierarchy**.

## 4.1 The current Home is close, but the order is wrong

The current Home already has a major strength: it renders the real `TypingTestPanel` and therefore a real `TypingEngine`. That aligns with the strongest tool-led benchmark pattern.

The problem is that the user must first process:

- a broad “What do you want to improve today?” proposition;
- six equal Goal-First choices;
- a Step 1 / Step 2 mental model;

before the default typing utility becomes the visual center.

For several goals Home can also swap in Dictation or Transcription engines, which turns the landing page into a multi-engine orchestrator rather than a focused first-use surface.

v4 therefore does **not** remove the typing workspace.

It does the opposite:

> **Promote the real compact typing workspace to the hero and remove the pre-task taxonomy gate around it.**

## 4.2 Separate routes can still feel like separate products

Typing, dictation, transcription, Career, Daily Arena, Progress, multiplayer, and organizer tools all work, but transitions between them need stronger shared hierarchy and next-step continuity.

## 4.3 Result actions are currently too competitive with one another

The current typing result can expose Share, Dictation, Friend Challenge, Daily Arena, and Next Exercise at once, and the parent typing panel then adds another Dictation next-step card.

This is a concrete redundancy.

v4 requires:

- one primary continuation;
- one secondary cross-skill continuation;
- social/share/Arena actions as tertiary;
- no duplicate next-step card underneath the same result.

## 4.4 Motivation exists, but is dispersed

The repository already contains:

- streak;
- local history;
- deterministic recommended next;
- Daily Arena;
- leaderboard;
- seasons;
- multiplayer;
- friend challenges;
- personal analytics.

v4 uses these as connective tissue instead of adding a new gamification economy.

## 4.5 Administrative controls overpower some organizer surfaces

Teams already works end-to-end, but rare recovery/security/destructive controls currently sit beside the primary “Open room” action. The fix is placement, not backend redesign.

## 4.6 Public degraded states sometimes expose operator implementation detail

Developer-facing copy such as README/migration instructions should never appear as normal public UX. Degraded behavior remains honest; the copy becomes user-facing.

---

# 5. Devil's-Advocate Decisions

This table is authoritative for conflicts among the current repository, the attached research, the earlier v4 synthesis, and the owner's new principle.

| Conflict | Argument A | Argument B | v4 decision |
|---|---|---|---|
| **Landing page: CTA vs real typing utility** | Research often recommends one dominant CTA into a task | Keybr/Monkeytype/tool-led products reduce the distance further by making the task itself the destination; owner explicitly requires the workspace | **Keep one real compact typing workspace on Home and make it the visual hero.** This is the primary value proposition, not a demo. |
| **What “workspace on Home” means** | Current Home can swap multiple full engines by goal | Owner means the compact typing box, not every route/full workspace | **Embed only the shared real typing panel/engine on Home. Do not embed Dictation or Transcription engines there.** Full route shell, guidance, related tools, Skill Profile, and ads stay outside the box. |
| **Six Goal-First cards** | v2 made six goals equal entry points | Six choices delay typing and mix skills with contexts | **Keep all six IDs/contracts internally. Remove the six-card gate from above the task.** Typing is embodied by the workspace; Listening, Transcription, and Work Skills become exploration cards below it; Arena and For Teams are contextual sections. |
| **Global IA** | Attached legacy research: Learn / Practice / Compete / Progress + Teachers/Certification | Current repo has no lesson curriculum/certification and already has modern Arena/Teams routes | **Practice / Arena / Progress / For Teams.** Do not invent Learn, Games, Lessons, or Certification. |
| **30s vs 60s first test** | Familiar baseline research favors 60 seconds | Current product defaults to 30 seconds and lower friction matters | **Keep 30 seconds selected by default. Keep 60 seconds visibly selectable in the Home workspace.** No scoring change. |
| **Visible account after value** | Competitors often prompt signup after first result | Current product deliberately has no visible account system and local-first ordinary practice | **No visible signup/account.** Preserve “value before identity”; establish anonymous server identity only when a shared action requires it. |
| **Weak-key adaptation** | Research supports targeted remediation | Current result copy implies bias, but the shown panel does not actually bias the next stream; building a new adaptive engine widens scope | **Fix the copy now. Do not add a new adaptive engine in v4.** A deterministic targeted drill may be a later evidence-backed enhancement. |
| **Result CTAs** | More options expose breadth | Too many peer actions make the user choose again and current panel duplicates Dictation guidance | **One dominant continuation, one secondary cross-skill action, tertiary social/share options, no duplicate next-step card.** |
| **Progress redesign** | Research describes a new dashboard | Current `/progress` already has summary, history, streak, and deterministic recommendation | **Reorder the existing page. Do not rebuild a new dashboard.** |
| **Competition consolidation** | One Compete destination is cognitively simple | Existing route portfolio is useful for direct/SEO access and already implements multiple modes | **Unify perception with a shared Arena nav/shell; preserve all Arena URLs.** |
| **Teacher naming** | “For Teachers” is clear for education | Current product serves teams, classrooms, custom tests, employers, and candidates | **Use For Teams** as the broader organizer umbrella. |
| **Team controls** | Keeping all controls visible maximizes direct access | Recovery/revoke/delete/leave are rare and visually compete with common work | **Move rare/security/destructive actions into Settings while preserving capability and permissions.** |
| **Assessment start** | Immediate module launch is fastest | Candidate should understand scope before a potentially consequential multi-module flow | **Add one lightweight pre-start intro after invite validation, then keep modules distraction-free.** |
| **Gamification** | XP/badges can add novelty | Existing streak/Arena/leaderboards already create motivation and broad systems add scope | **Do not add coins, XP, avatar economies, or badge systems in v4.** |
| **Legacy `.com` findings** | Attached report found unrelated apex and legacy `www` behavior | Current repo is explicitly prepared for a repository-configured root custom domain, presently `typingarena.click` | **Treat the report as a trust warning, not as current IA truth. Verify `NEXT_PUBLIC_SITE_URL`/Pages output. Do not alter `.com` or DNS without explicit authorization.** |
| **Route simplification** | Fewer URLs would simplify architecture | Current routes carry direct, SEO, preset, and product utility | **Preserve all 25 existing public routes. Simplify perception, not URL inventory.** |

---

# 6. Revised Product Doctrine

## Rule 1 — Human skill is the product

Do not automate away the skill being trained.

## Rule 2 — The core utility is the first value

For TypingArena, the fastest route to value is not a marketing CTA. It is the real compact typing workspace itself. A new visitor should be able to click the box and type without first understanding the product taxonomy.

## Rule 3 — WPM acquires; audio differentiates

Typing remains the broad acquisition wedge. Listening and transcription must be deliberately exposed in the next-action loop.

## Rule 4 — Every completion should create the next session

The result is not the end of a route. It is the beginning of the next useful action.

## Rule 5 — Personal mastery comes before social status

Rank and competition are most effective after users understand their own result.

## Rule 6 — Routes may stay separate while the mental model becomes unified

Keep SEO/direct URLs. Consolidate perception through shared shells, tabs, presets, and cross-links.

## Rule 7 — Advanced features must earn prominence

Existing advanced capabilities stay implemented, but they do not all deserve top-level learner prominence.

## Rule 8 — Local-first is a product advantage

Do not reintroduce visible account friction merely because competitor benchmarks use accounts.

## Rule 9 — Deterministic personalization is enough for the current product

Recommendations can be useful without runtime AI.

## Rule 10 — Ads fund sessions, not interruptions

Never monetize the concentration-critical portion of a task.

## Rule 11 — Home may contain one real engine, not many

The Home typing workspace is a deliberate exception to “route pages own practice.” It reuses the canonical typing engine and its scoring/history/integrity behavior. Other skill engines remain on their own routes.

---

# 7. Target Users

## 7.1 Primary consumer segments

- typing-speed search visitors;
- teens/adults improving typing;
- language learners;
- job seekers;
- data-entry/admin learners;
- transcription learners;
- productivity/self-improvement users;
- competitive casual users.

## 7.2 Secondary organizer segments

- teachers;
- study groups;
- workplace teams;
- training teams;
- employers;
- recruiters using operational assessments;
- custom-test creators.

## 7.3 Not the initial product focus

- child-first curriculum;
- school SIS/LMS;
- formal certification;
- formal proctoring;
- speech-to-text automation;
- AI tutoring;
- professional transcription editing software.

---

# 8. North-Star User Journeys

## 8.1 New visitor

```text
Land
 ↓
See the real compact typing workspace immediately
 ↓
Click/focus the box and type
 ↓
Timer starts on first printable key
 ↓
Complete a real 30s default attempt
 ↓
Understand result
 ↓
Take one primary continuation
 ↓
Optionally explore Listening / Transcription / Work Skills / Arena
```

Target behavior:

- the product is demonstrated through use, not explanation;
- no goal-selection gate before the default typing task;
- no identity requirement;
- no fake/demo typing box;
- the default test remains 30 seconds, while 15s/60s/5m remain available;
- no need to return Home between exercises.

## 8.2 Returning learner

```text
Land
 ↓
Real typing workspace remains primary
 ↓
Recommended next strip appears directly below it when local history supports one
 ↓
Choose recommended continuation OR type immediately
 ↓
Complete
 ↓
See truthful comparable context where available
 ↓
Next action / Progress
```

The recommendation must guide, not displace the Home typing utility.

## 8.3 Search visitor

```text
Search / direct specialized URL
 ↓
Canonical route with correct preset
 ↓
Complete
 ↓
Same result/continuation hierarchy
 ↓
Related family or Home/Arena/Progress
```

SEO/direct routes do not detour through Home.

## 8.4 Competitive user

```text
Arena
 ↓
Today's Challenge
 ↓
Result
 ↓
Personal board context when real
 ↓
Leaderboard / Season / Multiplayer / Friend Challenge
 ↓
Train for next attempt
```

## 8.5 Job seeker

```text
Practice → Work Skills
 ↓
Career track
 ↓
Multi-module benchmark
 ↓
Weakest module highlighted
 ↓
Targeted existing practice route
 ↓
Retake later
```

## 8.6 Team participant

```text
For Teams
 ↓
Join with code / open invite
 ↓
Assignment
 ↓
Real TypingArena exercise
 ↓
Completion confirmation
```

## 8.7 Organizer

```text
For Teams
 ↓
Create/manage
 ↓
Team / Custom Test / Assessment
 ↓
Configure
 ↓
Share/invite
 ↓
Review results
```

## 8.8 Assessment candidate

```text
Invite validation
 ↓
Assessment intro
 ↓
Begin
 ↓
Module 1 … N
 ↓
Submission success
 ↓
Done
```

No marketing/discovery detour should interrupt candidate execution.

---

# 9. Canonical Information Architecture

## 9.1 Desktop header

```text
[TypingArena]     Practice     Arena     Progress     For Teams          EN/ID    🔥
```

The logo returns Home.

Privacy belongs in footer/settings context.

## 9.2 Practice

Practice is the consumer skill hub.

```text
Practice
├─ Typing
│  ├─ Standard
│  ├─ 1 Minute
│  ├─ 5 Minute
│  ├─ Bahasa Indonesia
│  ├─ Data Entry
│  └─ Punctuation
│
├─ Listening
│  ├─ Dictation
│  ├─ English
│  ├─ Bahasa Indonesia
│  └─ Noise Challenge
│
├─ Transcription
│  ├─ Practice
│  └─ Library
│
└─ Work Skills
   └─ Career Mode
```

The menu should use category rows and a few high-value sub-links, not show every route in one dense panel.

## 9.3 Arena

```text
Arena
├─ Today
├─ Leaderboard
├─ Season
├─ Multiplayer
└─ Friend Challenges
```

Within Arena routes, use a shared section-navigation component:

```text
Today | Leaderboard | Season | Multiplayer | Challenges
```

Daily Arena is the default conceptual front door.

## 9.4 Progress

One destination:

- recommendation;
- current/weekly summary;
- trends;
- history;
- Career history;
- shared profile/settings;
- data/privacy entry.

## 9.5 For Teams

```text
For Teams
├─ Teams & Classrooms
├─ Custom Tests
└─ Employer Assessments
```

Within organizer routes:

```text
Teams | Custom Tests | Assessments
```

## 9.6 Mobile

Initial implementation:

- accessible drawer;
- Home;
- Practice;
- Arena;
- Progress;
- For Teams;
- expandable category sections.

Do not add a bottom navigation in v4 Phase 0.

---

# 10. Goal Registry Strategy

The existing six goal IDs remain useful internal orchestration contracts:

1. `type-faster`
2. `listen-better`
3. `transcribe-accurately`
4. `prepare-for-work`
5. `compete`
6. `teach-assess`

Do not delete them solely because Home changes.

## 10.1 Remove the goal grid as a prerequisite

Do not require a new visitor to choose among all six goals before interacting with the default task.

The goal registry may continue to support:

- analytics;
- route metadata;
- related-route logic;
- copy/config metadata;
- internal recommendation mapping.

## 10.2 Typing is represented by the actual Home workspace

Do not add a redundant large “Typing” card immediately below the workspace.

The real workspace already communicates:

> **Type Faster**

## 10.3 Three secondary learner discovery lanes below the workspace

Home should expose:

- **Listening** → `/dictation`
- **Transcription** → `/transcription-practice`
- **Work Skills** → `/career`

These are discovery choices after the user has already seen the core utility.

## 10.4 Contextual sections, not skill cards

Home separately surfaces:

- **Today's Arena** → `/daily-arena`
- **For Teams** → `/teams`

This preserves `compete` and `teach-assess` contracts without pretending they are personal skill lanes.

## 10.5 No goal-contract rewrite unless required

Prefer adapting the Home composition around `GOALS` rather than changing IDs/types. Any goal-registry change must preserve tests, analytics expectations, and route relationships.

---

# 11. Homepage v4 — The Workspace Is the Hero

## 11.1 Non-negotiable principle

The MAIN LANDING PAGE must show the **real compact typing workspace** as its primary center of attraction.

This means:

- real `TypingTestPanel` / `TypingEngine` behavior;
- real reviewed corpus;
- real timer;
- real WPM/accuracy;
- real history persistence;
- real integrity handling;
- real result;
- no fake/demo state.

It does **not** mean embedding the entire `/typing-test` page shell.

It does **not** mean embedding Dictation, Transcription, Career, Daily Arena, Teams, or Assessment engines on Home.

## 11.2 Visual hierarchy

Recommended desktop structure:

```text
[Header: Practice | Arena | Progress | For Teams | EN/ID | streak]

TypingArena
Turn what you see or hear into accurate, fast text.
(optional one short support line)

┌──────────────────────────────────────────────────────────────┐
│ REAL COMPACT HOME TYPING WORKSPACE                          │
│ English / Indonesia   15s 30s 60s 5m   Sprint / modes      │
│                                                              │
│ Time              WPM              Accuracy       Restart    │
│                                                              │
│       reviewed typing stream / real interaction area         │
│                                                              │
│          Start typing — timer starts on first key             │
└──────────────────────────────────────────────────────────────┘

[ Open full typing workspace → ]
small local-first / no-setup reassurance if needed

[ Recommended next strip — only when history makes it useful ]

Explore another skill
[ Listening ] [ Transcription ] [ Work Skills ]

Today's Arena

Progress preview — only when history exists

For Teams

Trust / how it works

Discovery ad lower
Footer
```

The workspace should have more visual weight than the headline, exploration cards, trust badges, and secondary sections.

## 11.3 What to remove from the current Home

Remove or demote:

- the six-card GoalGrid above the typing task;
- “Step 1 / Step 2” framing;
- dynamic Home Dictation engine;
- dynamic Home Transcription engine;
- generic multi-goal `GoalWorkspace` switching;
- large pre-task technical trust explanation;
- redundant Typing discovery card below the workspace.

Do **not** remove the real Home `TypingTestPanel`.

## 11.4 Home typing configuration

Preserve current real controls unless usability testing proves one should collapse:

- English / Indonesia;
- 15s / 30s / 60s / 5m;
- Sprint / Copy Pro / Numbers where applicable;
- Restart.

Default remains:

```text
English · 30s · Sprint
```

Keep `autoFocus={false}` on Home unless browser testing proves auto-focus does not steal scroll/focus or create accessibility problems. The user should intentionally click/focus the workspace; the timer still begins on the first printable key.

## 11.5 Full workspace link

A small secondary link may open `/typing-test`.

Purpose:

- discover the canonical typing route;
- provide room for route-specific context/options;
- preserve navigational clarity.

It must not be visually stronger than “start typing.”

## 11.6 Returning-user recommendation

If meaningful local history exists, render a compact strip **below the typing workspace**, not instead of it.

Example:

```text
Recommended next
English Dictation — Medium
Listening accuracy is currently your weaker measured skill.
[ Start recommended ]
```

Reuse `nextExerciseRecommendation()` / existing deterministic logic.

If data is sparse, omit the strip.

## 11.7 Secondary learner discovery

Use three cards:

### Listening
Hear a clip and type exactly what you hear.
`/dictation`

### Transcription
Practice longer audio, punctuation, and sustained focus.
`/transcription-practice`

### Work Skills
Practice data entry, punctuation, and job-relevant input tasks.
`/career`

Do not add another Typing card next to them.

## 11.8 Today's Arena

Compact, clear, and below learner discovery.

Do not embed a full Daily Arena engine.

Show only truthful state that is already available.

If rank/participation cannot be reliably retrieved, do not invent it.

## 11.9 Progress preview

Only show if local history exists.

Keep it concise:

- streak;
- session count/recent result;
- one trend or recommendation.

Do not recreate `/progress`.

## 11.10 For Teams teaser

Lower on the page:

```text
Training a class, team, or candidate?
Use the same real TypingArena engines in assignments, custom tests, and assessments.
[ For Teams ]
```

## 11.11 Trust/details

Place lower or collapsible:

- ordinary practice stays on this device;
- deterministic scoring;
- reviewed/versioned content;
- no runtime AI;
- shared features publish only when the user chooses a shared action.

Avoid developer terminology.

## 11.12 Ads

No ad:

- above the Home workspace;
- inside the workspace;
- between its configuration/HUD and typing area;
- while its task is active.

A discovery ad may appear only after the primary experience and major discovery sections, subject to the existing ad-safety contract.

## 11.13 Mobile

On narrow screens:

- workspace remains first meaningful interaction;
- controls wrap/scroll accessibly without page overflow;
- HUD stacks/wraps;
- typing area remains usable;
- secondary discovery follows below;
- no sticky element covers the typing box;
- no forced keyboard opening on load.

## 11.14 Success test

A first-time user who ignores every paragraph of copy should still understand what to do:

> **Click the box and type.**

---

# 12. Practice Experience Contract

All core practice routes should share the same three-state experience.

## 12.1 Ready

Order:

1. skill-family context;
2. route title;
3. one-line benefit;
4. compact configuration;
5. primary start/focus area;
6. optional one-sentence helper.

Do not place long guidance before the task.

## 12.2 Active

Only essential elements remain prominent:

- timer/progress;
- prompt/audio;
- input;
- task-critical controls.

During active work:

- no ad;
- mute secondary global chrome;
- hide long guidance;
- hide Related Tools;
- hide Skill Profile;
- hide marketing;
- preserve accessible controls and escape paths.

## 12.3 Result

Order:

1. primary result;
2. secondary result;
3. improvement context;
4. one recommended next action;
5. retry;
6. competitive context if applicable;
7. advanced analytics disclosure;
8. related tools;
9. ad outside task.

Every result must answer:

1. How did I do?
2. Did I improve?
3. Where did I struggle?
4. What should I do next?
5. How do I compare, if relevant?

---

# 13. Result Hierarchy

Results must end indecision rather than create another feature menu.

## 13.1 Current typing-result redundancy to remove

Today the typing result can expose:

- Share result;
- Test your listening;
- Challenge friend;
- Daily Arena;
- Next exercise;

and `TypingTestPanel` then adds another Dictation `NextStepCard`.

v4 must collapse this.

## 13.2 Typing result target

Order:

```text
Primary result
68 WPM

Secondary
97% accuracy · time/integrity context

Truthful insight
These keys caused the most errors in this attempt: T P R

Comparable context — only when valid
+5 WPM vs recent comparable attempts

Primary continuation
[ Try another typing exercise / Retry / Start recommended ]

Secondary cross-skill action
[ Test your listening ]

More actions / tertiary
Share · Daily Arena · Friend Challenge

Detailed analysis ▼
```

The exact primary label may depend on the result and existing deterministic recommendation logic, but only one control gets dominant styling.

## 13.3 Weak-key truth rule

The current result copy says:

> “We'll bias upcoming passages toward these characters.”

Do not keep that statement unless the next exercise is actually deterministically biased using a tested implementation.

For v4, the minimal correct fix is diagnostic copy such as:

> “These keys caused the most errors in this attempt.”

Do not build a new adaptive engine merely to justify old copy.

## 13.4 Personal comparison

Only compare genuinely comparable history.

Typing examples:

- same language;
- same mode/family;
- same duration or clearly defined comparable duration group.

If the sample is insufficient, omit comparison.

Never fabricate improvement.

## 13.5 Dictation

Primary emphasis:

- normalized/word accuracy;
- then effective speed;
- replay efficiency as supporting detail.

Continuation hierarchy:

1. next clip / appropriate difficulty;
2. transcription cross-skill when useful;
3. related tools.

## 13.6 Punctuation/Data Entry

Accuracy visually outranks raw WPM where precision is the task.

## 13.7 Career

Overall band/score first.

Then:

- interpretation;
- strongest module;
- weakest module;
- existing practice route for weakest area;
- module table;
- retake/history.

## 13.8 Arena

After the challenge:

- personal result;
- truthful board/rank context;
- nearby target/gap only when data supports it;
- next competitive action;
- optional practice bridge.

## 13.9 Ownership of continuation UI

Prefer one result component/path to own next-step hierarchy.

Do not render a second generic NextStepCard directly underneath when the result already provides the relevant continuation.

---

# 14. Route Portfolio — Preserve URLs, Unify Perception

The current public route portfolio remains valuable.

Do not delete routes simply to simplify the UI.

## 14.1 Typing family

- `/typing-test`
- `/typing-test/1-minute`
- `/typing-test/5-minute`
- `/typing-test/indonesian`
- `/tes-mengetik`
- `/data-entry-test`
- `/punctuation-typing-test`

User perception:

> **One Typing workspace with presets and work-skill variants.**

### `/typing-test`

Canonical typing workspace.

Order:

1. title/benefit;
2. language/duration/mode bar;
3. engine;
4. result;
5. recommended next;
6. details;
7. trend;
8. related modes;
9. ad.

### `/typing-test/1-minute`

SEO/direct preset.

Render the same shell with 60 seconds selected.

### `/typing-test/5-minute`

Same shell.

Frame as endurance.

Do not break the true full-clock behavior.

### `/typing-test/indonesian`

Same shell with Bahasa Indonesia preset.

### `/tes-mengetik`

Localized SEO landing into the same canonical experience.

### `/data-entry-test`

A direct SEO/work-skill preset.

After result, strongly link to Career Mode or another work-skill module.

### `/punctuation-typing-test`

A direct precision preset.

Accuracy and punctuation error analysis outrank WPM.

---

# 15. Listening Family

Routes:

- `/dictation`
- `/dictation/english`
- `/dictation/indonesian`
- `/noise-challenge`

User perception:

> **One Listening workspace with language and difficulty variants.**

## `/dictation`

Canonical listening practice.

Order:

1. compact configuration;
2. audio + answer;
3. result;
4. next clip;
5. strategic next mode;
6. playback detail;
7. related variants;
8. ad.

The strongest continuity action is **next clip**, not generic Related Tools.

## Language routes

Preserve as SEO/direct presets.

Do not make them feel like independent applications.

## `/noise-challenge`

Treat as an advanced listening variant.

Navigation label should make that status clear.

---

# 16. Transcription

Routes:

- `/transcription-practice`
- `/transcription-library`

User perception:

> **Choose clip → transcribe → result → choose next clip.**

## `/transcription-practice`

Top should expose current clip context:

```text
Business Call · Medium · 1:45     [Change clip]
```

Then:

- audio;
- editor;
- submit;
- result;
- recommended next clip;
- playback efficiency;
- library link.

## `/transcription-library`

It is a selector, not a dead-end catalogue.

Order:

1. recommended/continue;
2. filters/search;
3. clip list;
4. metadata;
5. dominant Start action.

If local history supports it:

- completed marker;
- last score;
- recommended badge.

These enhancements are valuable, but the base selector integration comes first.

---

# 17. Work Skills / Career

Route:

- `/career`

Career Mode is a practice benchmark, not certification.

## New user

Each track should answer:

- what job-relevant capability it represents;
- approximate time;
- modules included;
- start.

Example:

```text
Data Entry Readiness
~7 minutes
Typing · numbers · punctuation

[ Start readiness check ]
```

## Returning user

Lead with:

- latest score;
- weakest module;
- practice weakest skill;
- retake full assessment;
- other tracks.

## Direct work-skill routes

Data Entry and Punctuation remain SEO-direct routes but should visibly belong to this Work Skills family.

---

# 18. Arena

Routes:

- `/daily-arena`
- `/leaderboard`
- `/seasons`
- `/multiplayer`
- `/friends`

These remain separate routes but share one Arena shell.

## 18.1 Arena section navigation

```text
Today | Leaderboard | Season | Multiplayer | Challenges
```

Current tab is clear and accessible.

## 18.2 `/daily-arena`

Arena front door.

Order:

1. today status;
2. typing/dictation choice;
3. task;
4. result;
5. personal board context;
6. next competitive action;
7. supporting practice;
8. ad outside task.

Remove repository/operator instructions from public degraded states.

Use:

```text
Shared ranking is unavailable right now.
Your result is still saved on this device.
```

## 18.3 `/leaderboard`

Order:

1. personal reference if available;
2. board;
3. filters;
4. Daily Arena CTA.

If the user has no ranked result:

```text
You're not ranked yet.
[ Enter today's Arena ]
```

## 18.4 `/seasons`

Order:

1. current season;
2. personal season position if available;
3. division/score;
4. season board;
5. rules disclosure;
6. return to current competitive action.

## 18.5 `/multiplayer`

Pre-game:

- primary create/find/join action;
- room controls;
- opponent state.

Active race:

- distraction-free;
- no ad.

Result:

- outcome;
- score;
- rematch;
- related social action;
- optional progress context.

Do not weaken the proven host-authority/evidence-derived trust model.

## 18.6 `/friends`

UI name:

> **Friend Challenges** or **Challenges**

Order:

1. incoming challenges;
2. create challenge;
3. active/outgoing;
4. completed.

Incoming work is more urgent than setup mechanics.

---

# 19. Progress

Route:

- `/progress`

Progress should make the user feel:

- rewarded;
- oriented;
- motivated;
- ready to act.

It should not feel like an infrastructure settings page.

## 19.1 Revised order

1. summary/streak;
2. Recommended Next;
3. skill overview/trends;
4. recent history;
5. Career history;
6. shared competition profile;
7. sync status when relevant;
8. Data & Privacy;
9. ad.

## 19.2 Recommendation placement

Move Recommended Next near the top.

This is one of the most strategically important existing features.

## 19.3 Shared identity

Nickname belongs in a collapsed or secondary section such as:

```text
Shared competition profile
Nickname: steady typer
```

It is not the first reason people visit Progress.

## 19.4 Sync status

Only show prominent sync UI when there is a pending shared action.

Do not imply cloud backup of ordinary local practice.

## 19.5 Privacy

Use a compact link/summary here.

The full privacy/data-management surface belongs on `/privacy`.

---

# 20. For Teams

Routes:

- `/teams`
- `/custom`
- `/assessments`

These share one organizer shell.

```text
For Teams
Teams | Custom Tests | Assessments
```

## 20.1 Entry intent split

On relevant top-level views distinguish:

```text
Join / participate
or
Create / manage
```

This prevents participant and administrator controls competing at equal visual weight.

---

# 21. Teams

Route:

- `/teams`

## Top-level view

Recommended order:

1. join-by-code;
2. Your Teams;
3. Create Team.

Existing team cards show:

- name;
- role;
- meaningful status;
- Open.

Do not show management-link lifecycle and destructive actions beside Open.

## Team detail

Use:

```text
Overview | Assignments | Members | Results | Settings
```

### Overview

- team summary;
- active assignment;
- completion status;
- primary action.

### Assignments

- current/upcoming;
- create/publish.

### Members

- member list;
- role context.

### Results

- aggregate performance/completion.

### Settings

- join code;
- management link;
- rotate/revoke;
- leave/delete;
- destructive confirmations.

Security behavior stays unchanged.

This is primarily information architecture, not an authorization redesign.

---

# 22. Custom Tests

Route:

- `/custom`

Top:

```text
Your Custom Tests
[ + Create test ]
```

Then:

- recent;
- templates, if introduced;
- existing tests.

Builder:

1. name;
2. module/content;
3. configuration;
4. preview;
5. save/create;
6. share/manage after creation.

Management secrets do not appear before the resource exists.

## Templates

Recommended Phase 2 enhancement:

- Typing Sprint;
- Data Entry;
- Dictation;
- Transcription.

Only build templates using existing real modules.

---

# 23. Employer Assessments

Route:

- `/assessments`

## Candidate

Add an explicit introduction after invite validation:

```text
Data Entry Candidate Assessment
4 modules · approximately 8 minutes

Your results are shared with the organizer.
[ Begin assessment ]
```

Then:

- title;
- module X/Y;
- exercise.

Completion:

- submission success;
- what happens next;
- no distracting product CTA.

## Creator

Order:

1. existing assessments;
2. create;
3. module builder;
4. invite;
5. results;
6. settings/security.

Preserve exact saved-module resolution and invite lifecycle behavior.

---

# 24. Privacy

Route:

- `/privacy`

Order:

1. plain-language summary;
2. what remains on device;
3. what is shared only when user chooses shared features;
4. local export/delete;
5. shared-data deletion;
6. analytics/consent;
7. detailed policy.

Privacy statements must describe actual implementation.

---

# 25. Cross-Page Placement Rules

## Skill Profile

- full profile belongs primarily on Progress;
- practice results show only relevant insight/trend;
- hide when history is insufficient.

## Related Tools

Hierarchy:

1. recommended next;
2. retry/current mode continuation;
3. related tools.

Related Tools should never be the primary next-action mechanism.

## Guidance

- one sentence before first attempt;
- detailed “How it works/scoring” lower or collapsible;
- no long guidance during active task.

## Ads

- Home: discovery after core content;
- practice: outside active task, preferably after result/supporting content;
- Arena: below challenge/result/board;
- Progress: after useful personal content;
- Teams/Assessments: never visually resemble controls;
- active tasks: forbidden.

## Trust copy

Keep:

- local-first;
- deterministic;
- no runtime AI;
- reviewed content.

But position it as confidence-building support, not as the main emotional proposition.

---

# 26. Features to Add — Only Where Journey Gaps Require Them

v4 is intentionally conservative.

## 26.1 Home recommendation strip

Reuse existing deterministic recommendation logic below the Home typing workspace.

**Priority:** P1.

This is presentation/reuse, not a new recommendation engine.

## 26.2 Arena section navigation

Shared route-aware nav for Today / Leaderboard / Season / Multiplayer / Friend Challenges.

**Priority:** P0/P1.

## 26.3 For Teams section navigation

Shared route-aware nav for Teams / Custom Tests / Assessments.

**Priority:** P1.

## 26.4 Candidate assessment intro

One lightweight pre-start screen after invite validation.

**Priority:** P1.

## 26.5 Personal comparable context

Use existing local history to show a recent comparable benchmark only when methodologically valid.

**Priority:** P1/P2.

## 26.6 Team Settings surface

A presentation surface that relocates existing recovery/security/destructive controls.

**Priority:** P1.

## 26.7 Optional future enhancements — explicitly not v4 blockers

Only after journey data supports them:

- deterministic weak-key drills;
- custom-test templates;
- richer weekly summary;
- enhanced personal leaderboard neighborhood;
- richer transcription-library completion state.

Do not widen v4 to implement these unless they are already trivial, tested, and necessary for a coherent surface.

---

# 27. Features Not to Add Yet

Do not prioritize:

- XP economy;
- coins;
- cosmetic store;
- generic badge explosion;
- social feed;
- avatar system;
- AI coach;
- runtime AI adaptation;
- new game catalogue;
- full lesson curriculum;
- formal certification;
- new real-time competition mode;
- mobile bottom navigation;
- broad account system.

The existing feature set is already rich enough to validate the product.

---

# 28. Enjoyment Without Excessive Gamification

TypingArena should become more enjoyable through four mechanisms.

## 28.1 Faster entry

Less setup, more doing.

## 28.2 Visible mastery

Show honest improvement.

Examples:

- recent WPM delta;
- accuracy trend;
- reduced replay dependence;
- improved weak pattern.

## 28.3 Meaningful next challenge

Tell the user why the next activity is useful.

## 28.4 Social comparison after personal context

Rank is a reward layer, not the first measure of worth.

---

# 29. Identity and Persistence

The v2 no-visible-account decision remains authoritative.

## Ordinary practice

- local;
- usable without Supabase;
- saved automatically on device.

## Shared actions

Lazy anonymous server identity only when needed.

## Visible identity

Nickname.

## Do not add

- email login;
- password;
- signup wall;
- account dashboard;
- cross-device ordinary-practice promise.

The deep-research principle “ask for identity only after value exists” is satisfied more strongly by this architecture: ordinary value never requires identity at all.

---

# 30. Security and Integrity

The UX program must not weaken:

- server-authoritative ranked submission;
- direct attempt write restrictions;
- official ranked exercise binding;
- Daily date/version binding;
- idempotency;
- private history;
- friend-result validation;
- multiplayer host authority;
- evidence-derived standings;
- team membership authorization;
- assignment binding;
- assessment invite lifecycle;
- management-token hash-only/scoped/revocable behavior.

If a visual simplification would weaken a security boundary, keep the boundary and redesign the presentation around it.

Do not expose raw UUIDs, secrets, management tokens, or private answer data.

---

# 31. Content and Audio Strategy

Keep current implementation truth:

- reviewed English and Indonesian text;
- static Piper WAV audio;
- deterministic selection;
- versioned content IDs;
- no runtime TTS;
- no runtime ASR;
- no generated runtime exercise text.

The strategic validation question remains:

> Do audio modes increase repeat use and product distinctiveness?

The redesigned result loop should deliberately expose audio where appropriate, rather than merely listing it in navigation.

---

# 32. SEO Strategy

Keep every useful existing public route.

Do not collapse URLs merely to clean the header.

Rule:

> **One mental model can contain multiple search-intent URLs.**

SEO flow:

```text
Search
 ↓
exact useful tool
 ↓
result
 ↓
recommended next
 ↓
repeat / Arena / Progress
```

Every SEO preset should visually feel like the canonical family workspace.

Avoid:

- thin new keyword routes;
- duplicate generic pages;
- parameter-indexed sessions;
- legacy Lessons/Games pages created only because external research saw them.

`/progress` remains private/noindex.

Manage/invite/capability state must never leak into canonical metadata.

---

# 33. Domain and Production Trust

This section resolves the most important apparent conflict in the deep-research report.

## 33.1 Research finding

At the time of the external crawl:

- `typingarena.com` showed unrelated casino content;
- `www.typingarena.com` showed a legacy TypingArena site.

That is a serious brand-confusion signal.

## 33.2 Current repository reality

The latest repository work prepares a root-relative GitHub Pages custom-domain build for:

> `https://typingarena.click/`

The current app should therefore **not** treat `.com` as its canonical domain.

## 33.3 v4 rule

- canonical production target follows repository/operator configuration;
- current intended custom-domain example/target is `.click`;
- never silently point canonical metadata to `.com`;
- do not change or attempt to reclaim `.com` without explicit owner authority;
- verify Pages custom-domain configuration and canonical URL during deployment;
- ensure sitemap, robots, canonical links, audio/static assets, and route paths work at root;
- preserve GitHub Pages project-site fallback for demo/recovery.

## 33.4 Production gate

Before calling the custom-domain cutover complete, verify externally:

- root returns TypingArena;
- core routes return 200;
- assets/audio resolve;
- canonical/sitemap use correct origin;
- `/progress` is excluded/noindex;
- HTTPS is valid;
- no unrelated legacy domain is referenced in app metadata.

This is an external deployment verification gate, not a reason to redesign current app around the legacy `.com` structure.

---

# 34. Analytics and Measurement

Current analytics already contain a broad event vocabulary and a consent/PII boundary.

Do not duplicate equivalent events unnecessarily.

The v4 program must be able to measure:

## Activation

- landing → first task start;
- time to first task;
- time to first keystroke where practical;
- completion rate.

## Continuity

- result → recommended next click;
- second exercise/session;
- tasks per session;
- same-mode continuation;
- cross-mode continuation.

## Differentiation

- typing → dictation;
- typing → transcription;
- dictation → transcription;
- repeat audio sessions;
- audio-engaged D1/D7 vs typing-only.

## Return

- D1/D7;
- streak ≥2;
- Daily Arena repeat participation.

## Competition

- Arena entry;
- Daily completion;
- result → leaderboard;
- return tomorrow;
- multiplayer/friend conversion.

## Career

- track start;
- completion;
- weakest-skill CTA;
- retake.

## Organizer

- For Teams entry;
- join/create intent;
- team created;
- first assignment;
- assessment created;
- invite generated;
- candidate completion.

## Ads

- impressions per useful completed session;
- no active-task impressions;
- CLS/layout guardrails.

---

# 35. New/Adjusted Event Needs

Prefer existing events whenever they already represent behavior.

The current typing engine already records typing/task start and completion. Do not duplicate those events without a measurement reason.

Potential additions only if missing:

```text
home_workspace_viewed
home_open_full_typing
home_recommended_next_clicked
home_skill_explored
arena_tab_opened
teams_intent_selected
career_weak_skill_clicked
assessment_begin_clicked
```

If `home_workspace_started` is useful as a landing-specific attribution event, derive/send it without logging typed content and without replacing the canonical `typing_test_start` / `task_started` events.

Do not log:

- typed content;
- transcript;
- expected answers;
- email/contact detail;
- auth UUID;
- invite code;
- management token/fragment;
- raw secret-bearing URLs;
- unnecessary resource identifiers.

---

# 36. Experiment Program

Experiments follow implementation and must **not** violate the owner's Home-workspace principle.

Do not A/B test “workspace vs no workspace” in v4.

## 36.1 Home typing duration

The Home workspace always remains present.

A: 30 seconds selected by default  
B: 60 seconds selected by default

Only run this later if there is sufficient traffic and the owner wants to test the default.

Primary:

- first-keystroke rate;
- completion;
- result-to-next;
- second-session rate.

Guardrail:

- accuracy/result stability;
- abandonment.

Until then, keep the current 30-second default.

## 36.2 Home framing density

The real typing workspace remains identical in both variants.

Potential later test:

A: minimal headline/support copy  
B: slightly more explicit “type here now” framing

Primary:

- time to first keystroke;
- workspace start rate.

Guardrail:

- exploration of Listening/Transcription/Work Skills.

## 36.3 Result continuation hierarchy

A: same-mode retry/continue dominant  
B: deterministic Recommended Next dominant when recommendation quality is sufficient

Primary:

- result-to-next-task;
- second completed session.

Guardrail:

- accuracy;
- user does not get pushed into an irrelevant mode.

## 36.4 Secondary-skill discovery order

Keep Typing as the Home hero.

Later test the ordering/copy of:

- Listening;
- Transcription;
- Work Skills.

Primary:

- audio adoption;
- successful second-mode completion.

## 36.5 Leaderboard context

A: board only  
B: board + truthful personal row/neighborhood

Primary:

- return-to-Arena.

Guardrail:

- practice behavior does not shift toward worse accuracy.

Do not run multiple major navigation/continuation experiments simultaneously.

---

# 37. Accessibility, Responsive Design, and Focus

Target WCAG 2.2 AA-oriented behavior.

Preserve:

- semantic controls;
- labels;
- visible focus;
- keyboard operation;
- dynamic `<html lang>`;
- drawer focus trap/Escape/focus return;
- accessible audio;
- reduced motion;
- 44px touch targets where appropriate;
- no color-only status.

Regression viewports:

- 1440×900;
- 1280×800;
- 768×1024;
- 390×844;
- 375×667;
- 320×568 stress.

During active tasks, focus quality is part of product correctness.

---

# 38. Performance

v4 keeps one real typing engine on Home, so performance work must optimize **around that requirement**, not remove it.

Targets:

- canonical typing workspace remains in the initial Home experience;
- remove eager Home loading of audio-heavy Dictation/Transcription panels;
- avoid duplicate engine bundles/implementations;
- preserve route-level code splitting for audio, Arena, and organizer surfaces;
- lazy-load secondary non-critical Home sections only when this does not harm UX/accessibility;
- stable ad containers;
- no new animation framework;
- static export preserved;
- no runtime-AI dependencies;
- no layout shift that moves the typing target during interaction.

Measure before/after bundle and runtime behavior.

A regression is unacceptable if the workspace-first Home materially slows first interaction compared with the current real-engine Home.

The intended performance win comes from removing **extra Home engines and orchestration**, not from removing the typing engine.

---

# 39. Technical Architecture

Preserve:

```text
Next.js 16 / React 19 / TypeScript
        ↓
Static export
        ↓
Local-first ordinary practice
        ↓
Supabase direct client for shared features
        ↓
Postgres RLS + server-authoritative RPC validation
        ↓
Realtime for multiplayer
```

The v4 UX program should not require a platform rewrite.

Backend/schema changes are not expected for the core rearrangement.

---

# 40. Implementation Program — Journey v4

The historical B00–B16/R0–R16 engineering closure is not reopened.

v4 is a **surgical journey/placement program**.

## J0 — Baseline, latest-main verification, and documentation

- fetch/prune safely and verify current `origin/main`;
- record the actual execution baseline SHA;
- use `349990e09e691f394246bcf8ed21001deda8dca8` only as the research baseline;
- preserve dirty/uncommitted user work;
- install v4 blueprint;
- inventory all 25 route-registry entries;
- inventory current Home, Header, result actions, Progress, Arena, Teams, Assessment, analytics, ads, i18n, and E2E;
- capture desktop/mobile baseline screenshots;
- run baseline lint/typecheck/unit/build/E2E as environment permits;
- verify repository-configured custom-domain/static-export behavior;
- do not mutate DNS or production.

## J1 — Global IA

- header → Practice / Arena / Progress / For Teams;
- grouped desktop menus;
- grouped mobile drawer;
- preserve every public route;
- add/reuse shared Arena navigation;
- add/reuse shared For Teams navigation;
- Privacy stays utility/footer context;
- preserve locale/streak/accessibility.

## J2 — Home workspace-first composition

- **KEEP the real `TypingTestPanel` on Home**;
- make it the main visual hero;
- keep real scoring/history/integrity behavior;
- keep Home `autoFocus={false}` unless tested evidence supports otherwise;
- remove GoalGrid as a pre-task gate;
- remove Step 1/Step 2 framing;
- remove dynamic Home Dictation/Transcription engine embedding;
- do not embed Career/Arena/Teams engines;
- three secondary learner cards: Listening / Transcription / Work Skills;
- Arena section;
- optional recommendation strip below workspace when local history is meaningful;
- optional Progress preview;
- For Teams teaser;
- trust lower;
- discovery ad lower and never inside/above active workspace.

## J3 — Practice continuity and result hierarchy

- preserve canonical typing/dictation/transcription engines;
- preserve all typing presets and true five-minute behavior;
- standardize route-family hierarchy;
- one result continuation hierarchy;
- remove duplicate typing `NextStepCard`;
- change misleading weak-key “we'll bias” copy unless actual bias exists;
- personal comparable context only when valid;
- recommendation before Related Tools;
- no active-task ads.

## J4 — Arena coherence

- Daily remains front door;
- shared Arena nav;
- public-friendly degraded copy;
- no README/migration/operator instructions in user UI;
- truthful personal board context;
- no fake rank/rows;
- consistent result → board/next-action loop.

## J5 — Progress reorder

Reorder existing `/progress`; do not build a new dashboard:

1. summary/streak;
2. Recommended Next;
3. useful skill/history content;
4. Career history;
5. shared nickname/profile;
6. pending sync only when relevant;
7. privacy/data controls/link;
8. ad.

Preserve local-first semantics.

## J6 — For Teams / organizer placement

- shared For Teams nav;
- top-level Join with code vs organizer create/list intent;
- team row primary action = Open;
- move management links, revoke, leave, delete, and destructive/recovery controls into Settings;
- team detail nav: Overview / Assignments / Members / Results / Settings;
- preserve backend permission/security behavior;
- assessment candidate intro;
- creator resource-first flow improvements only where low-risk.

## J7 — Career and Transcription refinement

- Career new/returning hierarchy using existing data;
- weakest module → existing relevant practice;
- no certification claims;
- Transcription Library behaves as selector;
- next clip more prominent than generic Related Tools;
- no new curriculum/games.

## J8 — Measurement / SEO / ads / accessibility / performance closure

- reuse existing analytics events first;
- add only PII-safe journey events necessary to measure Home workspace use and continuation;
- verify Home typing start/complete remains correctly tracked;
- SEO route integrity;
- ad-boundary regression;
- keyboard/focus/320px/mobile;
- static-export/root-basePath behavior;
- no-runtime-AI;
- bundle/performance regression.

## J9 — Independent closure

- traceability matrix;
- before/after screenshots;
- complete relevant test gates;
- red-team against Principle #1 and minimal-change scope;
- no unresolved P0/P1 journey blockers;
- dedicated branch/draft PR ready if authorized;
- **no automatic merge or production deploy**.

---

# 41. Priority Summary

## P0

- preserve and elevate the real compact typing workspace on Home;
- remove the six-goal pre-task gate around it;
- global IA → Practice / Arena / Progress / For Teams;
- preserve all routes and trust/scoring/security contracts;
- remove duplicate/conflicting result continuation hierarchy;
- verify deployment/domain configuration without external mutation.

## P1

- three Home secondary learner lanes;
- Home recommended-next strip below workspace when data supports it;
- shared Arena navigation and public-friendly degraded copy;
- reorder existing Progress;
- For Teams shared nav;
- Team Settings relocation;
- assessment candidate intro;
- Transcription Library selection continuity;
- Career weakest-skill continuation.

## P2

- valid personal comparable benchmark;
- richer Progress summary if it can be composed from existing data;
- improved personal leaderboard neighborhood where backend data cleanly supports it;
- custom-test templates only if truly low scope.

## Later / evidence-gated

- deterministic targeted weak-key drills;
- guided lesson curriculum;
- richer gamification;
- mobile bottom-nav experiment;
- premium layer;
- new competition systems.

---

# 42. Acceptance Criteria

## New user / Home

- the real typing workspace is visible without navigating away;
- it is the dominant interactive/visual element;
- the user can start by clicking/focusing the typing area and pressing a key;
- the attempt uses the canonical typing engine, scoring, history, and integrity logic;
- 30s remains default; 15s/60s/5m remain accessible;
- no signup/account is required;
- no six-goal decision is required before typing;
- no Dictation/Transcription engine is embedded on Home;
- Listening / Transcription / Work Skills remain easy to discover below;
- Arena and For Teams remain discoverable;
- no ad interrupts/occupies the active workspace.

## Returning user

- the Home typing workspace remains primary;
- a truthful deterministic recommendation may appear below it;
- recommendation does not replace the ability to type immediately;
- Progress is reachable directly.

## Search visitor

- lands on expected specialized route;
- correct preset is visible;
- route feels part of the canonical family;
- can continue without returning Home.

## Result

- one action is clearly primary;
- no duplicate next-step card repeats the same recommendation;
- weak-key copy is truthful;
- personal comparison appears only with comparable evidence;
- tertiary share/social actions do not overpower continuation.

## Listening / Transcription

- next clip/task obvious;
- no autoplay;
- active task remains ad-free;
- Transcription Library launches practice directly.

## Competitive user

- Daily Arena is obvious;
- shared Arena navigation is consistent;
- rank is shown only when truthful;
- public degraded states contain no operator/developer setup instructions.

## Career user

- track scope is understandable;
- result highlights weakest skill;
- continuation uses existing practice capability;
- no certification claim.

## Progress

- Recommended Next appears before nickname/admin details;
- ordinary history remains local-first;
- sync messaging appears only when relevant;
- privacy remains accurate.

## Teams / organizer

- joining is obvious;
- team list primary action is Open;
- recovery/security/destructive controls are in Settings;
- permissions and management capability behavior remain unchanged.

## Assessment candidate

- scope is shown before module 1;
- exact saved module sequence remains authoritative;
- active modules are distraction-free;
- successful submission is explicit.

## Engineering / domain

- all 25 current route-registry entries remain valid;
- current production/custom-domain origin is derived from repository configuration;
- `.com` is not introduced as canonical;
- root custom-domain and project-site static output remain valid;
- no runtime AI;
- no scoring/security/schema change unless separately justified and proven.

---

# 43. Red-Team Questions

Before closure, try to prove v4 is wrong.

Ask:

- Is the Home typing workspace truly the first visual center, or did headline/cards still overpower it?
- Did simplifying Home accidentally turn the real engine into a fake/demo or separate implementation?
- Did Home typing diverge from `/typing-test` scoring/history/integrity?
- Does keeping configuration above the box create too much visual clutter?
- Does `autoFocus={false}` require an obvious enough focus affordance?
- Does mobile keep the workspace usable without automatically opening the keyboard?
- Did removing GoalGrid make Listening/Transcription harder to discover?
- Did we accidentally add a redundant Typing card under the typing hero?
- Did Home recommendation push the typing box down or replace it for returning users?
- Are result actions still visually peer-level?
- Does any weak-key copy promise behavior that is not implemented?
- Did Arena grouping make direct routes slower?
- Did moving team security controls into Settings make recovery impossible?
- Does candidate intro alter invite lifecycle or exact saved module resolution?
- Did any public degraded state retain README/Supabase/migration copy?
- Did any new event include typed text, clip answers, tokens, invite codes, management fragments, or PII?
- Did any layout change reintroduce ads during active tasks?
- Did domain work accidentally reference the unrelated legacy `.com` as canonical?
- Did a “minimal UX change” accidentally reopen backend/scoring/security work?

Evidence-backed P0/P1 findings must be fixed before closure.

---

# 44. Ultimate Definition of Done

## Product experience

- [ ] Home's real compact typing workspace is the primary center of attraction.
- [ ] Home uses the canonical typing engine rather than a duplicate/demo.
- [ ] The six-goal grid no longer blocks the default typing interaction.
- [ ] Listening / Transcription / Work Skills are secondary exploration lanes.
- [ ] Arena and For Teams are clearly separated contextual areas.
- [ ] Practice routes retain direct/SEO value and coherent family perception.
- [ ] Every major result has one dominant continuation.
- [ ] No duplicate next-step UI repeats the same recommendation.
- [ ] Weak-key/result copy describes actual behavior.
- [ ] Progress leads with action/motivation, not identity administration.
- [ ] Competition feels like one Arena.
- [ ] Organizer tools feel like one For Teams area.
- [ ] Candidate flows add context without adding distraction.
- [ ] No visible account system is reintroduced.
- [ ] No speculative feature expansion is required for closure.

## Engineering

- [ ] execution baseline SHA recorded from latest `origin/main`;
- [ ] clean/safe worktree handling;
- [ ] clean install if practical;
- [ ] lint;
- [ ] typecheck;
- [ ] unit/component;
- [ ] static build;
- [ ] targeted E2E;
- [ ] full desktop/mobile E2E where environment supports;
- [ ] no-runtime-AI;
- [ ] static audio;
- [ ] no security regression;
- [ ] DB integration if and only if backend/shared-data contracts changed.

## UX/a11y

- [ ] Home workspace keyboard/focus behavior;
- [ ] mobile drawer;
- [ ] responsive 320–1440;
- [ ] no horizontal page overflow;
- [ ] task-active focus;
- [ ] honest loading/empty/degraded states;
- [ ] no long instructions block typing;
- [ ] no forced mobile keyboard on page load.

## SEO

- [ ] all current public URLs preserved unless explicitly justified;
- [ ] distinct route utility;
- [ ] canonicals/sitemap correct;
- [ ] `/progress` noindex;
- [ ] secret query state noindex/canonical-safe.

## Ads/privacy

- [ ] no ad above/inside active Home typing task;
- [ ] no active-task ads elsewhere;
- [ ] stable slots;
- [ ] consent behavior preserved;
- [ ] privacy copy matches implementation;
- [ ] typed content/answers never enter analytics.

## Domain

- [ ] repository-configured production origin verified;
- [ ] root custom-domain paths work;
- [ ] project-site fallback works;
- [ ] assets/audio work;
- [ ] unrelated `.com` not referenced as canonical;
- [ ] no external DNS/domain mutation without explicit owner authorization.

## Measurement

- [ ] Home workspace view/start/complete;
- [ ] result-to-next;
- [ ] second exercise;
- [ ] cross-mode/audio adoption;
- [ ] Daily;
- [ ] Career;
- [ ] For Teams;
- [ ] consent/PII boundary.

---

# 45. Source-of-Truth Hierarchy After v4 Approval

1. `docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v4.md`
2. v4 journey execution/closure documentation
3. security/scoring/privacy ADRs
4. current route registry
5. current repository/tests
6. `TypingArena_Integrated_Ultimate_Blueprint_v2.md` — superseded strategic/implementation provenance
7. user-supplied deep-research report — external benchmark provenance
8. historical Goal-First and Pass VII documents.

Do not silently delete historical evidence.

Mark superseded documents clearly.

---

# 46. One-Page Ultimate Summary

**Product:** TypingArena  
**Identity:** human input-performance arena  
**Core proposition:** turn what you see or hear into text accurately and quickly  
**Acquisition wedge:** typing/WPM utility and search demand  
**Differentiator:** dictation + transcription + multi-skill progression  
**Primary global IA:** Practice / Arena / Progress / For Teams  
**Landing-page principle:** the **real compact typing workspace is the hero**  
**Home engine policy:** keep one canonical real typing engine; do not embed the other skill engines  
**Home default:** English · 30s · Sprint, with 15s/60s/5m and modes accessible  
**Home secondary learner lanes:** Listening / Transcription / Work Skills  
**Goal IDs:** keep all six internally; remove the six-card gate before typing  
**First action:** click/focus the Home box and type; timer starts on first key  
**Full typing route:** remains available as a secondary “Open full workspace” path  
**Returning Home:** typing box remains primary; recommendation may appear below it  
**Result contract:** score → truthful insight/comparable context → one dominant continuation → secondary cross-skill → tertiary social/share → details  
**Weak-key rule:** do not promise adaptive bias unless it is actually implemented and tested  
**Competition:** one Arena family; Daily is front door; URLs preserved  
**Progress:** reorder existing page; recommendation before identity/sync/privacy administration  
**For Teams:** participant/organizer hierarchy; security/destructive controls in Settings  
**Assessments:** lightweight intro before candidate module 1  
**Visible accounts:** none  
**Ordinary history:** device-local  
**Shared identity:** lazy anonymous shared identity + nickname where needed  
**Runtime AI:** none  
**Certification:** not claimed  
**Ads:** never above/inside the concentration-critical Home workspace or other active tasks  
**SEO:** preserve all 25 current route-registry destinations; simplify perception, not URLs  
**Current domain truth:** repository-configured `NEXT_PUBLIC_SITE_URL` / root custom-domain build, presently prepared around `typingarena.click`; legacy `.com` is not canonical product truth  
**Primary UX KPI:** result-to-next-task rate  
**Primary activation KPI:** landing-to-first-keystroke / Home workspace start rate  
**Primary strategic KPI:** audio adoption and repeat use beyond typing-only behavior  
**Primary risk:** the site still feels like a feature catalogue rather than one guided improvement system  
**v4 answer:** let the user experience the core tool immediately, then orchestrate the rich feature set already built before adding more.

---

