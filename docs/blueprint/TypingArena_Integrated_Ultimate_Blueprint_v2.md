# TypingArena — Integrated Ultimate Blueprint v2
## Strategic Product Blueprint + Goal-First Product Architecture + Current Repository Reality

**Document status:** Canonical north-star specification  
**Prepared:** 30 August 2026  
**Repository:** `drewsebastians/TypingArena`  
**Public main reviewed:** `b99779bc208c5abd2aa2e67e618927a2db949c42`  
**Goal-First implementation branch reviewed:** `codex/goal-first-wave1`  
**Reviewed branch head:** `4c9dfdac1b5d7f9c250f4ab7c896b25ac74f664c`  
**Goal-First Figma:** `https://www.figma.com/design/vM7Ncr9GRINv0rwbW1n6Qd`  
**Runtime policy:** AI may assist development, research, coding, QA, and content preparation; **production runtime must not use AI inference**.

---

# 0. Purpose of This Integrated Blueprint

TypingArena now has two valid blueprint lineages:

1. **Original Strategic Ultimate Blueprint** — derived from the deep-research feasibility study. It defines why TypingArena should exist, who it should serve, the competitive whitespace, the product doctrine, the acquisition/retention thesis, the advertising model, the major risks, and the strategic validation question.
2. **Goal-First Ultimate Blueprint v1** — created after repository review and UI/UX research. It defines how the current mature codebase should be reshaped into the approved Goal-First, no-visible-account experience while preserving its scoring, security, routes, accessibility, and no-runtime-AI properties.

The Goal-First blueprint was therefore mostly an **implementation/product-UX architecture blueprint**. It was never meant to erase the broader strategic research.

This v2 blueprint merges both. Where they conflict, use the following resolution rules:

- Strategic research remains authoritative for product thesis, market wedge, differentiation, growth loops, content philosophy, and the decisive business hypothesis.
- Explicit later owner decisions supersede earlier flexible assumptions. The most important example is identity: the original strategy allowed an optional account after first value; the approved direction is now **no visible account system at all**.
- Current repository reality supersedes old sequencing assumptions. Features originally listed as “later roadmap” but already built should be preserved and hardened, not removed merely to match an old phase plan.
- Security/scoring ADRs and passing regression tests remain authoritative for trust boundaries and metric semantics.

This document should become the canonical product north star after it is placed in the repository.

---

# 1. Executive North Star

TypingArena should not become another generic typing-speed website.

It should become a **human input-performance arena** that trains and measures how accurately and quickly a person can turn what they **see or hear into text**.

The central proposition remains:

> **Train and prove how accurately and quickly you can turn what you see or hear into text.**

A product-oriented expression is:

> **One arena for typing, listening, dictation, transcription, and human text-input performance.**

The approved entry experience is now Goal First:

> **What do you want to improve today?**

The six canonical goals are:

1. **Type Faster**
2. **Listen Better**
3. **Transcribe Accurately**
4. **Prepare for Work**
5. **Compete**
6. **Teach / Assess**

The target operating model is:

- free-first;
- no visible account requirement;
- local-first ordinary practice;
- ads-supported launch and growth model;
- server-backed anonymous identity only when a shared feature needs identity;
- nickname as the visible shared identity;
- English + Bahasa Indonesia;
- deterministic scoring and adaptation;
- no runtime AI;
- tool-led SEO for acquisition;
- useful results, cross-mode recommendations, local progress, Daily Arena, competition, and sharing for retention.

The decisive strategic validation question remains:

> **Do dictation and transcription create meaningful adoption, repeat behavior, and product identity beyond a commodity WPM test?**

If users remain typing-only, TypingArena risks becoming a commodity typing site with extra features. If audio modes generate meaningful engagement and repeat behavior, the combined visual + audio + transcription identity is defensible.

---

# 2. Strategic Research Verdict

The original research ranked Typing / Dictation / Transcription Arena as the strongest bootstrap opportunity among the concepts studied and gave it a **9/10 feasibility score** with a **STRONG GO** verdict.

The reasoning was the combination of:

- near-instant time-to-value;
- high-intent tool-shaped search demand;
- natural repeatability through practice;
- low runtime variable cost;
- strong resistance to AI substitution;
- multiple measurable progression dimensions;
- social and competitive loops;
- credible ad-supported category precedent.

The historical research estimate of approximately **US$20k–55k / 10–16 weeks** described a polished MVP built from scratch. It is retained as historical research context only. It is **not a current estimate of remaining work**, because the repository now contains substantially more functionality than the original MVP and MVP+.

---

# 3. Product Thesis and Competitive Whitespace

## 3.1 Core job to be done

Users hire TypingArena to:

- measure typing speed and accuracy;
- practice efficient typing;
- improve punctuation, capitalization, symbols, numbers, and code-like input;
- improve listening accuracy;
- practice English or Indonesian dictation;
- practice longer-form manual transcription;
- understand personal error patterns;
- improve weak keys and bigrams;
- reduce correction friction;
- compare performance over time;
- compete with friends or a wider community;
- prepare for practical data-entry/transcription-like tasks;
- obtain a useful indicator of human input performance.

## 3.2 What TypingArena is not

TypingArena is not primarily:

- a children's typing curriculum;
- a generic typing lesson site;
- a Monkeytype clone;
- a TypeRacer clone;
- automatic transcription software;
- speech-to-text software;
- an AI tutor;
- a productivity transcription editor;
- a legally consequential certification platform;
- a formal employer proctoring platform.

Teams, classrooms, employer assessments, multiplayer, and tournament capabilities may exist, but they must not redefine the core brand away from the consumer human-performance arena unless later usage evidence justifies it.

## 3.3 Competitive whitespace

The strongest whitespace is not any single feature. It is the intersection:

> **visual copying + audio listening + dictation + real transcription behavior + error analytics + deterministic progression + competition**

No major competitor in the original research set fully owned that combination as one consumer performance identity.

## 3.4 Product doctrine

### Rule 1 — Human skill is the product
Do not build technology that performs the user's task for them.

### Rule 2 — WPM acquires; audio differentiates
Typing-speed demand is a strong acquisition wedge. Dictation and transcription should create the distinctive product identity.

### Rule 3 — Measurement before content volume
High-quality scoring, analytics, and progression are more valuable than thousands of low-quality exercises.

### Rule 4 — Deterministic does not mean dumb
Structured skill data and rules can provide personalized next actions without runtime AI.

### Rule 5 — Search must lead into habit
SEO is acquisition. Results, cross-mode practice, Daily Arena, progression, sharing, and competition are retention.

### Rule 6 — Free must still feel serious
Advertising may fund the product but may never compromise timing, concentration, audio clarity, or trust.

### Rule 7 — Advanced features must earn prominence
The fact that multiplayer, Teams, Custom Tests, or Assessments already exist does not mean they should dominate the core consumer experience before the central typing→audio thesis is proven.

### Rule 8 — Goal First is the entry architecture, not the entire strategy
The six goals make the product understandable. They do not replace the multi-skill strategic thesis.

---

# 4. Target Users

## 4.1 Initial consumer wedge

The initial wedge remains teens/adults rather than K–12-first.

Priority segments:

- language learners;
- job seekers and career learners;
- typing enthusiasts;
- productivity/self-improvement users;
- transcription learners;
- data-entry/administrative skill learners;
- competitive casual users.

## 4.2 Secondary segments

- workplace teams;
- study groups;
- classrooms;
- language schools;
- employers/training teams;
- transcription/training providers.

These segments may use existing product capabilities, but their existence should not force the consumer UX into a heavy SaaS/account model.

## 4.3 Child/privacy posture

Do not design the launch product around child-specific profiles or school data collection. If a future school product is intentionally targeted at children, treat privacy/compliance/ad restrictions as a distinct product-design problem.

---

# 5. Conflict Resolution Log

This section is authoritative where older documents disagree.

| Topic | Original strategic blueprint | Goal-First / later owner decision | Resolved v2 rule |
|---|---|---|---|
| Account model | Optional account after first value | No visible Login / Sign up / Account | **No visible account system.** Shared actions may use anonymous Supabase Auth internally. |
| Practice history | Persistent history, often account-oriented | “Progress on this device” | Ordinary practice history is device-local and canonical. |
| Cross-device history | Supported as later account value | Removed from user promise | Do not market cross-device history sync. |
| Social conversion | Share → friend → new account / repeat | No account | Share → friend → anonymous shared identity if needed → repeat. |
| Mobile | Desktop keyboard performance first | Responsive product supports mobile too | Desktop/laptop remains the performance reference; mobile must remain fully usable/accessibly responsive where sensible. |
| Pre-session ads | Allowed in original monetization options | Low-friction instant-start priority | Default to post-result/discovery/outside-task inventory. Never block exercise start with an ad. |
| Multiplayer | Originally later after Daily | Already implemented | Preserve, but keep lower strategic prominence than audio differentiation. |
| Teams / Assessments | Originally later | Already implemented | Preserve and harden; do not make them the core consumer identity. |
| Certification | Possible later | Career Mode explicitly not certification | No certification claim without stronger validity/integrity evidence. |
| Audio source | Common Voice mentioned as candidate | Repo uses static Piper WAV | Piper/static reviewed audio is current implementation truth. Common Voice is historical research context only. |
| Goal First | Not in original research | Approved entry/IA model | Goal First is canonical entry architecture. |
| Tech stack | Flexible | Mature Next.js + Supabase implementation | Preserve current stack unless evidence later justifies migration. |
| MVP sequencing | Real-time multiplayer/Teams later | Already built | Treat as existing capabilities; prioritize validation/polish rather than removal. |
| Monetization focus | Ads-supported free | Ads revenue is explicit business goal | Maximize useful monetizable sessions, not ad density during tasks. |

---

# 6. Current Repository Reality

## 6.1 Reviewed branch state

Public `main` reviewed:

`b99779bc208c5abd2aa2e67e618927a2db949c42`

Goal-First implementation branch reviewed:

`codex/goal-first-wave1 @ 4c9dfdac1b5d7f9c250f4ab7c896b25ac74f664c`

The branch was created from the Pass VII branch head and is therefore ahead by its Goal-First commits while one merge commit behind public `main`. Before final PR review, ancestry should be reconciled cleanly with the latest `origin/main`.

## 6.2 Wave 1 implementation status

Wave 1 materially implemented:

- B00 baseline/evidence;
- B01 route registry + six-goal registry;
- B02 anonymous identity and capability-token code;
- B03 local-first practice and retirement of visible account UX;
- B04 Goal-First-compatible global navigation/accessibility improvements;
- B05 Goal-First homepage;
- B06 shared active-task/result/ad-safe primitives.

However, B02 is **implemented but not fully accepted**, because the Wave 1 environment did not run real DB integration. Supabase CLI/Docker were unavailable.

## 6.3 Wave 1 validation evidence

Reported on the reviewed branch:

- lint: PASS;
- typecheck: PASS;
- Vitest: 166 tests / 19 files PASS;
- static build: PASS;
- Playwright: 55 passed + 1 intentional skip across desktop/mobile;
- no-runtime-AI bundle guard: PASS;
- local production-readiness checks: PASS;
- real DB integration: **NOT RUN**;
- branch production live smoke: **NOT RUN**;
- `npm ci`: previously blocked by a package-lock/package.json mismatch involving `@emnapi/runtime`.

These missing proofs are the highest-priority closure items.

## 6.4 Existing capabilities beyond the original MVP

The current repository already contains:

- Sprint 15/30/60;
- true five-minute endurance;
- Copy Pro / punctuation / numbers;
- EN/ID dictation;
- transcription practice;
- transcription library;
- noise challenge;
- local history and deterministic recommendation;
- Daily Arena;
- leaderboard;
- ranked seasons;
- friend challenges;
- multiplayer;
- Career Mode;
- Teams/Classrooms;
- Custom Tests;
- Employer Assessments;
- Tournament API foundation;
- static SEO route portfolio;
- analytics adapter;
- ad-slot architecture;
- production-readiness automation.

Therefore the remaining challenge is no longer “build the roadmap.” It is:

> **prove the new identity/security architecture, finish cross-route Goal-First coherence, close production/monetization readiness, and instrument the product to validate the strategic thesis.**

---

# 7. Goal-First Experience Architecture

## 7.1 Homepage

The homepage should lead with:

> **What do you want to improve today?**

The six goals are the primary orientation layer.

The first three goals must launch real engines directly:

- Type Faster → typing;
- Listen Better → dictation;
- Transcribe Accurately → transcription.

The remaining goals should route into existing real capabilities:

- Prepare for Work → Career / data entry / punctuation;
- Compete → Daily Arena first, then leaderboard/multiplayer;
- Teach / Assess → Teams / Custom / Assessments.

## 7.2 First-session strategic loop

Goal First must still express the original multi-skill thesis.

Recommended consumer path:

`Goal selection → first exercise → useful result → cross-mode next action → second exercise → local progress / Daily Arena`

Typing users should be deliberately exposed to audio. Dictation users should be deliberately exposed to transcription where appropriate.

## 7.3 Result contract

Every result should answer:

1. How did I perform?
2. Where did I struggle?
3. Am I improving?
4. What should I do next?
5. How do I compare, if this is ranked/shared?

Advanced analytics belong behind progressive disclosure after the primary result is clear.

## 7.4 Active-task focus

During an active exercise:

- no ad;
- secondary navigation/chrome de-emphasized;
- stable layout;
- keyboard focus preserved;
- no autoplay marketing media;
- no overlay between prompt and input.

## 7.5 Mobile strategy

Desktop/laptop remains the performance reference for serious keyboard measurement.

Mobile still must support:

- complete discovery;
- Goal-First selection;
- usable practice where technically sensible;
- listening/transcription;
- progress/history;
- sharing/shared feature flows;
- accessible navigation.

Do not optimize touchscreen typing at the expense of desktop measurement fidelity.

---

# 8. Information Architecture and Route Portfolio

The route registry should remain the operational inventory.

## 8.1 Core acquisition/practice

- `/`
- `/typing-test`
- `/typing-test/1-minute`
- `/typing-test/5-minute`
- `/typing-test/indonesian`
- `/tes-mengetik`
- `/data-entry-test`
- `/punctuation-typing-test`
- `/dictation`
- `/dictation/english`
- `/dictation/indonesian`
- `/noise-challenge`
- `/transcription-practice`
- `/transcription-library`
- `/career`

## 8.2 Competition

- `/daily-arena`
- `/leaderboard`
- `/seasons`
- `/friends`
- `/multiplayer`

## 8.3 Teach / Assess

- `/teams`
- `/custom`
- `/assessments`

## 8.4 Utility

- `/progress` — private/noindex;
- `/privacy`.

Do not create six thin Goal URLs solely because the homepage has six goals.

---

# 9. Product Modes and Measurement

## 9.1 Typing Sprint

Durations:

- 15 seconds;
- 30 seconds;
- 60 seconds;
- true five-minute endurance.

Preserve current scoring semantics and outputs such as:

- WPM;
- accuracy;
- corrected/unfixed errors;
- key-level errors;
- bigram analysis;
- correction latency;
- integrity signals.

## 9.2 Copy Pro / Punctuation

Use realistic capitalization, punctuation, symbols, mixed case, numbers, and sentence structure.

## 9.3 Numbers / Data Entry

Use realistic structured input such as dates, quantities, codes, mixed alphanumerics, addresses, and punctuation-heavy records.

## 9.4 Dictation

Preserve current score layers and playback analytics, including strict/normalized/word/punctuation scoring where implemented.

## 9.5 Transcription

Preserve longer audio workflow and metrics such as normalized accuracy, effective WPM, replay ratio, pause count, and completion behavior.

## 9.6 Noise Challenge

Noise difficulty should remain deterministic and calibrated rather than decorative.

## 9.7 Daily Arena

Everyone receives the same standardized challenge for the same Asia/Jakarta product day. Public standings come only from server-accepted results.

## 9.8 Career Mode

Current track set:

- data entry;
- office/admin;
- numbers & codes;
- punctuation precision;
- transcription.

Career Mode remains a **skill benchmark/practice assessment**, not certification.

---

# 10. Identity and Persistence Architecture

## 10.1 No visible account system

Normal users should not see:

- Login;
- Sign up;
- email authentication;
- password;
- account dashboard;
- cross-device-sync promise.

## 10.2 Ordinary local visitor

Ordinary practice works locally and should remain usable without Supabase.

Local state may contain:

- histories;
- streak;
- personal best;
- weak keys/bigrams;
- recommendations;
- optional nickname.

## 10.3 Shared pseudonymous identity

A server-backed anonymous Supabase identity is created only when a shared action requires it.

Examples:

- ranked submission;
- Daily Arena publication;
- friend challenge creation/result;
- multiplayer;
- team creation/join;
- custom-test management;
- assessment creator management.

The anonymous identity is an authorization primitive, not a product account.

## 10.4 Nickname

Nickname is the visible public identity.

Requirements:

- bounded;
- sanitized;
- local reuse;
- mirrored to shared profile when needed;
- no email fallback;
- no raw auth UUID display.

## 10.5 Creator resource recovery

Teams, Custom Tests, and Assessments use resource-scoped capability links.

Required properties:

- cryptographically strong token;
- hash-only persistence;
- resource type + ID scope;
- expiry;
- revocation;
- rotation;
- rate limiting;
- no analytics/log leakage;
- no sitemap/canonical leakage;
- management secret distinct from join codes and candidate invites.

Migration `0015_anonymous_identity_capabilities.sql` implements the current foundation. Production acceptance requires real DB integration proof.

---

# 11. Security and Integrity

## 11.1 Ranked trust boundary

Clients provide evidence. The server recomputes authoritative metrics and controls ranked acceptance.

Preserve:

- `submit_attempt()` as authoritative attempt write path;
- direct INSERT/UPDATE restrictions;
- official ranked configuration binding;
- WPM/accuracy recomputation;
- plausibility checks;
- Daily date/version binding;
- idempotency;
- private-history RLS.

## 11.2 Shared/social boundaries

Preserve:

- validated friend result submission;
- host-only multiplayer start/rematch;
- evidence-derived final multiplayer result;
- RPC-controlled team membership;
- real-attempt assignment binding;
- assessment invite lifecycle and exact saved-module resolution.

## 11.3 Anti-cheat positioning

Current evidence signals such as paste, burst, focus loss, claim drift, and official exercise binding are appropriate for casual/competitive integrity.

They are not formal proctoring.

---

# 12. Content and Audio Strategy

## 12.1 Current implementation truth

Runtime content currently uses:

- reviewed static English text;
- reviewed static Indonesian text;
- static pre-generated Piper WAV audio;
- versioned exercise/content identifiers;
- reference transcripts;
- deterministic runtime selection.

## 12.2 Content quality

Every production corpus should be reviewed for:

- naturalness;
- language correctness;
- punctuation;
- difficulty calibration;
- metadata consistency;
- rights/licensing;
- reproducibility.

## 12.3 Audio differentiation

Because “WPM acquires; audio differentiates,” content planning should support repeated audio use, not only a small novelty demo.

Do not introduce runtime generative TTS or ASR as a shortcut for content scale.

---

# 13. SEO and Acquisition

## 13.1 Core rule

> **Build the answer, not pages about the answer.**

Every indexable tool route should perform a real task.

Do not create:

- thin keyword variants;
- parameter-indexed session pages;
- mass-generated SEO articles;
- near-duplicate exercise pages with no distinct value.

## 13.2 Strategic search clusters

- typing speed test;
- WPM test;
- 1 minute typing test;
- 5 minute typing test;
- Indonesian typing test;
- tes mengetik cepat / tes kecepatan mengetik;
- English dictation;
- Indonesian dictation;
- transcription practice;
- data-entry test;
- punctuation typing;
- typing competition / daily challenge;
- friend typing race.

## 13.3 SEO → product loop

`Search → relevant live tool → result → recommended next mode → repeat / Daily Arena`

The Goal-First homepage complements route-specific search landings. It does not replace them.

---

# 14. Growth and Retention Loops

## 14.1 SEO loop

`Search → instant tool → useful result → next mode → repeat`

## 14.2 Improvement loop

`Attempt → weakness insight → targeted practice → improved benchmark → repeat`

## 14.3 Cross-mode loop

`Typing → listening challenge → transcription → multi-skill identity`

This is a strategic priority.

## 14.4 Daily loop

`Daily challenge → score → leaderboard → return tomorrow`

## 14.5 Social loop

`Result/share → friend opens challenge → nickname/anonymous shared identity → comparison → repeat`

## 14.6 Career loop

`Career-intent landing → practical benchmark → targeted practice → local progress → repeated benchmark`

---

# 15. Monetization Blueprint

## 15.1 Primary model

Near-term monetization is **free + advertising**.

The objective is not maximum ads per screen. It is maximum **useful monetizable sessions**.

Primary loop:

`Organic/shared visit → useful task → result → safe ad inventory → next task → repeat`

## 15.2 Preferred inventory

Prioritize:

- post-result;
- discovery sections;
- transcription library;
- leaderboard/season content;
- explanatory content;
- non-active progress/history surfaces where UX/policy allow.

## 15.3 Forbidden behavior

Never place ads:

- inside active typing;
- between prompt and input;
- inside active dictation audio/input flow;
- inside active transcription editor;
- during Daily timed challenge;
- during multiplayer race;
- during team assignment execution;
- during candidate assessment modules;
- in overlays that obscure work;
- in shifting units that disturb task layout.

## 15.4 Pre-session ads

The original research allowed them. The resolved strategy is stricter:

- do not insert a blocking pre-session ad between intent and exercise start;
- a non-blocking discovery ad may be acceptable if it does not delay first value;
- default inventory should favor post-result and outside-task placements.

## 15.5 Future monetization

Possible future models remain optional:

- ad-free plan;
- advanced analytics;
- team/employer monetization;
- sponsored competitions;
- later validated certification.

None should distract from proving retention and AdSense readiness.

---

# 16. Analytics and Strategic Validation

## 16.1 Core KPIs

Measure:

- landing → task start;
- task completion;
- exercises/session;
- second-exercise rate;
- D1/D7/D30 return;
- sessions/user/week where measurable privacy-safely;
- typing → dictation conversion;
- typing → transcription conversion;
- dictation → transcription conversion;
- dictation completion;
- transcription completion;
- Daily participation;
- leaderboard participation;
- friend/share participation;
- Career use;
- suspected-cheat rate;
- ad impressions per useful completed session;
- CLS/layout impact from ads.

## 16.2 Decisive audio metrics

The product specifically needs to know:

- percentage of typing users who start an audio mode;
- percentage who complete it;
- repeat audio sessions;
- audio-mode D1/D7 retention;
- cross-mode session depth;
- whether audio-engaged users return more often than typing-only users.

Do not invent performance thresholds before live baselines exist.

## 16.3 Goal-First events

Track:

- Goal First view;
- selected goal;
- workspace ready;
- direct exercise start;
- goal-to-route click;
- result next-action click.

Analytics must remain consent-gated and PII-free.

Never log:

- email;
- auth UUID;
- typed content;
- assessment answers;
- management capability token.

---

# 17. Accessibility, Responsive Design, and Performance

## 17.1 Accessibility

Target WCAG 2.2 AA-oriented implementation.

Required:

- semantic controls;
- labels;
- visible focus;
- keyboard operation;
- correct dynamic `<html lang>`;
- accessible audio controls;
- proper modal/drawer focus containment;
- Escape close and focus restoration;
- color-independent status;
- reasonable touch targets;
- no autoplay audio.

## 17.2 Regression viewports

- 1440×900;
- 1280×800;
- 768×1024;
- 390×844;
- 375×667;
- 320×568 stress.

## 17.3 Performance

Goal-First must not eagerly bundle every heavy engine/social/admin panel.

Prefer:

- lazy selected-workspace loading;
- route-level code splitting;
- stable ad slot dimensions;
- no unnecessary animation framework;
- static export compatibility.

---

# 18. Technical Architecture

Preserve the current architecture unless strong future evidence justifies change:

```text
Next.js 16 / React 19 / TypeScript
        ↓
Static-export frontend
        ↓
Local-first ordinary practice + browser history
        ↓
Supabase direct client for shared features
        ↓
Postgres RLS + server-authoritative RPC validation
        ↓
Realtime where multiplayer requires it
```

Supporting systems:

- PostHog/GA4 consent-gated adapter;
- static Piper audio;
- GitHub Actions;
- Vitest;
- Playwright;
- DB integration suite;
- production readiness/smoke scripts.

---

# 19. Canonical Source-of-Truth Hierarchy

After this document is installed in the repository:

1. `docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v2.md`
2. `docs/blueprint/TypingArena_Grand_Batching_Plan_v2.md`
3. current security/scoring ADRs for detailed trust/scoring semantics
4. approved Goal-First Figma for layout/information hierarchy
5. current repository and tests as implementation reality
6. original strategic blueprint as research provenance
7. historical Goal-First v1 blueprint and Wave 1 prompt as superseded implementation records

A contradiction must be documented and resolved, not silently ignored.

---

# 20. Current Completion Matrix

| Area | Reviewed status | Ultimate-state interpretation |
|---|---|---|
| Core typing engine | Implemented | Preserve and route-align |
| Dictation engine | Implemented | Preserve; strategic differentiator |
| Transcription engine | Implemented | Preserve; strategic differentiator |
| EN + ID | Implemented | Preserve; quality-expand only with review |
| Static Piper audio | Implemented | Current audio source of truth |
| Goal registry | Implemented Wave 1 | Preserve |
| Route registry | Implemented Wave 1 | Preserve/use consistently |
| Goal-First homepage | Implemented Wave 1 | Validate/polish, not rebuild |
| No visible account UX | Implemented Wave 1 | Preserve |
| Anonymous shared identity | Implemented in code | **DB proof pending** |
| Capability management tokens | Implemented in code | **DB proof/security acceptance pending** |
| Device-local Progress | Substantially implemented | Final audit/polish pending |
| Safe active-task ads | Implemented for Wave 1 | Cross-route audit/rollout pending |
| Typing route-family shell | Deferred B07 | Pending |
| Audio route-family shell | Deferred B08 | Pending |
| Career/Library alignment | Deferred B09 | Pending |
| Daily/Leaderboard/Seasons | Existing capability | Goal-First/no-account coherence pending |
| Friends/Multiplayer | Existing capability | Goal-First/no-account coherence pending |
| Teams/Custom/Assessments | Existing + capability integration | Final UX + DB/security proof pending |
| SEO production closure | Foundation exists | Final audit pending |
| Strategic analytics closure | Adapter exists | Cross-mode KPI audit pending |
| AdSense activation | Architecture only | External approval/config pending |
| Production migration 0015 | Not proven/applied in report | External/hosted activation pending |
| Full hosted smoke | Not run for branch | Pending |
| B07–B16 closure | Not complete | Pending |

---

# 21. Ultimate Definition of Done

TypingArena is not blueprint-complete merely because the UI builds.

## Layer A — Product Experience

- [ ] Goal-First entry is coherent desktop/mobile.
- [ ] First three goals run real engines.
- [ ] Cross-mode next actions deliberately expose audio.
- [ ] All useful routes remain usable and consistently presented.
- [ ] No visible account/login/email flow.
- [ ] Device-local Progress is clear.
- [ ] Advanced features do not overwhelm the consumer core loop.

## Layer B — Engineering and Security

- [ ] Clean `npm ci` is reproducible.
- [ ] Migrations apply from a fresh DB.
- [ ] Anonymous/capability migration passes real DB integration.
- [ ] Direct attempt forgery remains blocked.
- [ ] Official ranked binding remains intact.
- [ ] Capability tokens are hash-only, scoped, rate-limited, revocable, and non-leaking.
- [ ] Teams/Custom/Assessments recovery is end-to-end proven.
- [ ] Static build/no-runtime-AI guards pass.
- [ ] Desktop/mobile Playwright passes.

## Layer C — Acquisition and Monetization Readiness

- [ ] Every indexable route has distinct utility.
- [ ] Sitemap/canonical/noindex behavior is correct.
- [ ] Ads remain outside active tasks.
- [ ] Ad slots are stable and non-deceptive.
- [ ] Privacy/consent reflects actual behavior.
- [ ] AdSense remains inactive until real approval/IDs.
- [ ] Search Console/AdSense owner actions are documented.

## Layer D — Strategic Validation Readiness

- [ ] Goal/cross-mode analytics are live and privacy-safe.
- [ ] Audio adoption/retention can be measured.
- [ ] No fabricated demand/retention claims.
- [ ] Launch review distinguishes typing-only and audio-engaged usage.
- [ ] Expansion decisions use real behavior.

---

# 22. Completion Status Must Be Multi-Layered

After engineering closure, keep these statuses separate:

- **Engineering complete**
- **Production activated**
- **AdSense activated**
- **Strategic thesis validated**

The last item requires real usage data and cannot be achieved by a coding session.

---

# 23. Immediate Priorities from the Current Branch

1. Install this integrated blueprint and updated batching plan into the repo.
2. Reconcile `codex/goal-first-wave1` lineage with the latest `main` before PR.
3. Fix the clean-install lockfile mismatch and prove `npm ci`.
4. Run fresh Supabase DB integration including migration 0015.
5. If local Supabase is unavailable, use GitHub Actions as authoritative DB proof.
6. Continue B07–B09 route-family migrations.
7. Finish competition/social Goal-First coherence.
8. Finish Teams/Custom/Assessments UX and capability proof.
9. Close Progress/Privacy semantics.
10. Close SEO/analytics/ad readiness.
11. Run whole-product accessibility/mobile/performance audit.
12. Run hosted/preview smoke where safe.
13. Create blueprint traceability and independent red-team closure.
14. Merge/deploy only through owner-controlled steps.
15. After launch, measure whether audio truly differentiates the product.

---

# 24. One-Page Summary

**Product:** TypingArena — Typing / Dictation / Transcription Arena  
**Strategic thesis:** human input-performance arena, not generic WPM site  
**Core proposition:** Train and prove how accurately and quickly you can turn what you see or hear into text  
**Entry architecture:** Goal First  
**Six goals:** Type Faster, Listen Better, Transcribe Accurately, Prepare for Work, Compete, Teach / Assess  
**Initial users:** teens/adults, language learners, job seekers, typists, productivity users, transcription/data-entry learners, competitive casuals  
**Launch model:** free-first + ads  
**Visible accounts:** none  
**Ordinary progress:** local/device-first  
**Shared identity:** lazy anonymous Supabase Auth + nickname  
**Creator recovery:** resource-scoped capability links  
**Runtime AI:** none  
**Acquisition:** tool-led SEO  
**Retention:** useful results + cross-mode recommendations + local progress + Daily Arena + competition  
**Moat thesis:** WPM acquires; audio differentiates  
**Current implementation:** Wave 1 B00–B06 materially implemented; anonymous/capability DB proof pending; B07–B16 incomplete in varying degrees  
**Primary current technical risk:** shipping migration 0015 architecture without fresh DB proof  
**Primary market risk:** users stay typing-only and ignore audio  
**Ad rule:** never interfere with an active skill task  
**Certification:** excluded until much stronger validity/integrity evidence  
**Ultimate strategic KPI:** audio adoption and repeat use beyond typing-only behavior
