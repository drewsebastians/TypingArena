# PR #4 Final Automated Accessibility and Responsive Review

## Scope and verdict

Automated Chromium accessibility/responsive proof is **COMPLETE — PROVEN for
the tested scope**. This is not a claim of full WCAG conformance. Screen
readers, Safari, real Android/iOS devices, measured contrast, and real-user
Core Web Vitals remain external validation.

## Automated coverage

`e2e/independent-review.spec.ts` adds an independent matrix over representative
route families and covers:

- 1440×900, 1280×800, 768×1024, 390×844, 375×667, and 320×568;
- home, typing, dictation, transcription, noise, Career, Daily, friends,
  teams, custom, assessments, Progress, and Privacy routes;
- document and body horizontal-overflow assertions;
- query-state noindex behavior;
- EN/ID visible-copy switching and `<html lang>`;
- reduced-motion emulation and the shipped reduced-motion rule;
- active-task ad suppression across typing and audio modes;
- mobile drawer hit target, focus entry, Tab wrap, Shift+Tab wrap, Escape,
  backdrop close, body scroll lock, and focus restoration.

Existing `e2e/smoke.spec.ts` additionally covers public route headings, typing
result CTAs, audio asset resolution, disclosures, filters, empty/degraded
states, paste feedback, and no visible legacy account controls.

No axe dependency was present, and none was added merely for a badge. The
repository has no maintained automated contrast engine; contrast remains in
the manual checklist.

## Manual follow-up required

The owner must run the real-device matrix in
`docs/owner-activation/06_ACCESSIBILITY_REAL_DEVICE_CHECKLIST.md`, including
keyboard/screen-reader semantics, Safari audio/storage/routing, narrow and
landscape mobile layouts, contrast, and measured LCP/INP/CLS. Those results
must not be backfilled from Chromium CI.
