# Journey v4 — Global IA

Status: COMPLETE—PROVEN

## Contract applied

The primary navigation is now the four-part product model from the supplied v4 sources:

`Practice` · `Arena` · `Progress` · `For Teams`

The brand returns to Home. Locale and streak remain in the utility area. The mobile drawer keeps the same family grouping, locks body scroll, traps focus, closes on Escape/backdrop, and restores focus to the menu trigger.

## Implementation

- `src/components/Header.tsx` maps existing route-registry destinations into the three grouped menus and the direct Progress link.
- `src/components/SectionNav.tsx` provides the shared route-family navigation with active `aria-current` state and 44px minimum targets.
- `src/components/ArenaNav.tsx` provides Today, Leaderboard, Season, Multiplayer, and Friend Challenges.
- `src/components/TeamsNav.tsx` provides Teams, Custom Tests, and Assessments.
- `src/components/PracticeFamilyNav.tsx` connects Typing, Listening, Transcription, and Work Skills.
- `src/components/FeaturePageShell.tsx` automatically places the Arena or For Teams bar on its registered family routes.

No public route was removed. The route registry remains the authority for the existing 25 public destinations.

## Proof

- `e2e/independent-review.spec.ts`: responsive route matrix, locale switch, desktop keyboard menu, and mobile focus trap.
- `e2e/smoke.spec.ts`: public route heading contract and mobile navigation behavior.
- `artifacts/journey-v4/after/home-desktop-1440x900.png`
- `artifacts/journey-v4/after/home-mobile-390x844.png`
- `artifacts/journey-v4/after/home-stress-320x568.png`

The Arena and For Teams bars are also visible in the post-change daily and teams captures.

