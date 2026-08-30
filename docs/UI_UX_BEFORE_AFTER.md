# UI/UX Before → After — Pass VII

**Baseline SHA:** `9109fe824ca8b241f3d22129f094f0ee15c51ccd` → **After SHA:** (see PR)
**Artifacts:** `artifacts/ui-ux/before/` (24 PNG, 12 routes × 2 viewports) and `artifacts/ui-ux/after/` (same set)

## Visual regression checklist

- [x] All 23 public routes still render 200 HTML and meaningful content
- [x] Desktop 1440 and mobile 390 screenshots reviewed side-by-side
- [x] Dark mode verified via `dark:` Tailwind classes (no white flash; header/footer continuity)
- [x] Consent banner still consent-gated, no obstruction of exercise
- [x] Ad slots remain reserved outside active tests; engines still ad-free
- [x] No route removed or hidden from crawlers

| Audit ID | Before | After | What changed | Why |
|---|---|---|---|---|
| UX-001 | `before/home-desktop-1440x900.png` header: 15 pills wrap/overflow, xl breakpoint hides all | `after/home-desktop-1440x900.png` header: 4 primaries (Practice / Compete / Teams / Progress) with dropdowns; same destinations grouped | Restructured `Header.tsx` into grouped navigation with progressive disclosure; kept every `href` | Evidence: cognitive load, competitor distinction not obvious (HIGH) |
| UX-002 | `before/home-mobile-390x844.png` second row horizontal scroll pills | `after/home-mobile-390x844.png` hamburger → drawer | Replaced scroll pills with accessible drawer (role dialog, focus, Escape, 44 px targets) | Mobile discovery & WCAG touch target (P0) |
| UX-003 | `before/home-desktop-1440x900.png` single 19-card grid pushes "How it works" below fold | `after/home-desktop-1440x900.png` sections: Practice (always visible) + collapsed Compete/Work behind "Explore all tools" | `page.tsx` grouped constants PRACTICE/COMPETE/WORK, section headings, progressive disclosure, track event | Discovery overwhelm (P1 HIGH) |
| UX-004 | `globals.css:18` Arial overrides Geist | `after` body uses `var(--font-geist-sans)`; `--font-mono` preserved for typing/metrics | Removed Arial fallback; defined coherent font system | Inconsistent typography, metric misalignment (P1 HIGH) |
| UX-005 | `<html lang="en">` static | After: `LocaleProvider` effects keep `document.documentElement.lang` in sync with persisted locale | Added `LocaleProvider` with storage/custom-event sync | a11y/semantic defect (P1) |
| UX-006 | Locale toggle left panels in previous language until navigation | After: provider re-renders tree on `locale-change` event | `setLocale` dispatches event, provider state drives children | Bilingual coherence (P1 MEDIUM) |
| UX-007 | `before/leaderboard-desktop-1440x900.png` “See README → Shared competition setup” | `after` same route shows user-facing copy: feature可用ness + offline practice reassurance | Updated `i18n.ts` `common.backendRequired` | Developer-facing copy eroded trust (P1) |
| UX-008 | `ResultCard` 4 equal stats + flat heatmap | After: primary WPM large, secondary accuracy/time, Details disclosure for corrections/heatmap | Restructured `ResultCard.tsx` hierarchy | Result overload (P1) |
| UX-009 | Header/footer at full prominence during active test | After: `html[data-exercise-active]` dims header to 0.45, hover restores | `TypingEngine` sets attribute when started | Focus competition (P1) |
| UX-012 | Hero + “How it works” dense block | After: detail moved into `<details>` disclosure under hero | `page.tsx` wrapped in `<details>` | Trust density (P2) |

### Key differences not cherry-picked

- Every “before” has a matching “after” at same route+viewport; no flattering crop.
- Light/dark both checked: dark page background now continuous via `--background` token + `dark:` classes.
