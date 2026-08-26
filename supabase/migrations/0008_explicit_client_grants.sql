-- Migration 0008 — closure pass V: explicit least-privilege table grants.
--
-- Current local-Supabase images no longer attach implicit DML default
-- privileges to tables created inside migrations, so any client-facing
-- surface MUST declare its grants explicitly (caught by CI: owner assignment
-- publish failed with 'permission denied for table assignments').
--
-- This migration states the ENTIRE intended client privilege surface.
-- Anything not listed here stays denied — including all authoritative
-- write paths already revoked in 0005 (attempts INSERT/UPDATE,
-- friend_challenge_results INSERT, rooms/room_results writes,
-- team_members INSERT/UPDATE, assignment_completions INSERT,
-- rate_limits anything).

-- Attempts: owners may read their own history and delete it; every write
-- flows through submit_attempt/migrate_local_history.
grant select, delete on public.attempts to authenticated;

-- Profiles: self-service identity management; usernames public via view.
grant select, insert, update on public.profiles to authenticated;

-- Friend challenges: anonymous creation + world read remain product features;
-- creators may remove their own challenges.
grant select, insert, delete on public.friend_challenges to anon, authenticated;
grant select on public.friend_challenge_results to anon, authenticated;

-- Teams & membership: reads and leave/kick deletes flow through RLS;
-- membership/team CREATION is RPC-only.
grant select on public.teams to authenticated;
grant select, delete on public.team_members to authenticated;

-- Classroom content: members read; admins manage via RLS-checked DML;
-- completions are inserted exclusively through complete_assignment().
grant select, insert, update, delete on public.assignments to authenticated;
grant select, delete on public.assignment_completions to authenticated;

-- Custom tests: owner CRUD via RLS + unlisted world-read.
grant select, insert, update, delete on public.custom_tests to anon, authenticated;

-- Employer assessments: owner-scoped CRUD via RLS; candidate submission and
-- definition resolution are RPC-only.
grant select, insert, delete on public.assessments to authenticated;

-- Multiplayer durable state: world-read only; all writes are RPC-mediated.
grant select on public.rooms to anon, authenticated;
grant select on public.room_results to anon, authenticated;

-- Public definer views.
grant select on public.public_profiles to anon, authenticated;
grant select on public.public_leaderboard to anon, authenticated;
grant select on public.public_daily_board to anon, authenticated;
