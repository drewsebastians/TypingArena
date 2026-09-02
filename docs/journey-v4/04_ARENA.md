# Journey v4 — Arena

Status: COMPLETE—PROVEN

## Contract applied

Daily Arena, Leaderboard, Seasons, Multiplayer, and Friend Challenges share the Arena navigation. Existing deterministic challenge and server-authoritative submission behavior is preserved.

Degraded states are written for participants, not operators. When the shared backend is unavailable, the product says shared ranking/storage is unavailable, preserves local practice, and never inserts fabricated competitors or ranks. README paths, migration commands, and operator instructions are not shown in user-facing Arena copy.

## Implementation

- `src/components/ArenaNav.tsx` and `src/components/FeaturePageShell.tsx` apply the family bar.
- `src/app/daily-arena/page.tsx` and `src/app/leaderboard/page.tsx` now use participant-facing unavailable states.
- `src/app/seasons/page.tsx` receives the same navigation; Multiplayer and Friends inherit it through the feature shell.
- `arena_tab_opened` records only a coarse destination path after the analytics privacy filter.

## Proof

- E2E verifies Daily Arena’s challenge, honest board state, Leaderboard’s no-fake-row state, and Friend Challenges’ backend requirement.
- `artifacts/journey-v4/after/daily-desktop-1440x900.png` shows the shared Arena bar and no fabricated board rows.
- The static-output production-readiness scan passes without placeholder domains or legacy auth UI.

