-- Migration 0017 — capability retention and deletion hygiene.
--
-- resource_capabilities is intentionally generic because it covers Teams,
-- Custom tests, and Assessments. It therefore cannot use a foreign key to
-- every resource table. Remove capabilities immediately when a supported
-- resource is deleted, and let the existing scheduled purge remove stale
-- rows left by historical deletions or expired/revoked links.

create or replace function public.purge_resource_capabilities_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.resource_capabilities
  where resource_type = TG_ARGV[0]
    and resource_id = OLD.id::text;
  return OLD;
end; $$;

revoke all on function public.purge_resource_capabilities_on_delete() from public, anon, authenticated;

drop trigger if exists purge_team_capabilities_on_delete on public.teams;
create trigger purge_team_capabilities_on_delete
  after delete on public.teams
  for each row execute function public.purge_resource_capabilities_on_delete('team');

drop trigger if exists purge_custom_capabilities_on_delete on public.custom_tests;
create trigger purge_custom_capabilities_on_delete
  after delete on public.custom_tests
  for each row execute function public.purge_resource_capabilities_on_delete('custom');

drop trigger if exists purge_assessment_capabilities_on_delete on public.assessments;
create trigger purge_assessment_capabilities_on_delete
  after delete on public.assessments
  for each row execute function public.purge_resource_capabilities_on_delete('assessment');

-- Keep the existing maintenance entry point. Expired capabilities are no
-- longer usable, old revoked rows retain 30 days of audit value, and orphan
-- rows are removed only when the named resource truly no longer exists.
create or replace function public.purge_expired()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friend_challenges where expires_at < now();
  delete from public.custom_tests where expires_at < now();

  delete from public.resource_capabilities c
  where c.expires_at <= now()
     or (c.revoked_at is not null and c.revoked_at <= now() - interval '30 days')
     or (c.resource_type = 'team' and not exists (
          select 1 from public.teams t where t.id::text = c.resource_id
        ))
     or (c.resource_type = 'custom' and not exists (
          select 1 from public.custom_tests t where t.id = c.resource_id
        ))
     or (c.resource_type = 'assessment' and not exists (
          select 1 from public.assessments a where a.id::text = c.resource_id
        ));
end; $$;
