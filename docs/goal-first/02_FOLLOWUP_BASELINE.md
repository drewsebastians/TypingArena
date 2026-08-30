# Follow-up baseline — Integrated Blueprint Closure

Baseline captured 30 August 2026 before the closure feature batches.

## Git and ancestry

- Branch: `codex/goal-first-wave1`
- Follow-up starting SHA: `a92d87c53d555e7b84fdfd296025dcf8ff170f00`
- `origin/main`: `b99779bc208c5abd2aa2e67e618927a2db949c42`
- Merge base: `b99779bc208c5abd2aa2e67e618927a2db949c42`
- Divergence after reconciliation: `0` commits behind, `5` commits ahead (`git rev-list --left-right --count origin/main...HEAD`)
- Ancestry: latest `origin/main` is an ancestor of the continuation branch through merge commit `a92d87c`.
- Worktrees: only `D:/Others/Typing Arena`.
- Stashes: none.
- Existing PR: [#4](https://github.com/drewsebastians/TypingArena/pull/4), not merged.

## Repository inventory

- Migration chain: `0001_init.sql` through `0015_anonymous_identity_capabilities.sql`; historical `0001`–`0014` are unchanged.
- Page entry routes: 25 App Router page files; 30 static build routes including not-found, robots, and sitemap.
- Public route registry: 26 route definitions; `/progress` is explicitly noindex and omitted from the sitemap.
- Goal-First screenshots: 17 after and 10 before artifacts under `artifacts/goal-first/wave1/`.

## Reproducible install and local gates

- `npm ci`: PASS after adding the missing optional/peer lock metadata for the Tailwind `@emnapi` graph; 912 packages installed.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS — 19 files, 166 tests.
- `npm run build`: PASS — 30 static routes.
- Supabase CLI: unavailable on this workstation.
- Docker: unavailable on this workstation.
- Hosted/staging Supabase credentials: not present in the environment; no production migration was attempted.
- AdSense/production configuration: not present; ads remain inactive.

## Remote CI evidence at baseline checkpoint

- Main CI: PASS — run `33307829548`.
- Desktop E2E job: PASS — 27 passed, 1 intentional desktop skip, 28 tests.
- Backend integration: PASS — run `33307829237`, 117 passed, 0 failed.
- GitHub CLI is authenticated for this repository; PR checks can be used as the authoritative Linux/Docker fallback.

## Relevant artifacts

- [Wave 1 implementation notes](<D:/Others/Typing Arena/docs/goal-first/01_WAVE1_IMPLEMENTATION_NOTES.md>)
- [Canonical integrated blueprint](<D:/Others/Typing Arena/docs/blueprint/TypingArena_Integrated_Ultimate_Blueprint_v2.md>)
- [Canonical batching plan](<D:/Others/Typing Arena/docs/blueprint/TypingArena_Grand_Batching_Plan_v2.md>)
- [Goal-First after screenshots](<D:/Others/Typing Arena/artifacts/goal-first/wave1/after/>)
