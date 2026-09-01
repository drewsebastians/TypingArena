# First-Week Strategic Validation

Status: READY FOR REAL CONSENTED TRAFFIC

This is the executable first-week measurement specification for the live
TypingArena release. It tests the existing thesis — **WPM acquires; audio
differentiates** — without changing product strategy or inventing targets.

## Current measurement state

- Production analytics provider: disabled/unconfigured at the time of the
  post-launch audit.
- Runtime behavior with consent off: ordinary practice works; no optional
  provider requests or analytics-queue writes are permitted.
- Runtime behavior with a configured provider: forwarding is allowed only after
  explicit analytics consent and goes through `src/lib/analytics.ts`.
- The local queue is a capped diagnostic/export aid available only after an
  explicit grant; it is not a production traffic count or a substitute for
  consented provider data.

## Event contract

| Funnel | Events | Required dimensions |
| --- | --- | --- |
| Acquisition and entry | `route_viewed`, `landing_view`, `goal_first_view`, `goal_selected`, `goal_workspace_ready` | route, goal/workspace where applicable, locale |
| Configuration and start | `task_configured`, `task_started`, mode-specific start events | task, mode, language, duration where applicable |
| Completion and result | `task_completed`, mode-specific complete events, `result_viewed` | task, language, integrity |
| Next action | `result_next_action_clicked`, `next_recommended_start`, `library_clip_started` | destination, source task |
| Audio differentiation | `audio_play`, `audio_replay`, `audio_pause`, `audio_seek`, dictation/transcription lifecycle events | language, coarse playback metadata |
| Retention and competition | `daily_arena_start`, `daily_arena_complete`, `streak_incremented`, leaderboard/friend/multiplayer lifecycle events | task outcome, integrity, shared-flow outcome |
| Career / teaching / assessment | `career_start`, `career_complete`, and existing aggregate lifecycle events | module count, score/band, outcome |

The adapter automatically supplies the current pathname. It must never send
auth UUIDs, email, typed content, transcript text, assessment answers,
capability or invite tokens, resource IDs, or full secret-bearing URLs.

## Metric definitions

Use one date range, route scope, consent scope, and sample-size note for every
reported metric.

- Task-start rate = distinct consented entry sessions with `task_started` /
  distinct consented entry sessions with an eligible `route_viewed`.
- Completion rate by mode = sessions with `task_completed` for the mode /
  sessions with `task_started` for the mode.
- Exercises per session = count of `task_started` events divided by eligible
  consented provider sessions.
- Second-exercise rate = sessions with at least two `task_started` events /
  sessions with at least one `task_started` event. Use provider session
  boundaries; do not create a new first-party identity system for this metric.
- Typing → dictation conversion = sessions with a typing completion followed
  by a dictation start within the reporting session / sessions with a typing
  completion.
- Typing → transcription and dictation → transcription use the same ordered
  session rule.
- Audio completion = audio-task sessions with `task_completed` / audio-task
  sessions with `task_started`.
- Repeat audio engagement = audio-task sessions with a second audio start or
  replay after the first audio task / audio-task sessions with one audio start.
- D1/D7 return = eligible first-session cohorts with a qualifying later
  `route_viewed` or `task_started` on day 1/day 7. Do not report D7 before the
  cohort has had seven complete days.
- Rejected ranked-attempt rate = rejected ranked submissions / ranked
  submissions attempted. Report shared-feature failures separately.
- Monetization readiness = eligible discovery/result page views with an
  ad-safe boundary; this is an inventory opportunity, not revenue.

## Review points and decision rules

- Before 24 meaningful hours: report technical health and instrumentation only;
  make no strategic judgment.
- At 1–3 days: report directional observations with denominators, consent
  scope, and sample-size caveats. Do not reposition or redesign from noise.
- At 7 complete days, only if traffic is sufficient: publish a readout that
  separates observed behavior, hypotheses, and a proposed decision. Compare
  route, locale, device class, and mode without identifying users.

No thresholds are introduced here. Use an explicit blueprint threshold if one
is later approved; otherwise require a stable trend and a documented product
decision before changing the acquisition or audio strategy.

## Operator checklist

1. Confirm the approved provider, property, retention, and consent/legal
   prerequisites before adding production keys.
2. With consent off, verify zero provider requests and normal local practice.
3. With a configured provider and consent on, verify the event names and the
   privacy contract using a disposable test session.
4. Record the first real baseline with date range, provider, route scope,
   consent scope, and denominators.
5. Revisit at 24 hours, day 3, and day 7; keep strategic changes deferred until
   the corresponding evidence rule is satisfied.
