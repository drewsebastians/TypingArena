-- Migration 0014 — closure pass V: close admin-policy escalation found by CI.
--
-- is_team_member() correctly models ROSTER VISIBILITY ("am I in this team?")
-- but the assignments INSERT/UPDATE/DELETE policies used inline membership
-- subqueries whose row-visibility now includes the whole roster — so a plain
-- MEMBER matched the owner row's role and could publish assignments.
--
-- Fix: a dedicated SECURITY DEFINER role lookup with exact row semantics,
-- used by all privileged assignment policies. Member/admin/owner separation
-- is enforced server-side again.

create or replace function public.team_role(p_team uuid, p_user uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select m.role from public.team_members m
     where m.team_id = p_team and m.user_id = p_user),
    'none');
$$;
grant execute on function public.team_role(uuid, uuid) to anon, authenticated;

drop policy if exists "admins manage assignments" on public.assignments;
create policy "admins manage assignments" on public.assignments for insert
  with check (public.team_role(team_id, auth.uid()) in ('owner','admin'));

drop policy if exists "admins update assignments" on public.assignments;
create policy "admins update assignments" on public.assignments for update
  using (public.team_role(team_id, auth.uid()) in ('owner','admin'))
  with check (public.team_role(team_id, auth.uid()) in ('owner','admin'));

drop policy if exists "admins delete assignments" on public.assignments;
create policy "admins delete assignments" on public.assignments for delete
  using (public.team_role(team_id, auth.uid()) in ('owner','admin'));
