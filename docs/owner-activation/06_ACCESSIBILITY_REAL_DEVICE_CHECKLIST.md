# Accessibility and Real-Device Checklist

Automated Chromium proof is recorded in
`docs/closure/PR4_FINAL_ACCESSIBILITY_AUTOMATED_REVIEW.md`. This checklist is
the remaining human/device work.

## Prerequisites

- Test date, build SHA, hosted origin, browser/device versions, and a defect
  capture path.
- Keyboard, screen-reader, contrast, and real mobile test hardware or approved
  remote devices.

## Matrix

| Area | Minimum coverage |
| --- | --- |
| Screen reader | Home goals, typing controls/result, dictation controls, mobile menu, Progress, Privacy, and one shared creator route |
| Keyboard | Desktop navigation/dropdowns, goal cards, filters/disclosures, workspace controls, result CTAs, modal/drawer, table interactions |
| Mobile | ~320px and ~390px portrait, landscape spot check, menu hit target, focus entry/wrap/restore, backdrop, scroll lock, virtual keyboard |
| Safari | Static routing, audio playback, local storage, locale switch, anonymous shared session, focus behavior |
| Visual | Text/control contrast in light/dark themes, focus visibility, error/empty/loading states |
| Performance | LCP, INP, CLS, route navigation, audio start, and post-approval ad activation |

## Expected evidence

Record device/browser, route/state, expected behavior, result, screenshot or
screen-reader note, and issue ID. Mark staging vs production. A “not tested”
entry is not a pass.

## Failure and rollback

Triage blocking keyboard, focus, audio, routing, or readable-contrast defects
before production activation. If a hosted release introduced the regression,
use the approved artifact rollback; do not dismiss it as CI variance.

## Mutation and approval

Testing is normally non-mutating, except any shared-flow test data. Creating
shared test data requires owner approval and disposable identities.
