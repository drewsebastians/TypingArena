-- Migration 0012 — closure pass V: pgcrypto visibility inside SECURITY
-- DEFINER functions.
--
-- Supabase installs pgcrypto into the `extensions` schema, but the room RPCs
-- pin `search_path = public`, so gen_random_bytes()/digest() resolved only at
-- first execution (caught by CI when the multiplayer suite finally ran).
-- Recreate the four crypto-using functions with an explicit search_path that
-- includes `extensions`. Logic is otherwise identical to 0004/0006.

-- ---------------------------------------------------------------------------
-- create_room (unchanged logic; search_path fixed)
-- ---------------------------------------------------------------------------
drop function if exists public.create_room(jsonb);
create or replace function public.create_room(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := auth.uid();
  new_code text;
  host_token text;
  exists_row boolean;
  alphabet text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  i int;
begin
  if not public.bump_rate_limit('room:' || coalesce(uid::text, coalesce(p->>'player_key','anon')), 6, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    select true into exists_row from public.rooms rr where rr.code = new_code;
    exit when not coalesce(exists_row, false);
  end loop;
  host_token := encode(gen_random_bytes(24), 'hex');
  insert into public.rooms (code, host_name, exercise_kind, language, duration_sec, stream_seed, host_token_hash)
  values (new_code, left(coalesce(p->>'host_name','host'), 24),
          coalesce(p->>'exercise_kind','sprint'),
          coalesce(p->>'language','en'),
          greatest(15, least(300, coalesce((p->>'duration_sec')::int, 30))),
          md5(random()::text || clock_timestamp()::text),
          encode(digest(host_token, 'sha256'), 'hex'));
  return jsonb_build_object('code', new_code, 'host_token', host_token);
end; $$;
grant execute on function public.create_room(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- start_room (unchanged logic; search_path fixed)
-- ---------------------------------------------------------------------------
drop function if exists public.start_room(text, text);
create or replace function public.start_room(p_code text, p_host_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare r public.rooms;
begin
  if not public.bump_rate_limit('startroom:' || coalesce(auth.uid()::text, 'anon'), 12, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select * into r from public.rooms where code = upper(btrim(coalesce(p_code, ''))) for update;
  if r is null then raise exception 'room_not_found'; end if;
  if r.state <> 'lobby' then raise exception 'already_started'; end if;
  if r.expires_at < now() then raise exception 'room_expired'; end if;
  if r.host_token_hash is null
     or r.host_token_hash <> encode(digest(coalesce(p_host_token, ''), 'sha256'), 'hex') then
    raise exception 'not_host';
  end if;
  update public.rooms
  set state = 'running', started_at = now(), ends_at = now() + make_interval(secs => r.duration_sec)
  where code = r.code;
end; $$;
grant execute on function public.start_room(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- restart_room (unchanged logic; search_path fixed)
-- ---------------------------------------------------------------------------
drop function if exists public.restart_room(text, text);
create or replace function public.restart_room(p_code text, p_host_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare r public.rooms;
begin
  if not public.bump_rate_limit('restartroom:' || coalesce(auth.uid()::text, 'anon'), 12, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select * into r from public.rooms where code = upper(btrim(coalesce(p_code, ''))) for update;
  if r is null then raise exception 'room_not_found'; end if;
  if r.host_token_hash is null
     or r.host_token_hash <> encode(digest(coalesce(p_host_token, ''), 'sha256'), 'hex') then
    raise exception 'not_host';
  end if;
  delete from public.room_results where room_code = r.code;
  update public.rooms
  set state = 'lobby', started_at = null, ends_at = null,
      stream_seed = md5(random()::text || clock_timestamp()::text)
  where code = r.code;
end; $$;
grant execute on function public.restart_room(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- close_room (unchanged logic from 0006; search_path fixed)
-- ---------------------------------------------------------------------------
drop function if exists public.close_room(text, text);
create or replace function public.close_room(p_code text, p_host_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare r public.rooms;
begin
  if not public.bump_rate_limit('closeroom:' || coalesce(auth.uid()::text, 'anon'), 12, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select * into r from public.rooms where code = upper(btrim(coalesce(p_code, ''))) for update;
  if r is null then raise exception 'room_not_found'; end if;
  if r.state = 'finished' then return; end if; -- idempotent cancel
  if r.host_token_hash is null
     or r.host_token_hash <> encode(digest(coalesce(p_host_token, ''), 'sha256'), 'hex') then
    raise exception 'not_host';
  end if;
  update public.rooms
  set state = 'finished', ends_at = now(), expires_at = least(r.expires_at, now() + interval '1 hour')
  where code = r.code;
end; $$;
grant execute on function public.close_room(text, text) to anon, authenticated;
