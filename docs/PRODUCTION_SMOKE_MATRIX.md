# Production Smoke Matrix

Every public route with its launch-relevant classification. Verified against the
repository (`src/app`), robots policy, and AdSlot placement audit.

Legend:
- **Functionality**: `local` = fully usable anonymously/offline · `enhanced` = works locally, richer with backend · `backend` = requires configured Supabase (degrades honestly otherwise)
- **Indexing**: per `robots.txt` + per-page metadata (`/progress` is Disallowed/noindex; everything else indexable)
- **Ads**: page carries a reserved AdSlot (rendered only when AdSense is configured); active exercise areas never do

| Route | Functionality | Indexing | Ads | Notes |
|---|---|---|---|---|
| `/` | enhanced (instant test local; results sync when signed in) | index | yes — below result card (`home-results`) | Primary SEO landing |
| `/typing-test` | local | index | yes — beside duration picker | 15/30/60/300s |
| `/typing-test/1-minute` | local | index | yes (`typing-1min`) | |
| `/typing-test/5-minute` | local | index | yes (`typing-5min`) | |
| `/tes-mengetik` | local | index | yes (`tes-mengetik`) | Indonesian landing |
| `/data-entry-test` | local | index | yes (`data-entry`) | numbers mode |
| `/punctuation-typing-test` | local | index | yes (`punctuation`) | copy-pro precision |
| `/noise-challenge` | local | index | no | noise-tiered dictation; ad would sit between audio controls and answer field |
| `/dictation/english` | local | index | yes — below workspace (`dictation-en`) | static WAV assets |
| `/dictation/indonesian` | local | index | yes (`dictation-id`) | |
| `/transcription-practice` | local | index | yes — after submit area (`transcription`) | |
| `/transcription-library` | local | index | no | pure catalog browse |
| `/career` | enhanced (scoring local; history syncs cross-device) | index | yes — track list + result screen only (`career`, `career-result`) | never during modules |
| `/daily-arena` | enhanced (attempt local; shared board needs backend) | index | yes — board section (`daily-arena`) | server-bound ranked config |
| `/leaderboard` | backend | index | no | honest setup notice without backend; ranked rows only |
| `/seasons` | backend (derived views) | index | yes (`seasons`) | |
| `/friends` | backend (share links resolve centrally) | index | no | challenge creation degrades honestly offline |
| `/multiplayer` | backend (Realtime rooms) | index | **none — ever** | host-authority rooms; live progress broadcast |
| `/teams` | backend (assignments/completions RPC) | index | none | assignment runner is ad-free end-to-end |
| `/custom` | enhanced (practice-only by design; share needs backend) | index | none | never official-ranked |
| `/assessments` | backend (invite resolution/submission RPCs) | index | none | candidate flow is ad-free; results owner-only |
| `/progress` | enhanced | **NOINDEX / Disallowed** | yes (`progress`, footer) | private history + account panel |
| `/privacy` | static | index | no | data practices |

## Automated coverage

`node scripts/production-smoke.mjs <origin>` asserts: every route returns 200
HTML · robots/sitemap contract · sitemap URLs canonical · no placeholder
domains · homepage title/canonical/lang · a critical JS chunk loads · a static
dictation WAV loads.

Backend-dependent behavior (auth hydration, team round-trip, assessment
invite, multiplayer room) additionally requires the human steps in
`docs/PRODUCTION_LAUNCH_RUNBOOK.md` §H once production Supabase is connected.
