-- Migration 0015 — anonymous-first shared identity + resource capabilities.
--
-- Ordinary practice remains local-only in the client. Shared writes opt into
-- Supabase Anonymous Auth and then use the normal authenticated RLS/RPC
-- surface. The browser never receives an email identity, and capability
-- secrets are stored only as SHA-256 digests in this database.

-- Anonymous Auth has no email address. Keep the signup trigger independent of
-- auth.users.email and make the public nickname grammar match the product UI.
alter table public.profiles drop constraint if exists username_format;
alter table public.profiles
  add constraint username_format
  check (username ~ '^[A-Za-z0-9_. -]+$');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'typer_' || substr(md5(clock_timestamp()::text || new.id::text || random()::text), 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- Creates the profile lazily as well as repairing a profile removed by the
-- privacy action. A requested nickname is sanitized and remains private to
-- the authenticated profile except through the existing public_profiles view.
create or replace function public.ensure_shared_profile(
  p_username text default null,
  p_locale text default 'en'
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  v_name text;
  v_locale text := case when p_locale in ('en', 'id') then p_locale else 'en' end;
  v_existing text;
begin
  if uid is null then raise exception 'sign_in_required'; end if;

  insert into public.profiles (id, username, locale)
  values (
    uid,
    'typer_' || substr(md5(clock_timestamp()::text || uid::text || random()::text), 1, 8),
    v_locale
  )
  on conflict (id) do nothing;

  v_name := left(regexp_replace(btrim(coalesce(p_username, '')), '[^[:alnum:] _. -]', '', 'g'), 24);
  if char_length(v_name) >= 2 then
    begin
      update public.profiles
      set username = v_name, locale = v_locale
      where id = uid;
    exception when unique_violation then
      raise exception 'nickname_taken';
    end;
  else
    update public.profiles set locale = v_locale where id = uid;
  end if;

  select username into v_existing from public.profiles where id = uid;
  return jsonb_build_object('id', uid, 'username', v_existing, 'locale', v_locale);
end; $$;
revoke all on function public.ensure_shared_profile(text, text) from public, anon, authenticated;
grant execute on function public.ensure_shared_profile(text, text) to authenticated;

-- Resource-scoped bearer capabilities let a creator recover a team/custom
-- test/assessment from a new anonymous browser without exposing a reusable
-- secret in rows, views, analytics, or the sitemap.
create table if not exists public.resource_capabilities (
  id            uuid primary key default gen_random_uuid(),
  resource_type text not null check (resource_type in ('team', 'custom', 'assessment')),
  resource_id   text not null,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  token_hash    bytea not null,
  issued_at     timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '180 days',
  revoked_at    timestamptz,
  last_used_at  timestamptz
);

create index if not exists resource_capabilities_lookup_idx
  on public.resource_capabilities (resource_type, resource_id, token_hash)
  where revoked_at is null;

alter table public.resource_capabilities enable row level security;
revoke all on public.resource_capabilities from anon, authenticated;

create or replace function public.issue_resource_management_token(
  p_resource_type text,
  p_resource_id text
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  v_type text := lower(btrim(coalesce(p_resource_type, '')));
  v_id text := btrim(coalesce(p_resource_id, ''));
  v_owner uuid;
  v_token text;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if v_type not in ('team', 'custom', 'assessment') or char_length(v_id) < 1 or char_length(v_id) > 120 then
    raise exception 'invalid_resource';
  end if;
  if v_type = 'custom' then v_id := upper(v_id); end if;

  if not public.bump_rate_limit('management_issue:' || uid::text, 12, interval '1 hour') then
    raise exception 'rate_limited';
  end if;

  if v_type = 'team' then
    select owner_id into v_owner from public.teams where id::text = v_id;
  elsif v_type = 'custom' then
    select owner_id into v_owner from public.custom_tests where id = v_id;
  else
    select owner_id into v_owner from public.assessments where id::text = v_id;
  end if;
  if v_owner is distinct from uid then raise exception 'not_found_or_not_owner'; end if;

  update public.resource_capabilities
  set revoked_at = now()
  where resource_type = v_type and resource_id = v_id and owner_id = uid and revoked_at is null;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.resource_capabilities (resource_type, resource_id, owner_id, token_hash)
  values (v_type, v_id, uid, digest(v_token, 'sha256'));

  return jsonb_build_object('resource_type', v_type, 'resource_id', v_id, 'token', v_token,
    'expires_at', now() + interval '180 days');
end; $$;
revoke all on function public.issue_resource_management_token(text, text) from public, anon, authenticated;
grant execute on function public.issue_resource_management_token(text, text) to authenticated;

create or replace function public.validate_resource_management_token(
  p_resource_type text,
  p_resource_id text,
  p_token text
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  v_type text := lower(btrim(coalesce(p_resource_type, '')));
  v_id text := btrim(coalesce(p_resource_id, ''));
  cap public.resource_capabilities;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if v_type not in ('team', 'custom', 'assessment') or char_length(v_id) < 1 or char_length(v_id) > 120 then
    raise exception 'management_invalid';
  end if;
  if v_type = 'custom' then v_id := upper(v_id); end if;
  if char_length(coalesce(p_token, '')) < 32 or char_length(coalesce(p_token, '')) > 512 then
    raise exception 'management_invalid';
  end if;
  if not public.bump_rate_limit('management_validate:' || uid::text, 30, interval '1 hour') then
    raise exception 'rate_limited';
  end if;

  select * into cap
  from public.resource_capabilities
  where resource_type = v_type
    and resource_id = v_id
    and token_hash = digest(p_token, 'sha256')
    and revoked_at is null
    and expires_at > now();
  if cap.id is null then raise exception 'management_invalid'; end if;

  update public.resource_capabilities set last_used_at = now() where id = cap.id;
  return jsonb_build_object('resource_type', cap.resource_type, 'resource_id', cap.resource_id,
    'owner_id', cap.owner_id, 'expires_at', cap.expires_at);
end; $$;
revoke all on function public.validate_resource_management_token(text, text, text) from public, anon, authenticated;
grant execute on function public.validate_resource_management_token(text, text, text) to authenticated;

-- Recovery transfers only the resource named by the valid bearer token to the
-- current anonymous identity. A successful recovery invalidates every prior
-- capability for that exact resource; the new owner can issue a fresh link.
create or replace function public.recover_resource_management(
  p_resource_type text,
  p_resource_id text,
  p_token text
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  v_type text := lower(btrim(coalesce(p_resource_type, '')));
  v_id text := btrim(coalesce(p_resource_id, ''));
  cap public.resource_capabilities;
  v_team uuid;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if v_type not in ('team', 'custom', 'assessment') then raise exception 'management_invalid'; end if;
  if v_type = 'custom' then v_id := upper(v_id); end if;
  if not public.bump_rate_limit('management_recover:' || uid::text, 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;

  select * into cap
  from public.resource_capabilities
  where resource_type = v_type and resource_id = v_id
    and token_hash = digest(coalesce(p_token, ''), 'sha256')
    and revoked_at is null and expires_at > now();
  if cap.id is null then raise exception 'management_invalid'; end if;

  if v_type = 'team' then
    update public.teams set owner_id = uid where id::text = v_id;
    if not found then raise exception 'management_invalid'; end if;
    select id into v_team from public.teams where id::text = v_id;
    update public.team_members set role = 'member'
      where team_id = v_team and role = 'owner' and user_id <> uid;
    insert into public.team_members (team_id, user_id, role)
      values (v_team, uid, 'owner')
      on conflict (team_id, user_id) do update set role = 'owner';
  elsif v_type = 'custom' then
    update public.custom_tests set owner_id = uid where id = v_id;
    if not found then raise exception 'management_invalid'; end if;
  else
    update public.assessments set owner_id = uid where id::text = v_id;
    if not found then raise exception 'management_invalid'; end if;
  end if;

  update public.resource_capabilities
  set owner_id = uid, revoked_at = now(), last_used_at = now()
  where resource_type = v_type and resource_id = v_id and revoked_at is null;
  return jsonb_build_object('resource_type', v_type, 'resource_id', v_id, 'owner_id', uid);
end; $$;
revoke all on function public.recover_resource_management(text, text, text) from public, anon, authenticated;
grant execute on function public.recover_resource_management(text, text, text) to authenticated;

create or replace function public.revoke_resource_management_token(
  p_resource_type text,
  p_resource_id text
)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  v_type text := lower(btrim(coalesce(p_resource_type, '')));
  v_id text := btrim(coalesce(p_resource_id, ''));
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if v_type = 'custom' then v_id := upper(v_id); end if;
  update public.resource_capabilities set revoked_at = now()
  where resource_type = v_type and resource_id = v_id and owner_id = uid and revoked_at is null;
  if not found then raise exception 'not_found_or_not_owner'; end if;
end; $$;
revoke all on function public.revoke_resource_management_token(text, text) from public, anon, authenticated;
grant execute on function public.revoke_resource_management_token(text, text) to authenticated;

-- Privacy deletion for the current anonymous identity. It deletes shared
-- product data but deliberately does not delete auth.users: clearing a browser
-- session should not turn a local privacy action into an account-admin path.
create or replace function public.delete_my_shared_data()
returns void language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  delete from public.attempts where user_id = uid;
  delete from public.friend_challenge_results where user_id = uid;
  update public.friend_challenges set creator_name = 'former user', creator_id = null where creator_id = uid;
  delete from public.team_members where user_id = uid;
  delete from public.teams where owner_id = uid;
  delete from public.custom_tests where owner_id = uid;
  delete from public.assessments where owner_id = uid;
  delete from public.api_keys where owner_id = uid;
  delete from public.resource_capabilities where owner_id = uid;
  delete from public.profiles where id = uid;
end; $$;
revoke all on function public.delete_my_shared_data() from public, anon, authenticated;
grant execute on function public.delete_my_shared_data() to authenticated;
