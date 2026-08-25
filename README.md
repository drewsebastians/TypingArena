# TypingArena — Typing / Dictation / Transcription Arena

> **Train and prove how accurately and quickly you turn what you see or hear into text.**
> One arena for typing, dictation, transcription, data entry, listening skill,
> progression, competition, career practice, teams/classrooms, and user-created challenges.

Free-first • anonymous practice • **no AI inference at runtime** • English + Bahasa Indonesia.

Live: https://drewsebastians.github.io/TypingArena/

---

## Product overview

| Area | What ships |
|---|---|
| **Typing** | Sprint 15/30/60s + true 5-minute endurance over an endless deterministic stream; gross/net WPM, typed-scope accuracy, aligned per-key/bigram analysis, correction latency |
| **Dictation** | Static EN/ID audio clips, strict + normalized + word + punctuation scoring, real playback analytics (replays, actual seconds, pauses, seeks) |
| **Transcription** | Full-clip sprint mode plus a browsable **library** (`/transcription-library`) with language/difficulty/length/topic filters |
| **Career Mode** | Five practice-assessment tracks (data entry, office/admin, numbers & codes, punctuation precision, transcription) with transparent score bands. *Skill benchmark — explicitly not certification* |
| **Competition** | Server-authoritative ranked leaderboard, Daily Arena (Asia/Jakarta product day), cross-device friend challenges, **monthly ranked seasons** (`/seasons`), **real-time multiplayer races** (`/multiplayer`) |
| **Collaboration** | **Teams & classrooms** (`/teams`): rooms, join codes, assignments, aggregate dashboards; privacy-first (usernames only) |
| **Custom content** | **Custom tests** (`/custom`): user passages with sanitized content and unlisted share links — practice-only, never ranked |
| **Employer tools** | **Skills assessments** (`/assessments`): module sequences, invite-token candidate flow (no signup), private admin summaries |
| **Integration** | **Tournament API**: authenticated edge-function surface with standings built only from server-accepted attempts (`supabase/functions/tournament-api`, spec: `docs/api/openapi.yaml`) |

## No-runtime-AI policy

The website runtime never calls LLMs, ASR, runtime TTS, or any generative
service. All exercises come from reviewed static corpora; all audio is
pre-generated **Piper TTS** output whose MIT license permits redistribution
(including commercial use) — see `docs/LICENSES.md`. CI fails the build if
`speechSynthesis` ever appears in a production bundle or if a placeholder
domain leaks into output.

## Architecture

```
Next.js 16 (App Router, TS strict, static export)
├── Domain logic      src/lib (scoring v2, alignment, sync queue, career, seasons…)
├── UI                src/components, src/app (route-level code splitting)
└── Shared backend    Supabase (Postgres + RLS + RPC + Realtime + optional Edge Functions)

Trust boundary: clients submit compact EVIDENCE via submit_attempt() RPC.
Postgres recomputes wpm/accuracy from counts, decides integrity/ranked itself,
and only server-accepted rows appear in public views. A tampered client cannot
publish fabricated ranked scores.
```

Deployment decision (ADR-001): **static frontend + Supabase direct client +
DB-side validation**. Works on GitHub Pages today; identical build deploys to
Vercel/Netlify without code changes.

## Modes & routes

```
/                          instant test + discovery
/typing-test[/1-minute|/5-minute|/indonesian]   timed sprints
/tes-mengetik              Indonesian landing
/dictation[/english|/indonesian]                listen & type
/transcription-practice    full-clip sprints
/transcription-library     browsable clip library
/data-entry-test           numbers, dates, codes
/punctuation-typing-test   Copy Pro precision
/noise-challenge           noise-tiered dictation
/career                    practice assessments (5 tracks)
/daily-arena               shared daily challenge
/leaderboard · /seasons    ranked boards · monthly seasons
/friends                   cross-device challenges
/multiplayer               realtime race rooms
/teams                     team/classroom rooms + dashboard
/custom                    user-created practice tests
/assessments               employer skills assessments
/progress                  PRIVATE history (noindex)
/privacy                   data practices
```

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 — everything works locally
npm run lint && npm run typecheck && npm test
npm run build        # static export → out/
npm run serve:static # inspect production output on :4173
npm run test:e2e     # Playwright against out/
npm run generate:audio  # regenerate clips (pip install piper-tts)
node scripts/check-production-readiness.mjs   # deploy gate
```

## Environment variables (.env.example)

All optional for demo builds (shared features degrade honestly). Production
builds (`DEPLOY_TARGET=production node scripts/check-production-readiness.mjs`)
**fail closed** unless `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. Optional: PostHog/GA4 keys
(consent-gated), AdSense client id. Never commit secrets.

## Shared backend setup (one-time operator step)

1. Create a free Supabase project.
2. Apply migrations in order: `supabase/migrations/0001_init.sql`,
   `0002_server_authoritative_and_roadmap.sql`, `0003_fix_signup_trigger.sql`,
   `0004_zero_deferred_closure.sql`, `0005_final_closure.sql`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Enable Email (magic-link) auth; set Site URL to your origin.
5. Schedule `select purge_expired();` daily (pg_cron).
6. Optional: `supabase functions deploy tournament-api` for the Tournament API;
   mint keys by inserting sha256(key) hashes into `public.api_keys`.

### Local backend testing (CI runs this on every push)

```bash
supabase db reset                       # local stack from supabase/config.toml
node scripts/db-integration.mjs         # proves RLS, ranked acceptance/rejection,
                                        # daily binding, idempotency, deletion…
```

`.github/workflows/db-integration.yml` executes these scenarios against a real
local database in CI — no production credentials involved.

## Cross-device sync (how it works)

Every scored attempt (typing, dictation, transcription, career, custom) is
queued locally the moment it is saved and flushed through the authoritative RPC
when signed in. Offline items retry automatically. Full result objects travel
in `attempts.metrics`, so signing in on a NEW device hydrates identical local
history (deduped threefold: result id == `client_id`, DB unique index, merge
check). Streak/skill profile then rebuild from merged history.

## Ranked validation model

Client sends evidence (counts, flags, challenge refs). Server derives wpm =
typed/5/min and accuracy = correct/typed, compares to claims (>10% drift →
flagged), enforces plausibility (<220 WPM), binds Daily submissions to today's
canonical Asia/Jakarta challenge, allows one ranked daily per day, and is
idempotent per attempt id. `submit_attempt()` is the ONLY authenticated write
path into attempts — direct INSERT/UPDATE are revoked — and ranked eligibility
additionally requires a canonical official exercise configuration (unknown
families stay private practice). Team membership exists only through the
`create_team`/`join_team` RPCs; classroom completions bind to real attempts
with server-derived scores; assessment candidates resolve the exact saved
module sequence from their invite (with not-open/revoked/expired states);
multiplayer races are started/rematched only by the host token holder with
results recomputed from evidence; friend results flow through a validating
rate-limited RPC. The full threat model and persistence matrix live in
`docs/ADR-004-trust-model.md`; launch-blocking external actions in
`docs/PRODUCTION_HANDOFF.md`.
This is a materially stronger boundary than trusting the browser — while still
being heuristic anti-cheat, not formal proctoring.

## Analytics

Consent-gated PostHog/GA4 adapter (`src/lib/analytics.ts`) covering the full
event dictionary: acquisition, per-mode start/complete, audio adoption,
cross-mode conversion, Daily participation, leaderboard views, friend/multiplayer/
team/career/assessment usage, integrity signals, shares. With PostHog
configured, D1/D7/D30 retention and funnels are measurable out of the box.

## Ads

Reserved slots on discovery/result pages only (never inside active tasks, no
autoplay audio). Real AdSense markup activates via
`NEXT_PUBLIC_ADSENSE_CLIENT`; approval of the publisher account is an external
state — integration is complete either way.

## Testing

- **130 unit/component tests** (Vitest): scoring, alignment, corrections,
  integrity/burst, Jakarta-day math, daily determinism, endless stream,
  playback reducer, streaks, skill matrix, corpus+audio-manifest consistency,
  sync evidence/merge, career bands, season math, sanitization, engine timer
  semantics, paste blocking, versioning.
- **23 Playwright E2E specs × desktop + mobile**: full-clock sprints, 5-min HUD,
  untouched-text accuracy, static audio resolution (EN/ID .wav), transcription
  flow, honest degradation of shared features offline, library filtering,
  career track list, keyboard reachability, robots/sitemap hygiene.
- **DB integration suite** (CI): RLS denial, ranked accept/forgery-reject,
  daily date binding, idempotent resubmission, custom-test visibility, team
  join, complete account deletion — plus team-membership authorization
  regressions, real-attempt assignment binding, invite definition resolution,
  and multiplayer host authority / evidence-derived race results.

## Documentation index

- `docs/ADR-001-deployment.md` — deployment architecture decision
- `docs/ADR-002-product-day.md` — Asia/Jakarta product-day boundary
- `docs/ADR-003-scoring.md` — scoring v2 semantics + integrity model
- `docs/ADR-004-trust-model.md` — explicit ranked-integrity trust boundary
- `docs/LICENSES.md` — content/audio rights record (closed: Piper MIT)
- `docs/api/openapi.yaml` — Tournament API v1 specification
- `docs/PRODUCTION_HANDOFF.md` — external launch actions (the only remaining work)
- `BLUEPRINT_COMPLETION_REPORT.md` — final status matrix with evidence

## Contributing

PRs welcome. Keep runtime deterministic: reviewed corpora, static licensed
assets, no runtime AI. Run `npm run lint && npm run typecheck && npm test`
before submitting.

## License

Code: ISC. Content/audio: original works; audio generated with MIT-licensed
Piper voices — redistribution permitted including commercial use
(`docs/LICENSES.md`).
