# ADR-004 — Ranked Integrity & Trust Model

**Status:** accepted (2026-08, final closure pass II)
**Supersedes:** informal notes in migration headers; complements ADR-001/002/003.
**Companion:** `docs/PRODUCTION_HANDOFF.md` (external actions), persistence matrix below.

## What "server-authoritative" means in TypingArena

`submit_attempt()` is the ONLY authenticated write path into
`public.attempts`. Direct client INSERT/UPDATE are revoked at the GRANT level
and the owner-insert RLS policy is dropped (migration 0005); bulk local-
history import runs through `migrate_local_history()`, which recomputes
metrics server-side and can NEVER produce ranked rows.

Every public ranked surface (leaderboard, Daily Arena board, seasons) is
derived exclusively from rows satisfying BOTH:

1. `integrity = 'ranked'`, AND
2. `ranked_accepted = true` — a flag only SECURITY DEFINER code sets.

The RPC recomputes scored metrics from submitted EVIDENCE and ignores claimed
finals:

| Server recomputes | From |
|---|---|
| gross WPM | `typed_chars / 5 / (elapsed_ms / 60000)` |
| accuracy | `correct_chars / typed_chars` |
| integrity verdict | plausibility windows + paste/burst/focus flags + claim-drift check |
| ranked eligibility | verdict + effort floors (≥20 chars, ≥8s) + OFFICIAL EXERCISE BINDING |

Claim drift >10% relative WPM or >10pt accuracy adds `*_mismatch` reasons,
flagging the attempt out of ranked.

## Official ranked exercise binding

Ranked eligibility additionally requires a canonical server-known exercise
configuration (`is_official_ranked_config`, migration 0005):

| Mode | Official exercise id families | Duration allowlist |
|---|---|---|
| sprint / copy-pro / numbers | `{mode}-{lang}-{dur}-{seed}` (live product) or `{lang}-{family}-NNN` (corpus registry) | 15/30/60/120/300 |
| daily | `daily-YYYY-MM-DD` (+ server date/version binding, one ranked/day) | 15–300 |
| dictation | `dict-{lang}-NNN` | 30–120 |
| transcription | `trans-{lang}-NNN` | 30–600 |

Everything else — `friend-*`, `mp-*`, `assignment:*`, `career-*`, `custom-*`,
`assess-*` — persists privately as practice/flagged with an explicit
`unofficial_exercise` reason and can never enter official boards. Career and
custom-practice modes are unrankable by policy regardless of id. Versions are
whitelisted (`v2`, `v3`).

## Multiplayer trust model

Rooms carry a sha256 host-token hash; start/rematch verify it, so only the
creator controls the race. `finish_room` accepts evidence counts only,
re-derives WPM/accuracy inside the running race window (+20s grace), rejects
implausible derived speeds (>220 wpm), enforces count invariants, and dedupes
per player-key. Live progress broadcasts (~3/sec) carry counters/percentages
only — display-only, never scoring input. Room state machine:
`lobby → running → (results readable; room expires after 1 day)`; host-only
`running|finished → lobby` rematch resets seed + results; invalid transitions
(finish before start, start twice, finish after window) are rejected by the
RPCs with distinct error codes.

## Threat classes mitigated

- Claimed-score forgery via PostgREST console (server recomputes everything;
  direct table writes revoked).
- Direct `ranked_accepted=true` insertion / UPDATE-to-ranked (grants revoked,
  no insert/update policy, RPC-only flag).
- Fabricated ranked attempts for unknown/offline exercises (official binding).
- Replay/idempotency abuse (unique `(user_id, client_id)`; duplicate signal).
- Daily board pollution (server-resolved date/version; single ranked daily).
- Team membership bypass: no direct INSERT/UPDATE privileges on
  `team_members`; membership exists only via `create_team`/`join_team`
  SECURITY DEFINER RPCs (join code + rate limits). Self-promotion and
  ownership seizure have no write path.
- Fake classroom completions: `complete_assignment` binds to a real persisted
  attempt owned by the caller matching the assignment definition above an
  effort floor; score computed server-side as
  `round(0.6·accuracy + 0.4·min(wpm,100), 1)`; direct completion inserts are
  impossible.
- Assessment result injection: invite lifecycle enforced
  (invalid/not-open/revoked/expired); payload bounded to the defined module
  count with plausible metrics.
- Room hijacking (host-token authority); friend-result spam (rate-limited RPC,
  challenge existence/expiry, name sanitization, value bounds).

## Threat classes NOT mitigated

- A custom client submitting internally-consistent fabricated evidence within
  plausibility bounds for a VALID official exercise id (typing bots under
  ~220 WPM).
- Collusion between room participants on final evidence.
- Any form of identity assurance (email magic link only).

## Shared artifacts after account deletion (explicit policy)

`delete_my_account` removes attempts, profile, assessments (+results),
api_keys/tournaments (via cascade), team memberships and assignment
completions (user FK cascades), custom tests (owner cascade) and the auth
user itself. Deliberately retained in ANONYMIZED form so shared spaces do not
corrupt: friend challenges keep their payload but `creator_name` becomes
"former user" (`creator_id` set null); friend-challenge result rows keep
display names but lose account linkage (`user_id` set null); multiplayer room
results keep session-scoped `player_key`s with no account linkage; classroom
completions disappear with their user row. No private data is orphaned.

## Why this is the right standard

TypingArena is a practice/competition/training platform. Scores drive casual
and competitive motivation — they are **not** legally validated certification,
proctored examinations, or hiring instruments. Employer assessments, career
benchmarks and classroom assignments are explicitly labeled
"practice/operational" in-product. The strongest realistic standard — full
server recomputation, structural authorization, canonical exercise binding,
rate limits, plausibility envelopes, honest labeling — is implemented here
and documented as the product boundary.

---

## Persistence matrix (claims ↔ reality)

| Mode / artifact | Storage path | Cross-device | Classification |
|---|---|---|---|
| Typing attempts | local + `attempts` via submit_attempt | hydrated from metrics | attempts-backed, hydrated |
| Dictation attempts | local + attempts (audioEvidence) | hydrated | attempts-backed, hydrated |
| Transcription attempts | local + attempts | hydrated | attempts-backed, hydrated |
| Daily Arena | attempts (canonical daily id/date/version) | hydrated | attempts-backed, ranked-bound |
| Career results | `ta:career_history` + attempts.metrics(kind=career) | hydrated on sign-in | attempts-backed, hydrated, never ranked |
| Custom tests | `custom_tests` table + custom-practice attempts | remote-fetched definitions; attempts hydrate | attempts-backed; never ranked |
| Classroom assignments/completions | teams/assignments/assignment_completions | remote-fetched (server-only by design) | server-only |
| Employer assessments/results | assessments/assessment_results | remote-fetched; candidate results private to owner | server-only |
| Friend challenges/results | friend_challenges(+results) via RPCs | share-link fetched | server-only, casual tier |
| Multiplayer rooms/results | rooms/room_results + Realtime broadcast | code join; results durable 1 day | server-only; live progress ephemeral |
| Seasons | pure month math over public ranked rows | n/a (derived) | derived view |

No user-facing claim says a mode syncs unless it appears in this matrix with
cross-device support.
