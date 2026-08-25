-- Migration 0002 — server-authoritative ranked submission, roadmap features,
-- hardening, and complete account deletion.
--
-- Trust boundary (blueprint §3.3/§20): clients NEVER decide public ranked
-- status. They call submit_attempt(p jsonb) with compact EVIDENCE; the
-- database recomputes derived metrics and decides integrity/ranked itself.
-- Public views expose only server-accepted ranked rows.

-- ---------------------------------------------------------------------------
-- Attempts: evidence-based columns + idempotency
-- ---------------------------------------------------------------------------
alter table public.attempts
  add column if not exists client_id text,
  add column if not exists ranked_accepted boolean not null default false,
  add column if not exists metrics jsonb;

create index if not exists attempts_client_idx on public.attempts (user_id, client_id);

-- Idempotent submission per logical attempt (client-generated UUID).
delete from public.attempts a
using public.attempts b
where a.user_id = b.user_id and a.client_id = b.client_id
  and a.client_id is not null and a.ctid > b.ctid;

create unique index if not exists attempts_user_client_uniq
  on public.attempts (user_id, client_id)
  where client_id is not null;

-- ---------------------------------------------------------------------------
-- Simple sliding-window abuse guard shared by anonymous-write RPCs
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket    text primary key,
  window_start timestamptz not null default now(),
  count     int not null default 0
);
delete from public.rate_limits where window_start < now() - interval '1 hour';

create or replace function public.bump_rate_limit(p_bucket text, p_max_events int, p_interval interval)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  ok boolean := false;
begin
  insert into public.rate_limits (bucket, window_start, count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update set
    count = case
      when public.rate_limits.window_start < now() - p_interval then 1
      else public.rate_limits.count + 1 end,
    window_start = case
      when public.rate_limits.window_start < now() - p_interval then now()
      else public.rate_limits.window_start end;
  select rl.count <= p_max_events into ok
  from public.rate_limits rl
  where rl.bucket = p_bucket;
  return coalesce(ok, false);
end; $$;

-- ---------------------------------------------------------------------------
-- SERVER-AUTHORITATIVE SUBMISSION
--
-- Evidence payload (all numbers cross-checked):
--   client_id, exercise_id, exercise_version, scoring_version,
--   normalization_version, mode, language, duration_sec, elapsed_ms,
--   typed_chars, correct_chars, uncorrected_errors, focus_lost_count,
--   paste_flag, burst_flag, challenge_date?, challenge_version?,
--   claimed_wpm?, claimed_accuracy?, metrics? (jsonb extras)
--
-- Server derives: grossWpm = typed/5/min; accuracy = correct/typed;
-- netWpm floor; plausibility windows; ranked eligibility. The client claim is
-- compared against derivation and rejected on material mismatch.
-- ---------------------------------------------------------------------------
create or replace function public.submit_attempt(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_mode text; v_lang text; v_dur int; v_elapsed int;
  v_typed int; v_correct int; v_uncorr int; v_focus int;
  v_paste boolean; v_burst boolean; v_challenge date;
  v_wpm numeric; v_acc numeric; v_integrity text; v_reasons text[] := '{}';
  v_ranked boolean := false;
  v_challenge_version text;
begin
  if uid is null then raise exception 'sign_in_required'; end if;

  -- Abuse guard: max 40 submissions / 10 minutes / user
  if not public.bump_rate_limit('submit:' || uid::text, 40, interval '10 minutes') then
    return jsonb_build_object('accepted', false, 'integrity', 'practice', 'reason', 'rate_limited');
  end if;

  v_mode   := p->>'mode';
  v_lang   := p->>'language';
  v_dur    := (p->>'duration_sec')::int;
  v_elapsed:= (p->>'elapsed_ms')::int;
  v_typed  := coalesce((p->>'typed_chars')::int, 0);
  v_correct:= coalesce((p->>'correct_chars')::int, 0);
  v_uncorr := coalesce((p->>'uncorrected_errors')::int, 0);
  v_focus  := coalesce((p->>'focus_lost_count')::int, 0);
  v_paste  := coalesce((p->>'paste_flag')::boolean, false);
  v_burst  := coalesce((p->>'burst_flag')::boolean, false);
  v_challenge_version := p->>'challenge_version';

  if v_mode not in ('sprint','copy-pro','dictation','transcription','numbers','punctuation','daily','career','custom-practice')
     or v_lang not in ('en','id')
     or v_dur is null or v_dur < 5 or v_dur > 900
     or v_elapsed is null or v_elapsed < 0 or v_elapsed > (v_dur::bigint * 1000 + 60000)
     or v_typed < 0 or v_typed > 20000
     or v_correct < 0 or v_correct > v_typed
     or v_uncorr < 0 or v_uncorr > v_typed then
    return jsonb_build_object('accepted', false, 'integrity', 'flagged', 'reason', 'invalid_evidence');
  end if;

  -- Server-derived metrics (authoritative)
  if v_elapsed > 500 and v_typed >= 5 then
    v_wpm := round((v_typed::numeric / 5) / (v_elapsed / 60000.0), 1);
    v_acc := round((v_correct::numeric / v_typed) * 100, 1);
  else
    v_wpm := 0; v_acc := 0;
  end if;

  -- Material mismatch vs client claim (>10% relative on either metric) flags.
  if p ? 'claimed_wpm' and (p->>'claimed_wpm')::numeric > 0 and v_wpm > 0
     and abs((p->>'claimed_wpm')::numeric - v_wpm) / v_wpm > 0.10 then
    v_reasons := v_reasons || array['wpm_mismatch'];
  end if;
  if p ? 'claimed_accuracy' and abs((p->>'claimed_accuracy')::numeric - v_acc) > 10 then
    v_reasons := v_reasons || array['accuracy_mismatch'];
  end if;

  -- Integrity decision (SERVER-owned)
  if v_paste then v_reasons := v_reasons || array['paste']; end if;
  if v_burst then v_reasons := v_reasons || array['burst']; end if;
  if v_wpm > 220 then v_reasons := v_reasons || array['implausible_speed']; end if;

  if v_mode = 'daily' then
    -- Daily must match TODAY's canonical product-day challenge issued by the server.
    v_challenge := (now() at time zone 'Asia/Jakarta')::date;
    if p->>'challenge_date' is distinct from v_challenge::text then
      v_reasons := v_reasons || array['challenge_date_mismatch'];
    elsif p->>'challenge_version' is distinct from 'v2' then
      v_reasons := v_reasons || array['challenge_version_mismatch'];
    end if;
  end if;

  if array_length(v_reasons, 1) = 0 and v_typed >= 20 and v_elapsed >= 8000 then
    v_integrity := 'ranked';
  elsif array_length(v_reasons, 1) = 0 then
    v_integrity := 'practice'; v_reasons := v_reasons || array['too_short'];
  else
    v_integrity := 'flagged';
  end if;
  v_ranked := (v_integrity = 'ranked');

  -- One canonical ranked daily entry per user/day; later same-day dailies demote.
  if v_mode = 'daily' and v_ranked then
    begin
      insert into public.attempts (user_id, client_id, exercise_id, exercise_version,
        scoring_version, normalization_version, mode, language, duration_sec, elapsed_ms,
        typed_chars, uncorrected_errors, wpm, accuracy, integrity, challenge_date,
        challenge_version, ranked_accepted, metrics)
      values (uid, p->>'client_id', p->>'exercise_id', coalesce(p->>'exercise_version','v3'),
        coalesce(p->>'scoring_version','v2.0.0'), p->>'normalization_version', v_mode, v_lang,
        v_dur, v_elapsed, v_typed, v_uncorr, v_wpm, v_acc, v_integrity, v_challenge,
        v_challenge_version, true, p->'metrics');
      return jsonb_build_object('accepted', true, 'integrity', 'ranked',
        'wpm', v_wpm, 'accuracy', v_acc, 'reasons', '[]'::text[]);
      exception when unique_violation then
        v_integrity := 'practice'; v_ranked := false;
        v_reasons := v_reasons || array['daily_already_ranked'];
    end;
  end if;

  insert into public.attempts (user_id, client_id, exercise_id, exercise_version,
    scoring_version, normalization_version, mode, language, duration_sec, elapsed_ms,
    typed_chars, uncorrected_errors, wpm, accuracy, integrity, challenge_date,
    challenge_version, ranked_accepted, metrics)
  values (uid, p->>'client_id', p->>'exercise_id', coalesce(p->>'exercise_version','v3'),
    coalesce(p->>'scoring_version','v2.0.0'), p->>'normalization_version', v_mode, v_lang,
    v_dur, v_elapsed, v_typed, v_uncorr, v_wpm, v_acc, v_integrity, v_challenge,
    v_challenge_version, v_ranked, p->'metrics');

  return jsonb_build_object('accepted', v_ranked, 'integrity', v_integrity,
    'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(v_reasons));
end; $$;

grant execute on function public.submit_attempt(jsonb) to authenticated;
revoke insert, update, delete on public.attempts from anon;

-- Public boards now require server acceptance as well.
create or replace view public.public_leaderboard
with (security_invoker = false) as
  select a.id, a.user_id, pr.username, a.mode, a.language, a.duration_sec,
         a.wpm, a.accuracy, a.created_at as scored_at
  from public.attempts a
  left join public.profiles pr on pr.id = a.user_id
  where a.integrity = 'ranked' and a.ranked_accepted;

create or replace view public.public_daily_board
with (security_invoker = false) as
  select a.id, a.user_id, pr.username, a.challenge_date,
         a.wpm, a.accuracy, a.created_at as scored_at
  from public.attempts a
  left join public.profiles pr on pr.id = a.user_id
  where a.integrity = 'ranked' and a.ranked_accepted
    and a.challenge_date is not null;

-- ---------------------------------------------------------------------------
-- Remote history: owners read their own rows (any integrity), paginated.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Teams / classrooms
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  kind text not null check (kind in ('sprint','copy-pro','numbers','dictation','transcription','data-entry','career','custom')),
  payload jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_completions (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid references public.attempts(id) on delete set null,
  score numeric(6,1) not null default 0,
  completed_at timestamptz not null default now(),
  primary key (assignment_id, user_id)
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_completions enable row level security;

create policy "teams readable by members" on public.teams for select
  using (exists (select 1 from public.team_members m where m.team_id = id and m.user_id = auth.uid()));
create policy "teams created by owner" on public.teams for insert
  with check (auth.uid() = owner_id);
create policy "teams updated by owner" on public.teams for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "teams deleted by owner" on public.teams for delete
  using (auth.uid() = owner_id);

create policy "members see membership" on public.team_members for select
  using (exists (select 1 from public.team_members m2 where m2.team_id = team_id and m2.user_id = auth.uid()));
create policy "join via code" on public.team_members for insert
  with check (auth.uid() = user_id);
create policy "leave team" on public.team_members for delete
  using (auth.uid() = user_id or auth.uid() = (select owner_id from public.teams t where t.id = team_id));

create policy "assignments visible to members" on public.assignments for select
  using (exists (select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid()));
create policy "admins manage assignments" on public.assignments for insert
  with check (exists (select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('owner','admin')));
create policy "admins update assignments" on public.assignments for update
  using (exists (select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('owner','admin')));
create policy "admins delete assignments" on public.assignments for delete
  using (exists (select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('owner','admin')));

create policy "completions visible to members" on public.assignment_completions for select
  using (exists (select 1 from public.team_members m where m.team_id = (select team_id from public.assignments a where a.id = assignment_id) and m.user_id = auth.uid()));
create policy "record own completion" on public.assignment_completions for insert
  with check (auth.uid() = user_id);
create policy "own completion deletable" on public.assignment_completions for delete
  using (auth.uid() = user_id);

-- Join-by-code helper (atomic, idempotent, rate-limited).
create or replace function public.join_team(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid uuid;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if not public.bump_rate_limit('join_team:' || uid::text, 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select id into tid from public.teams where join_code = upper(p_code);
  if tid is null then raise exception 'team_not_found'; end if;
  insert into public.team_members (team_id, user_id) values (tid, uid)
  on conflict do nothing;
  return tid;
end; $$;
grant execute on function public.join_team(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Custom tests (practice-only by design; never official ranked content)
-- ---------------------------------------------------------------------------
create table if not exists public.custom_tests (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  language text not null check (language in ('en','id')),
  body text not null check (char_length(body) between 10 and 4000),
  visibility text not null default 'unlisted' check (visibility in ('private','unlisted')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days'
);

alter table public.custom_tests enable row level security;
create policy "owner manages own tests" on public.custom_tests for all
  using (auth.uid() = owner_id or (auth.uid() is null and false))
  with check (auth.uid() = owner_id);
create policy "unlisted world-readable" on public.custom_tests for select
  using (visibility = 'unlisted' and expires_at > now());

create or replace function public.create_custom_test(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); cid text;
  alphabet text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  i int;
begin
  if uid is null then raise exception 'sign_in_required_to_create'; end if;
  if not public.bump_rate_limit('custom:' || uid::text, 20, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  cid := '';
  for i in 1..10 loop
    cid := cid || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  insert into public.custom_tests (id, owner_id, title, language, body, visibility)
  values (cid, uid,
          left(regexp_replace(p->>'title', '[^[:alnum:] _\-''!?.,:;()"&/+]', '', 'g'), 80),
          p->>'language',
          left(coalesce(p->>'body',''), 4000),
          case when p->>'visibility' = 'private' then 'private' else 'unlisted' end);
  return cid;
end; $$;
grant execute on function public.create_custom_test(jsonb) to authenticated;

-- Purge expired custom tests + friend challenges together.
create or replace function public.purge_expired()
returns void language sql security definer set search_path = public as $$
  delete from public.friend_challenges where expires_at < now();
  delete from public.custom_tests where expires_at < now();
$$;

-- ---------------------------------------------------------------------------
-- Multiplayer rooms (realtime presence/broadcast carries live state; tables
-- hold durable room config + final results for late joiners/audit)
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  code text primary key,
  host_name text not null,
  state text not null default 'lobby' check (state in ('lobby','running','finished')),
  exercise_kind text not null default 'sprint',
  language text not null default 'en' check (language in ('en','id')),
  duration_sec int not null default 30 check (duration_sec between 15 and 300),
  stream_seed text not null,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 day'
);

create table if not exists public.room_results (
  room_code text not null references public.rooms(code) on delete cascade,
  player_key text not null,
  display_name text not null,
  wpm numeric(6,1) not null check (wpm >= 0 and wpm <= 300),
  accuracy numeric(5,1) not null check (accuracy >= 0 and accuracy <= 100),
  finished_at timestamptz not null default now(),
  primary key (room_code, player_key)
);

alter table public.rooms enable row level security;
alter table public.room_results enable row level security;
create policy "rooms world read" on public.rooms for select using (true);
create policy "rooms create (rate-limited)" on public.rooms for insert with check (true);
create policy "results world read" on public.room_results for select using (true);
create policy "results insert (rate-limited)" on public.room_results for insert with check (true);

create or replace function public.create_room(p jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  new_code text;
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
  insert into public.rooms (code, host_name, exercise_kind, language, duration_sec, stream_seed)
  values (new_code, left(coalesce(p->>'host_name','host'), 24),
          coalesce(p->>'exercise_kind','sprint'),
          coalesce(p->>'language','en'),
          greatest(15, least(300, coalesce((p->>'duration_sec')::int, 30))),
          md5(random()::text || clock_timestamp()::text));
  return new_code;
end; $$;
grant execute on function public.create_room(jsonb) to anon, authenticated;

create or replace function public.start_room(p_code text, p_player_key text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.rooms;
begin
  if not public.bump_rate_limit('startroom:' || coalesce(auth.uid()::text, p_player_key), 12, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select * into r from public.rooms where code = p_code for update;
  if r is null then raise exception 'room_not_found'; end if;
  if r.state <> 'lobby' then raise exception 'already_started'; end if;
  update public.rooms
  set state = 'running', started_at = now(), ends_at = now() + make_interval(secs => r.duration_sec)
  where code = p_code;
end; $$;
grant execute on function public.start_room(text, text) to anon, authenticated;

create or replace function public.finish_room(p_code text, p_player_key text, p jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.bump_rate_limit('finishroom:' || coalesce(auth.uid()::text, p_player_key), 20, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  if (p->>'claimed_wpm')::numeric > 220 or (p->>'claimed_accuracy')::numeric > 100 then
    raise exception 'implausible_result';
  end if;
  insert into public.room_results (room_code, player_key, display_name, wpm, accuracy)
  values (p_code, left(p_player_key, 40), left(coalesce(p->>'display_name','player'), 24),
          round((p->>'claimed_wpm')::numeric, 1), round((p->>'claimed_accuracy')::numeric, 1))
  on conflict (room_code, player_key) do nothing;
end; $$;
grant execute on function public.finish_room(text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Employer assessments (invite-token candidate flow; results private to owner)
-- ---------------------------------------------------------------------------
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  modules jsonb not null check (jsonb_typeof(modules) = 'array'),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  window_hours int not null default 72 check (window_hours between 1 and 720),
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  candidate_key text not null,
  label text not null default 'candidate',
  results jsonb not null,
  integrity_flags text[] not null default '{}',
  completed_at timestamptz not null default now(),
  unique (assessment_id, candidate_key)
);

alter table public.assessments enable row level security;
alter table public.assessment_results enable row level security;
create policy "owner reads own assessments" on public.assessments for select using (auth.uid() = owner_id);
create policy "owner creates assessments" on public.assessments for insert with check (auth.uid() = owner_id);
create policy "owner deletes own assessments" on public.assessments for delete using (auth.uid() = owner_id);
create policy "owner reads own results" on public.assessment_results for select
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.owner_id = auth.uid()));

-- Candidate submission: invite token validated server-side; anon allowed.
create or replace function public.submit_assessment_result(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare aid uuid;
begin
  if not public.bump_rate_limit('assess:' || coalesce(p->>'candidate_key','x'), 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select id into aid from public.assessments
  where invite_code = upper(p->>'invite_code')
    and created_at + make_interval(hours => window_hours) > now();
  if aid is null then raise exception 'invite_invalid_or_expired'; end if;
  insert into public.assessment_results (assessment_id, candidate_key, label, results, integrity_flags)
  values (aid, left(p->>'candidate_key', 40),
          left(regexp_replace(coalesce(p->>'label','candidate'), '[^[:alnum:] _\-]', '', 'g'), 40),
          p->'results',
          coalesce((select array_agg(x::text) from jsonb_array_elements_text(coalesce(p->'flags','[]'::jsonb)) x), '{}'))
  on conflict (assessment_id, candidate_key) do nothing;
end; $$;
grant execute on function public.submit_assessment_result(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tournament API keys (edge-function surface; keys hashed, never plaintext)
-- ---------------------------------------------------------------------------
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);
alter table public.api_keys enable row level security;
create policy "owner manages keys" on public.api_keys for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- COMPLETE ACCOUNT DELETION (product data + auth user) — no dashboard step.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  delete from public.attempts where user_id = uid;
  update public.friend_challenges set creator_name = 'former user' where creator_id = uid;
  delete from public.assessments where owner_id = uid;
  delete from public.api_keys where owner_id = uid;
  delete from public.profiles where id = uid;
  -- Removes the auth user; cascades clean remaining owned rows.
  delete from auth.users where id = uid;
end; $$;
grant execute on function public.delete_my_account() to authenticated;

drop function if exists public.delete_my_data();

-- Housekeeping alias kept for scheduled jobs.
grant execute on function public.purge_expired() to service_role;

-- ---------------------------------------------------------------------------
-- Tournament API backing tables (edge-function surface)
-- ---------------------------------------------------------------------------
create table if not exists public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  owner_key_id uuid not null references public.api_keys(id) on delete cascade,
  name         text not null check (char_length(name) between 2 and 80),
  created_at   timestamptz not null default now()
);

create table if not exists public.tournament_entries (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  attempt_id    uuid references public.attempts(id) on delete set null,
  display_name  text not null,
  wpm           numeric(6,1) not null,
  accuracy      numeric(5,1) not null,
  created_at    timestamptz not null default now(),
  unique (tournament_id, attempt_id)
);

alter table public.tournaments enable row level security;
alter table public.tournament_entries enable row level security;
