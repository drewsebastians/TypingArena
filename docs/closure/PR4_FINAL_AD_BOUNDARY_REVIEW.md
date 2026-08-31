# PR #4 Final Independent Ad Boundary Review

## Scope and verdict

The repository ad contract is **IMPLEMENTED — AUTOMATED PROOF COMPLETE for the
available static/browser scope**. Real AdSense approval, publisher configuration,
policy review, and a post-activation hosted test remain external. No publisher
ID or live ad result is fabricated here.

## Placement matrix

| Surface | Intended state | Repository boundary |
| --- | --- | --- |
| Home discovery | Outside an active exercise | `home-discovery` slot; document activity marker suppresses it during a task |
| Typing result | After completion | Typing route slots disappear as soon as typing starts |
| Dictation/transcription result | After completion | Route slot is outside the engine and is suppressed during playback/task state |
| Noise challenge result | After completion | `noise-challenge` slot is outside DictationEngine and is suppressed during playback |
| Daily result/board | Outside active typing | `daily-arena` slot is route-level and document activity suppresses it while typing |
| Leaderboard/seasons/discovery | Outside a task | Stable reserved slots only; no engine owns the slot |
| Teams/custom/assessments/multiplayer | Outside the active runner/race | Feature shell slot is outside the panel; engine activity marker is the second boundary |

## Forbidden placements checked

No ad markup is intentionally placed inside the typing, dictation,
transcription, noise, Daily, multiplayer, team-assignment, or assessment
engine content. `SafeAdSlot` returns no markup when `activeTask`, context state,
or `html[data-exercise-active]` is present. Reserved empty slots are not a
publisher activation and display an explanatory “outside active tasks” label
when the publisher client is absent.

## Privacy and activation boundary

`ADS_ENABLED` is false when `NEXT_PUBLIC_ADSENSE_CLIENT` is missing. Analytics
consent is independent from ad activation. There is no fake `ads.txt`, no
invented publisher ID, and no automatic application or external mutation.

The independent Playwright suite covers route-level suppression for typing,
dictation, transcription, noise, and Daily activation. Source review covers
the same document-level boundary for multiplayer, teams, custom tests, and
assessments, whose active runners use the same engines. The owner must repeat
the check after real publisher configuration and on a hosted origin.
