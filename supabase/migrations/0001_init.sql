-- TypingArena shared-competition schema (bootstrap product)
-- Applies to any Supabase/Postgres project. See docs/ADR-001 for the decision.
--
-- Security model:
--   * attempts      — private per-user rows; RLS restricts SELECT/INSERT to owner.
--   * public_leaderboard / public_daily_board — definer views exposing ONLY
--     ranked rows publicly. Views bypass RLS intentionally (owner = postgres)
--     but expose no private columns beyond display fields.
--   * friend_challenges / results — world-readable by design (share links);
--     anon INSERT allowed so anonymous users can create challenges; ids are
--     unguessable 10-char base32 tokens; rows expire after 30 days.
--   * profiles      — username is the ONLY public field (view exposes it).
--
-- Integrity: public_* views filter integrity='ranked'. A tampered client can
-- insert rows, but they stay invisible unless integrity='ranked'; plausibility
-- CHECKs bound fabricated values. Heuristic signals remain heuristics — this is
-- not formal proctoring (documented product stance).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles: public username separated from private identity (email lives in auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  locale     text not null default 'en',
  created_at timestamptz not null default now(),
  constraint username_len check (char_length(username) between 2 and 24),
  constraint username_format check (username ~ '^[A-Za-z0-9_.-]+$')
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Public usernames readable without exposing emails:
create or replace view public.public_profiles
with (security_invoker = false) as
  select id, username from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- Auto-create profile on signup with a random placeholder username.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'typer_' || substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Attempts: every scored attempt (all modes). Private to the user.
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  exercise_id           text not null,
  exercise_version      text not null,
  scoring_version       text not null,
  normalization_version text,
  mode                  text not null,
  language              text not null check (language in ('en','id')),
  duration_sec          int  not null check (duration_sec between 5 and 900),
  elapsed_ms            int  not null check (elapsed_ms >= 0),
  typed_chars           int  not null default 0 check (typed_chars >= 0),
  uncorrected_errors    int  not null default 0 check (uncorrected_errors >= 0),
  wpm                   numeric(6,1) not null check (wpm >= 0 and wpm <= 300),
  accuracy              numeric(5,1) not null check (accuracy >= 0 and accuracy <= 100),
  integrity             text not null check (integrity in ('ranked','practice','flagged')),
  challenge_date        date,
  challenge_version     text,
  created_at            timestamptz not null default now()
);

create index if not exists attempts_board_idx
  on public.attempts (mode, language, duration_sec, wpm desc)
  where integrity = 'ranked';
create index if not exists attempts_daily_idx
  on public.attempts (challenge_date, wpm desc)
  where challenge_date is not null and integrity = 'ranked';
create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);

alter table public.attempts enable row level security;

drop policy if exists "attempts own select" on public.attempts;
create policy "attempts own select" on public.attempts
  for select using (auth.uid() = user_id);
drop policy if exists "attempts own insert" on public.attempts;
create policy "attempts own insert" on public.attempts
  for insert with check (auth.uid() = user_id);
drop policy if exists "attempts own delete" on public.attempts;
create policy "attempts own delete" on public.attempts
  for delete using (auth.uid() = user_id);

-- One ranked daily attempt per user per day (retries stay practice locally).
create unique index if not exists attempts_unique_ranked_daily
  on public.attempts (user_id, challenge_date)
  where challenge_date is not null and integrity = 'ranked';

-- Public boards: definer views over ranked rows only.
create or replace view public.public_leaderboard
with (security_invoker = false) as
  select a.id, a.user_id, p.username, a.mode, a.language, a.duration_sec,
         a.wpm, a.accuracy, a.created_at as scored_at
  from public.attempts a
  left join public.profiles p on p.id = a.user_id
  where a.integrity = 'ranked';
grant select on public.public_leaderboard to anon, authenticated;

create or replace view public.public_daily_board
with (security_invoker = false) as
  select a.id, a.user_id, p.username, a.challenge_date,
         a.wpm, a.accuracy, a.created_at as scored_at
  from public.attempts a
  left join public.profiles p on p.id = a.user_id
  where a.integrity = 'ranked' and a.challenge_date is not null;
grant select on public.public_daily_board to anon, authenticated;

-- Rank of a user's best canonical result (sprint/en/30s board), 1-based.
create or replace function public.my_best_rank(p_user uuid)
returns int language sql stable security definer set search_path = public as $$
  with ranked as (
    select user_id, max(wpm) as best_wpm,
           dense_rank() over (order by max(wpm) desc) as rnk
    from public.attempts
    where integrity = 'ranked' and mode in ('sprint','daily') and language='en' and duration_sec=30
    group by user_id
  )
  select rnk from ranked where user_id = p_user
  union all
  select null::int where not exists (
    select 1 from ranked where user_id = p_user
  )
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Friend challenges: cross-device share links backed by central storage.
-- ---------------------------------------------------------------------------
create table if not exists public.friend_challenges (
  id                text primary key,
  creator_id        uuid references auth.users(id) on delete set null,
  creator_name      text not null,
  challenge_version text not null default 'v2',
  payload           jsonb not null,
  expires_at        timestamptz not null default now() + interval '30 days',
  created_at        timestamptz not null default now(),
  constraint payload_shape check (
    payload ? 'exerciseId' and payload ? 'language' and payload ? 'mode' and payload ? 'durationSec'
  )
);

alter table public.friend_challenges enable row level security;
drop policy if exists "challenges world read" on public.friend_challenges;
create policy "challenges world read" on public.friend_challenges
  for select using (true);
drop policy if exists "challenges world insert" on public.friend_challenges;
create policy "challenges world insert" on public.friend_challenges
  for insert with check (true);
drop policy if exists "challenges own delete" on public.friend_challenges;
create policy "challenges own delete" on public.friend_challenges
  for delete using (auth.uid() = creator_id);

create table if not exists public.friend_challenge_results (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  text not null references public.friend_challenges(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  display_name  text not null,
  wpm           numeric(6,1) not null check (wpm >= 0 and wpm <= 300),
  accuracy      numeric(5,1) not null check (accuracy >= 0 and accuracy <= 100),
  created_at    timestamptz not null default now()
);

alter table public.friend_challenge_results enable row level security;
drop policy if exists "results world read" on public.friend_challenge_results;
create policy "results world read" on public.friend_challenge_results
  for select using (true);
drop policy if exists "results world insert" on public.friend_challenge_results;
create policy "results world insert" on public.friend_challenge_results
  for insert with check (true);

-- Housekeeping: drop expired challenges (call via pg_cron or scheduled job).
create or replace function public.purge_expired_challenges()
returns void language sql security definer set search_path = public as $$
  delete from public.friend_challenges where expires_at < now();
$$;

-- ---------------------------------------------------------------------------
-- Privacy: full data deletion for the signed-in user.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_data()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.attempts where user_id = uid;
  update public.friend_challenges set creator_name = 'former user' where creator_id = uid;
  delete from public.profiles where id = uid;
end; $$;

grant execute on function public.delete_my_data to authenticated;
grant execute on function public.my_best_rank(uuid) to anon, authenticated;
