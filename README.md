# TypingArena — Typing / Dictation / Transcription Arena

> **Train and prove how accurately and quickly you can turn what you see or hear into text.**
> One arena for typing, listening, dictation and transcription performance.

**Research verdict:** STRONG GO — #1 bootstrap priority, 9/10 feasibility (blueprint 23 Aug 2026). Free-first, ads-supported, **no runtime AI inference**. Small SEO-led team.

Home: https://github.com/drewsebastians/TypingArena

---

## Strategic Thesis

Do not build another WPM site. Build a **human input-performance arena** that unifies:

`Visual typing → Dictation → Transcription → Analytics → Adaptive practice → Daily competition → Repeat`

**Moat:** measurable human skill + persistent skill history + audio/transcription progression + competition. If AI performs the task, it defeats the purpose — AI is a cheating vector, not a substitute.

**Decisive KPI:** Do dictation/transcription create more retention & identity than plain WPM? If users only use generic typing test, it's a commodity. If audio modes drive repeat behavior, it's defensible.

---

## MVP (shipped)

- [x] **Sprint** 15/30/60s typing test — `src/components/TypingEngine.tsx:1`
- [x] **WPM / accuracy / CPM** — standard `WPM = chars/5/min` — `src/lib/scoring.ts:1`
- [x] **Per-key + bigram error profile** + correction latency — `src/lib/scoring.ts:30`
- [x] **English + Indonesian corpora** — `src/lib/content/english.ts:1`, `src/lib/content/indonesian.ts:1`
- [x] **Dictation** (EN/ID, strict + normalized + word accuracy, TTS via Web Speech API, replay count/ratio) — `src/components/DictationEngine.tsx:1`, `src/lib/scoring.ts:60`
- [x] **Transcription Sprint** 30–120s + replay analytics — `src/app/transcription-practice/page.tsx:1`
- [x] **Numbers & Data** mode — `src/app/data-entry-test/page.tsx:1`
- [x] **Punctuation / Copy Pro** — `src/app/punctuation-typing-test/page.tsx:1`
- [x] **Deterministic adaptation** `priority = weakness + freshness + variety` — `src/lib/skillMatrix.ts:1`
- [x] **Skill profile** (weak keys/bigrams, XP/level, streak, recommendation) — `src/components/SkillProfile.tsx:1`
- [x] **History** anonymous localStorage, optional username after value — `src/lib/history.ts:1`
- [x] **Daily Arena** (same challenge for all, deterministic daily seed) — `src/lib/daily.ts:1`, `src/app/daily-arena/page.tsx:1`
- [x] **Async leaderboard** + integrity signals (paste, burst, focus) — `src/lib/scoring.ts:120`, `src/app/leaderboard/page.tsx:1`
- [x] **Share card** (Web Share API) — `src/components/ResultCard.tsx:1`
- [x] **SEO surface** tool-led routes (see Site Architecture below) + sitemap/robots — `src/app/sitemap.ts:1`
- [x] **Ad-safe layout** — ads never inside active test, reserved slots — `src/app/globals.css:20`
- [x] **Accessibility** keyboard operable, focus visible, stable layout

---

## Site Architecture (SEO blueprint §14)

```
/                          → hero + instant test + discovery
/typing-test               → 15/30/60s (query ?duration=15|30|60)
/typing-test/1-minute      → canonical 60s page
/typing-test/indonesian    → ID typing pool
/tes-mengetik               → localized landing (Indonesia wedge)
/dictation                 → hub (EN/ID toggle)
/dictation/english         → EN listening drills
/dictation/indonesian      → ID dikte
/transcription-practice    → MVP+ 30s+ clips + replay ratio
/data-entry-test           → numbers/dates/codes
/punctuation-typing-test   → precision mode
/daily-arena               → daily standardized challenge
/leaderboard               → async, filterable
/progress                  → history, sparkline, streak, skill matrix
```

Every indexable page **is** the tool (Google people-first, no thin programmatic explosion).

---

## Tech Stack

- **Next.js 16** App Router + TypeScript (static export, SEO-first)
- **Tailwind CSS 4**
- **No DB for MVP** — localStorage for history/leaderboard/daily (deterministic daily seed `src/lib/daily.ts:5`). Production swap: add Postgres/Supabase for leaderboard + auth.
- **No runtime AI/ASR** — reference transcript comparison + Web Speech API TTS for audio (no inference cost, `src/lib/tts.ts:1`)

---

## Scoring Spec (blueprint §9)

| Metric | Formula |
|---|---|
| **Gross WPM** | `typedChars / 5 / minutes` — `src/lib/scoring.ts:7` |
| **CPM** | `typedChars / minutes` |
| **Accuracy** | `correct chars / max(targetLen, typedLen)` |
| **Per-key** | exposures, errors, rate per char |
| **Bigram** | exposures/errors per expected 2-char sequence |
| **Dictation strict** | exact incl. punct/case via Levenshtein similarity |
| **Dictation normalized** | case-insensitive, punct-removed similarity |
| **Word accuracy** | correct positional words / ref word count |
| **Replay ratio** | `totalAudioSecondsPlayed / clipDuration` |
| **Integrity** | `flagged` if paste or burst (>10 chars/400ms) or focusLost>2; else `practice` if focusLost>0 else `ranked` |

Normalization version `v1.0.0` stored per result for reproducibility. Past scores never silently incomparable.

---

## Deterministic Adaptation (blueprint §10)

```
Keystrokes → Error stream → per-key/bigram stats → Skill matrix → Exercise selector → Next challenge
```

Selectors implemented in `src/lib/skillMatrix.ts:48`:
```
Exercise Priority = weakness relevance + freshness + variety + target difficulty
```
- Weak key threshold `>15%` error rate, weak bigram `>25%` with `>2` exposures
- Rotation avoids monotony; every 3rd session nudges to audio

Example insights (rule-generated, no LLM):
- “You miss apostrophes more often”
- “Accuracy drops on number-heavy tests”
- “Bigram `th` needs practice”

---

## Content Strategy

- Curated corpora with metadata: language, mode, char/word count, punct types, difficulty, source, tags — `src/lib/types.ts:4`
- **No runtime generation** — all exercises reviewed; deterministic variety only
- Indonesian audio: Web Speech `id-ID` TTS for MVP; Common Voice CC0 verified source noted for future ingestion (must re-verify license/version before import, blueprint §11.2)

---

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build — verifies scoring, types, static generation
npm run lint
```

Node 20+ required. No env vars for MVP.

---

## Analytics Event Dictionary (blueprint §16)

Capture in production analytics (PostHog/GA4). MVP currently local-only.

`landing_view`, `test_start`, `typing_test_start`, `typing_test_complete`, `keystroke_error`, `correction`, `paste_detected`, `dictation_start`, `audio_play`, `audio_replay`, `dictation_complete`, `transcription_start`, `transcription_complete`, `account_created`, `history_viewed`, `next_recommended_start`, `streak_incremented`, `daily_arena_start`, `daily_arena_complete`, `leaderboard_view`, `friend_challenge_created`, `share_card_created`, `focus_lost`, `suspicious_burst_detected`, `session_unranked`

**North star:** `meaningful completed sessions per returning user`
**Thesis ratio:** `audio-mode repeat users / typing-only repeat users`

---

## Monetization (blueprint §15)

Phase 1 **Free + ads** (this MVP): static slots on result/discovery pages only. Never inside active typing/audio area; no interstitial during timed task; no autoplay audio.

Phase 2 Ad-free premium + advanced analytics. Phase 3 Teams/schools/employer assessment (only after retention proven).

---

## Validation Gates (blueprint §17)

- **Test A commodity acquisition:** SEO landing → test start → completion
- **Test B cross-mode conversion:** typing → dictation start rate
- **Test C retention lift:** D1/D7/D30 audio users vs typing-only
- **Test D transcription depth:** replay analytics, completion, repeat
- **Test E competition loop:** daily participation, repeat, sharing

**GO** if audio modes show adoption + distinct repeat + multi-mode profile usage. **STOP/PIVOT** if sessions end after generic WPM and audio ignored — then remain SEO typing property, don't over-build multiplayer.

---

## Roadmap

- **MVP+ next:** error heatmap, friend challenges, streak polish, 5-min mode, sound/noise challenge
- **Later:** ranked seasons, real-time multiplayer (only after Daily Arena proves demand), career tracks, custom test creation, transcription libraries, tournament API

---

## Privacy & Compliance (blueprint §19)

- Anonymous play first; account optional after value
- Minimal data; no raw keystroke stream stored beyond summarized metrics; leaderboard username separate from private history
- Private history non-indexable (`robots.ts`)
- No child data collection in MVP wedge (teens/adults focus avoids COPPA/ID child complexities)
- Audio license recorded per exercise; CC0/common-voice re-verified per release

---

## Contributing

PRs welcome. Keep runtime deterministic. Add new corpus items with full metadata + difficulty calibration.

## License

ISC — curated corpora are original for MVP. Swap in CC0 Common Voice subset with documented source/version before scaling audio.
