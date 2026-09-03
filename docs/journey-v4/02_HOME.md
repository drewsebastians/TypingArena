# Journey v4 — Home Workspace

Status: COMPLETE—PROVEN

## Contract applied

Home opens on a real compact `TypingTestPanel` using the existing `TypingEngine`: English, 30 seconds, Sprint, and `autoFocus={false}`. The six-goal orchestration metadata remains in `src/lib/goals.ts`, but it is no longer a visible pre-task gate.

The Home sequence is:

1. concise promise and trust markers;
2. real typing workspace with the optional full-route link;
3. local-history recommendation when history exists;
4. Listening, Transcription, and Work Skills lanes;
5. Today’s Arena;
6. local Progress preview when history exists;
7. For Teams teaser;
8. trust disclosure and lower discovery ad.

Home does not load dynamic Dictation or Transcription workspaces, does not render GoalGrid/GoalSummaryBar, and does not expose a redundant typing card.

## Implementation

- `src/app/page.tsx` reads local history after mount, derives the existing deterministic recommendation through `buildSkillMatrix`/`nextExerciseRecommendation`, and refreshes the preview after a completed sprint.
- Home journey events are coarse and PII-safe: `home_workspace_viewed`, `home_workspace_started`, `home_open_full_typing`, `home_recommended_next_clicked`, and `home_skill_explored`.
- `src/lib/analytics.ts` retains the denylist boundary; no typed text, answer, identifier, URL key, or secret is sent by these events.

## Proof

- Home E2E asserts the real typing workspace, no GoalGrid, no Home audio, visible skill lanes, no forced focus, and the compact 320px contract.
- `npm run build` produced the static export without route loss.
- Screenshots: `artifacts/journey-v4/after/home-desktop-1440x900.png`, `home-mobile-390x844.png`, and `home-stress-320x568.png`.

