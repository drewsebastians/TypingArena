# Final UX and Accessibility Review

## Product experience

The public journey now follows the intended loop: choose a goal, start a real
exercise, receive an explainable result, and continue through an explicit next
action. Typing, dictation, transcription, Career, Library, Daily, competition,
team, custom, and assessment surfaces use shared route shells or the existing
state-specific runner. Local practice remains usable without an account or
backend.

Implemented UX guarantees:

- the home page exposes exactly six canonical goals;
- typing presets include 15s, 30s, 60s, and a true 300s full-clock mode;
- dictation/transcription use static audio, keep the reference hidden until
  completion, and show playback/replay feedback;
- Career exposes five practice tracks with transparent score bands and no
  certification claim;
- Library filters by language, difficulty, and length and starts a selected clip
  directly;
- backend-dependent screens explain the missing dependency instead of showing
  fabricated rows or dead login prompts;
- result screens provide visible routes into another relevant mode;
- ads are absent from active task state and reserved outside the exercise;
- Indonesian route/copy surfaces remain available alongside English.

## Accessibility and responsive evidence

| Check | Result |
| --- | --- |
| Desktop Chromium smoke | PASS |
| Pixel 7 mobile Chromium smoke | PASS |
| 320px viewport horizontal overflow | PASS |
| 44px mobile menu and focus restoration | PASS on mobile project; desktop case intentionally skipped |
| Keyboard-reachable result actions | PASS on desktop and mobile |
| No legacy account controls on practice/progress | PASS |
| Public route heading contract | PASS for all 25 public routes in the browser matrix |
| Typing active-state ad suppression | PASS |
| Dictation active-state ad suppression | PASS |

The final local Playwright run recorded **59 passed and 1 intentional skip**.
The static route build recorded 30 generated routes. Interactive controls added
or touched in this closure use explicit button types, pressed/selected state,
labels, and minimum touch sizing where the control is part of the shared
practice/feature surface.

## Remaining validation

A human screen-reader pass, keyboard pass on a hosted origin, real-device
Safari/Chrome checks, reduced-motion review, color-contrast tooling, and
Core Web Vitals from real traffic remain POST-LAUNCH VALIDATION or
EXTERNAL ACTION REQUIRED. They are not represented as completed by the CI
browser smoke.
