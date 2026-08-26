-- Migration 0007 — closure pass V: real-CI defects found by the local-Supabase gate.
--
--   1. TEAM_MEMBERS RLS SELF-RECURSION (app-breaking, caught by CI)
--      The 0002 "members see membership" SELECT policy queried team_members
--      from within team_members' own policy, so ANY authenticated row scan
--      (e.g. fetchMyTeams) aborted with 'infinite recursion detected'.
--      Visibility now routes through a SECURITY DEFINER helper, terminating
--      the cycle while preserving exact semantics.
--
--   2. RATE_LIMITS HAD NO RLS (privilege-audit gap)
--      Browser roles could read/update/delete their own abuse-counter rows,
--      trivially resetting join/submission/room limits. Table is now locked
--      to clients entirely; SECURITY DEFINER bump_rate_limit is unaffected.

create or replace function public.is_team_member(p_team uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team and m.user_id = p_user
  );
$$;
grant execute on function public.is_team_member(uuid, uuid) to anon, authenticated;

drop policy if exists "members see membership" on public.team_members;
create policy "members see membership" on public.team_members for select
  using (public.is_team_member(team_id, auth.uid()));

alter table public.rate_limits enable row level security;
revoke select, insert, update, delete on public.rate_limits from anon, authenticated;

-- Teams/assignments/completions policies reference team_members through the
-- same visibility rule; point them at the helper as well so every path
-- terminates in the definer context instead of re-entering RLS.
drop policy if exists "teams readable by members" on public.teams;
create policy "teams readable by members" on public.teams for select
  using (public.is_team_member(id, auth.uid()));

drop policy if exists "assignments visible to members" on public.assignments;
create policy "assignments visible to members" on public.assignments for select
  using (public.is_team_member(team_id, auth.uid()));

drop policy if exists "completions visible to members" on public.assignment_completions;
create policy "completions visible to members" on public.assignment_completions for select
  using (public.is_team_member(
    (select a.team_id from public.assignments a where a.id = assignment_id),
    auth.uid()));
