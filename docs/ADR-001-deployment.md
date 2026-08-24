# ADR-001 — Deployment & shared-competition architecture

**Status:** accepted (2026-08)
**Context:** blueprint §30 requires an explicit deployment decision. True
multi-user leaderboards, Daily Arena boards, friend challenges and optional
accounts need centralized storage.

## Decision

**Static-export frontend + Supabase (Postgres) direct client operations guarded
by Row Level Security** (blueprint §30 Option B).

- The Next.js app remains `output: "export"` — deployable to GitHub Pages
  (current demo), Vercel, Netlify, or any static host without code changes.
- Shared features talk directly to Supabase from the browser using the public
  anon key. All authorization is enforced **in the database**
  (`supabase/migrations/0001_init.sql`): RLS policies on private tables,
  definer views exposing only ranked rows publicly, CHECK constraints bounding
  fabricated values.
- When `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are absent,
  every remote call throws `RemoteUnavailableError`; pages render honest setup
  notices and local practice continues to work. No demo rows are ever shown as
  real users.

## Why not server API routes?

A server runtime would couple the product to one hosting platform for marginal
benefit: all validation that matters (who may read/write which rows) lives in
Postgres either way. Postgres functions (`my_best_rank`, `delete_my_data`,
`purge_expired_challenges`) provide the few operations a client should not
implement itself.

## Consequences

- Client anti-cheat remains heuristic (paste/burst/focus). The database rejects
  structurally impossible values and hides non-ranked rows; it cannot prove a
  human typed. This is the documented product stance — scores are for casual
  training/competition, not certification.
- Anonymous challenge creation is allowed with unguessable 10-char ids and
  30-day expiry (`purge_expired_challenges` should be scheduled via pg_cron).
- Full account deletion removes profile + attempts + results; the auth.users
  row itself requires Supabase Dashboard/support deletion (bootstrap tradeoff,
  documented in README).
