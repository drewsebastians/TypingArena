# Strategic Validation Measurement Plan

Status: POST-LAUNCH VALIDATION

This plan turns the Ultimate Blueprint's strategic hypotheses into observable
questions. It deliberately records the instrument and the decision rule, not
invented baseline numbers. Analytics remains consent-gated; ordinary practice
must work when analytics is disabled or unavailable.

## Questions and events

| Hypothesis | Primary event(s) | Supporting properties | Decision use |
| --- | --- | --- | --- |
| Goal-first entry reduces time to a meaningful exercise | `landing_view`, `goal_first_view`, `goal_selected`, `goal_workspace_ready`, `goal_direct_start` | goal, workspace, route, locale | Compare goal selection and first-task completion by entry route and locale. |
| The product differentiates through listening, not only visual typing | `task_started`, `task_completed`, `dictation_complete`, `transcription_complete`, `result_next_action_clicked` | task, language, integrity, destination | Measure cross-mode progression and whether typing results lead to audio practice. |
| Results create a repeat loop | `typing_test_complete`, `dictation_complete`, `transcription_complete`, `next_recommended_start`, `library_clip_started` | mode, score band, clip metadata, destination | Evaluate result-to-next-exercise starts and repeat sessions without requiring an account. |
| Audio feedback helps deliberate listening | `audio_play`, `audio_replay`, `audio_pause`, `audio_seek`, `transcription_replay` | language, exercise id, replay metadata | Compare completion and accuracy by replay behavior; never collect answer text. |
| Shared competition earns trust only when evidence is accepted | `daily_arena_complete`, `leaderboard_view`, `ranked_submission_rejected`, `session_unranked`, `multiplayer_result_rejected` | integrity, mode, reason, backend state | Monitor rejection rates and honest degradation; never substitute client-claimed WPM. |
| Creator workflows are useful without exposing contact data | `friend_challenge_created`, `team_created`, `assignment_created`, `custom_test_created`, `assessment_created`, `manage_link_*` | resource type, module count, outcome | Diagnose creator activation and recovery without collecting email, answer, or capability secrets. |

## Data contract

- Events are sent through `src/lib/analytics.ts` only after explicit analytics
  consent. A capped local queue supports debugging and export.
- Event properties are allowlisted product metadata. Typed passages, audio
  answers, transcript text, auth UUIDs, capability tokens, and contact details
  are not analytics payloads.
- `exerciseId` is useful for deterministic debugging but must be treated as a
  pseudonymous content key, not a user identifier. Do not add raw user identity
  to events.
- `integrity` and rejection reasons are product-quality signals, not labels of
  a person. Report aggregate rates only.

## Baseline and review cadence

1. Before enabling a provider, capture a seven-day provider-off QA baseline from
   local queues and CI: route availability, task starts, completions, result
   next-action clicks, and ad-boundary assertions.
2. After launch, review weekly for the first four weeks, then monthly. Segment
   by locale, route family, device class, and consent state where available.
3. Keep raw retention and provider settings aligned with the published privacy
   notice. If a provider cannot honor the no-answer/no-contact-data contract,
   do not enable it.

## Guardrails and success criteria

The first release is not blocked on fabricated conversion targets. A strategic
decision is valid only after enough consented traffic exists for a stable trend
and the same definition has been used for the whole comparison window.

Release guardrails:

- zero runtime AI/TTS dependency in the production bundle;
- no visible account or contact-data requirement for local practice;
- no ad impression inside an active typing, dictation, or transcription task;
- no accepted ranked result without server-visible evidence;
- no raw typed/audio answer text in analytics;
- every reported metric includes its date range, route scope, consent scope,
  and sample size.

Owner action after deployment: configure the approved PostHog or GA4 provider,
confirm consent behavior in the hosted origin, and record the first real
baseline in the launch log. Until then, strategic status remains
POST-LAUNCH VALIDATION.
