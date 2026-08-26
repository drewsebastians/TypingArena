# Final Engineering Freeze Evidence

**Status:** CORE ENGINEERING FREEZE APPROVED
**Landed:** 2026-08-26 via PR #1 (merge commit `0349d5b58583a8209c38de0a48325e788cbadde8`)

## Repository

| Ref | SHA |
|---|---|
| Public `main` BEFORE closure | `7bc06d4cdbd3158092b523475ff0972cda56bf95` |
| Passes I–III local commit | `5614f2ec75e8e6cb780107dd3e097f0e64d0ef87` |
| Pass IV tip | `1f795daa051bb81cac095add9931c21249a6e567` |
| Pass V defect-fix commits | `598b2de`, `42fad60`, `ce30c6b`, `b26c8d5`, `1311e5a`, `9432191`, `79e29dd`, `c8263bd`, `dcb1ed8`, `dc45734` |
| **Public `main` AFTER merge** | `0349d5b58583a8209c38de0a48325e788cbadde8` |

## CI evidence (all runs against the merged closure code)

| Workflow | Run ID | SHA / branch | Conclusion |
|---|---|---|---|
| CI (lint, typecheck, 162 unit/component tests, static build, bundle runtime-AI guard, desktop Playwright) | 32930885930 (pre-merge) / **32931318360** (post-merge main) | `dc45734` / `0349d5b` | SUCCESS |
| Backend integration — local Supabase (`supabase start` → `db reset` → migrations 0001–0014 → `scripts/db-integration.mjs`) | 32930885944 (pre-merge) / **32931318366** (post-merge main) | `dc45734` / `0349d5b` | SUCCESS — **103 passed, 0 failed** |
| Deploy (demo build from main) | **32931318415** | `0349d5b` | SUCCESS |

Local (dev machine): lint PASS · typecheck PASS · 162/162 vitest PASS · build PASS · readiness gate PASS · Playwright desktop 23/23 · Playwright mobile 23/23.

## Real defects found and fixed BY the CI gate during Pass V

1. `start_room` parameter rename blocked migration apply (`CREATE OR REPLACE FUNCTION` cannot rename parameters) → drop-before-create in 0004.
2. Stale provenance string mentioning "edge-tts" inlined into production bundles tripped the runtime-TTS guard → text corrected to Piper reality (guard unchanged).
3. **RLS self-recursion** on `team_members` ("members see membership" queried its own table) aborted ANY authenticated roster read → `is_team_member()` SECURITY DEFINER helper; dependent policies rewritten to terminate (0007).
4. `rate_limits` had no RLS — browser roles could reset their own abuse counters → table locked entirely (0007).
5. Newer Supabase images attach no implicit DML default privileges → full explicit least-privilege grant surface declared (0008, 0009, 0010, 0011).
6. `migrate_local_history` ON CONFLICT could not infer the partial unique index → predicate added to conflict target (0013).
7. pgcrypto lives in schema `extensions`; room RPCs pinned `search_path = public`, so host-token crypto failed at first execution → search_path corrected (0012).
8. **Privilege escalation**: roster-visibility helper let member-role rows satisfy admin checks on assignments → dedicated `team_role()` helper now guards INSERT/UPDATE/DELETE policies (0014).

## Security invariants proven by the DB suite (103 assertions)

- authenticated FORGED RANKED direct insert DENIED; practice direct insert DENIED; UPDATE-to-ranked denied with row unchanged
- `submit_attempt` persists through RPC after lock-down; owner history reads preserved; imports forced practice/unranked
- team UUID membership bypass DENIED; self-admin/self-owner DENIED; join-code flow works, idempotent, rate-limited; owner kick works; roster reads recursion-free
- arbitrary score=100 completion impossible; real attempt binding succeeds (sprint + career track); wrong-mode/wrong-track/foreign attempts REJECTED
- assessment invites resolve EXACT saved modules (order+identity enforced); invalid/expired/not-open/revoked states enforced server-side; results invisible to non-owner AND anonymous
- multiplayer: non-host start/cancel DENIED; forged implausible results rejected; window-closed finishes rejected; duplicates collapse; host rematch resets cleanly
- official ranked registry: unknown exercise families demoted (`unofficial_exercise`) and invisible publicly; career/custom never rank
- rate_limits unreachable by browser roles
- account deletion cascades owned teams + auth user

## Browser E2E

Desktop Chromium 23/23 and mobile Pixel 7 23/23 (local, against production export): timed-engine semantics, static-audio flows, honest degradation without backend, robots/sitemap hygiene, keyboard accessibility.

## No runtime AI

Production bundles contain zero `speechSynthesis` / AI-TTS-endpoint fingerprints (CI-enforced); audio remains static offline-generated Piper WAV with MIT licensing.

## External activation remaining (human only)

Production Supabase project + URL/anon-key secrets · canonical `NEXT_PUBLIC_SITE_URL` variable · Supabase auth redirect URLs · optional AdSense/PostHog/GA4 credentials · DNS/custom domain · Search Console verification · pg_cron scheduling of `purge_expired()` · tournament edge-function deploy when activating the API. Full checklist: `docs/PRODUCTION_HANDOFF.md`.
