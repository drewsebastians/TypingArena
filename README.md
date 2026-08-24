# TypingArena — Typing / Dictation / Transcription Arena

> **Train and prove how accurately and quickly you can turn what you see or hear into text.**
> One arena for typing, listening, dictation and transcription performance.

Free-first • anonymous practice • **no AI inference at runtime** • English + Bahasa Indonesia.

---

## What this is

Not another WPM calculator: a human input-performance arena combining
**timed typing → dictation → transcription → analytics → deterministic adaptive
practice → shared competition**.

- Every exercise comes from a reviewed, versioned corpus. Nothing is generated
  at request time.
- Scoring is deterministic, documented and versioned (`docs/ADR-003-scoring.md`).
- Dictation/transcription play **static audio files** generated during
  development; the runtime never calls any TTS/ASR/LLM service (CI enforces it).

## Status labels used in this README

**COMPLETE** — works as described, with tests. **PARTIAL** — core works, named
gaps remain. **DEFERRED** — deliberately not built yet. Nothing in this README
is claimed "shipped" that is actually local-only or simulated.

---

## Implemented now

### Typing modes — COMPLETE
- Sprint 15/30/60s + **true 5-minute endurance**: tests run the full clock over an
  endless deterministic stream assembled from the reviewed corpus — finishing a
  passage never ends a timed test.
- Gross/net WPM, CPM, typed-scope accuracy (untouched text is never penalized).
- Per-key & bigram error profiles from event-level tracking (alignment-robust),
  error heatmap, correction latency, corrected vs uncorrected errors.
- Copy Pro / punctuation precision and Numbers & Data pools (EN+ID).
- Integrity signals: paste blocked + flagged, impossible-burst detection,
  de-duplicated focus-loss counting → ranked / practice / flagged.

### Dictation — COMPLETE (audio library PARTIAL)
- Real static audio clips, English + Indonesian, strict + normalized scoring,
  word accuracy, punctuation accuracy, effective WPM.
- Playback analytics measured from media events: initial play ≠ replay,
  actual seconds heard, pause count, seek count, replay ratio against real duration.
- Noise Challenge layers filtered noise at four honest difficulty tiers.

### Transcription Sprint — COMPLETE (library PARTIAL)
- Multi-clip EN/ID workspace, full metrics incl. active typing time,
  corrections, replay ratio; persistent history; cross-mode recommendations.

### Progress & adaptation — COMPLETE
- Anonymous local history (typing/dictation/transcription), streaks on the
  Asia/Jakarta product day (one qualifying activity per day, all modes count),
  XP/levels across modes.
- Multi-skill matrix: typing weaknesses, dictation-derived listening weakness
  (score + replay reliance), transcription depth — feeding a transparent
  deterministic next-exercise recommendation.

### Shared competition — COMPLETE code path / needs credentials to activate
Architecture: **static frontend + Supabase direct client + RLS**
(`docs/ADR-001-deployment.md`, schema in `supabase/migrations/0001_init.sql`):
- Ranked leaderboard by mode/language/duration; Daily Arena shared board per
  product date; one ranked daily attempt per user per day.
- Cross-device friend challenges backed by central records (unguessable ids,
  immutable payload, result comparison) — links work on other devices/browsers.
- Optional magic-link accounts, public username separated from private email,
  one-shot migration of anonymous history, account-data deletion.
- **Without credentials the app degrades honestly**: setup notices instead of
  boards, no fabricated players ever.

### Production plumbing — COMPLETE
- Config-driven canonical URLs (sitemap, robots, metadataBase); private
  `/progress` non-indexed; localized EN/ID tool pages; every indexed page is a
  working tool.
- Consent-gated PostHog/GA4 adapter with the blueprint event dictionary;
  gracefully inert without configuration or consent.
- Reserved ad slots outside active tasks; provider loads only when configured.
- Privacy page, data export, one-click deletion of local/account data.

---

## Site architecture (SEO)

```
/                          hero + instant test + discovery
/typing-test               15/30/60s (?duration=&mode=)
/typing-test/1-minute      canonical 60s page
/typing-test/5-minute      endurance 300s
/typing-test/indonesian    ID pool
/tes-mengetik              localized Indonesian landing
/dictation                 hub (EN/ID toggle)
/dictation/english | /dictation/indonesian
/transcription-practice    multi-clip sprint
/data-entry-test           numbers/dates/codes
/punctuation-typing-test   precision mode
/noise-challenge           noise-tiered dictation
/daily-arena               today's shared challenge
/leaderboard               ranked results (real backend required)
/friends                   cross-device challenges
/progress                  PRIVATE — noindex
/privacy                   data practices
```

## Tech stack

Next.js 16 (App Router, TypeScript strict, static export) · Tailwind 4 ·
Vitest (+ Testing Library) · Playwright · optional Supabase · optional PostHog.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 — everything works locally
npm run lint && npm run typecheck && npm test
npm run build        # static export to out/
npm run serve:static # inspect production output on :4173
npm run test:e2e     # Playwright against out/ (build first; browsers: npx playwright install chromium)
npm run generate:audio  # regenerate static clips (requires: pip install edge-tts)
```

### Environment variables

Copy `.env.example` → `.env.local`. All values are optional; see the file for
each variable's effect. Public values only — nothing secret belongs here.

### Shared competition setup

1. Create a free Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (schema, RLS,
   public views, helper functions).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and rebuild.
4. Schedule `select purge_expired_challenges();` daily (pg_cron or equivalent).
5. Enable magic-link auth (Auth → Email). Disable confirmations if you want
   frictionless first sign-in.

## Scoring spec (summary)

| Metric | Definition |
|---|---|
| Gross WPM | typedChars / 5 / minutes |
| Net WPM | (typedChars − uncorrectedErrors) / 5 / minutes |
| Accuracy | correctChars / typedChars — typed scope only |
| Errors | raw events = corrected + uncorrected (precise event pairing) |
| Correction latency | wrong-entry creation → its removing backspace |
| Per-key / bigram | exposure-weighted, accumulated at keystroke time |
| Dictation scores | strict (case+punct aligned), normalized (v2 rules), word alignment, punctuation alignment |
| Replay ratio | actual played seconds ÷ real clip duration |

Full semantics + rationale: `docs/ADR-003-scoring.md`. Every result stores
exercise/scoring/normalization/challenge versions for reproducibility.

## Testing

- **Unit/component (Vitest, 100+ assertions):** alignment robustness, WPM math,
  normalization (Unicode NFC, apostrophes, Indonesian), correction semantics,
  burst detection, integrity classification, Jakarta-day boundaries, daily
  determinism, endless stream guarantees, playback reducer, streak logic,
  skill-matrix derivation, corpus/audio-manifest consistency, plus engine
  behaviour: timer starts on first key, does NOT finish when a passage ends,
  finishes exactly at duration, paste flagging, version recording.
- **E2E (Playwright, Chromium desktop + mobile):** full-clock sprints, 5-minute
  HUD, untouched-text accuracy, paste blocking, static audio resolution (EN/ID),
  transcription flow, honest degradation of daily/leaderboard/friends without a
  backend, robots/sitemap hygiene, keyboard reachability.
- **Production guard:** CI fails if `speechSynthesis` appears in any bundle or a
  placeholder domain leaks into output.

## Analytics & measurement

`track()` feeds the consent-gated PostHog/GA4 adapters plus a capped local debug
queue. Event dictionary lives in `src/lib/analytics.ts` (acquisition, mode
start/complete, conversion, integrity, sharing, competition). With PostHog
configured: D1/D7/D30 retention, typing→dictation→transcription funnels, Daily
Arena participation, share rate, suspected-cheat rate are all measurable.
North star: meaningful completed sessions per returning user; strategic ratio:
audio-mode repeat users vs typing-only repeat users.

## Monetization stance

Free + reserved ad slots (result/discovery zones only; never inside active
tasks, no autoplay audio). Provider activates via `NEXT_PUBLIC_ADSENSE_CLIENT`.
Ad-free premium architecture remains trivially feasible.

## Privacy summary

Anonymous-first; minimal storage; no raw keystroke streams (summarized error
profiles only); public username decoupled from private email; consent-gated
analytics; export + delete controls on `/progress`; friend challenge records
expire after 30 days. Details: `/privacy`.

## Honest limitations

- Shared features require Supabase credentials; until configured they show
  setup notices rather than pretending to work.
- Anti-cheat is heuristic; the DB hides non-ranked rows but cannot prove a
  human typed. Not certification.
- Account row deletion (auth.users) requires Dashboard/support action; all
  product data deletes via the app.
- Audio uses dev-time neural narration — see licensing note in
  `docs/LICENSES.md`.

## Roadmap

- **MVP+:** larger clip libraries, career tracks (data-entry/admin), heatmap
  polish, streak refinements.
- **Later (deferred):** ranked seasons, real-time multiplayer, classroom rooms,
  custom test creation, tournament API — each gated behind retention evidence.

## Contributing

PRs welcome. Keep runtime deterministic: reviewed corpora with derived
metadata, static assets with license records, no runtime AI of any kind.
Run `npm run lint && npm run typecheck && npm test` before submitting.

## License

Code: ISC. Content: original works for TypingArena (see `docs/LICENSES.md`
for audio provenance and re-verification requirements).
