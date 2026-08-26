-- Migration 0004 — zero-deferred closure pass (corrective, additive).
--
-- Closes the remaining P0 trust/authorization gaps found in the final audit:
--
--   1. TEAM MEMBERSHIP AUTHORIZATION
--      The 0002 "join via code" policy let any authenticated user insert
--      themselves into ANY team by UUID with ANY role (including owner).
--      Membership creation is now mediated exclusively by SECURITY DEFINER
--      RPCs: create_team(name) for owners, join_team(code) for everyone else.
--      Direct INSERT privileges on team_members are removed entirely, so role
--      escalation and cross-team self-joining are structurally impossible.
--
--   2. CLASSROOM ASSIGNMENTS EXECUTE REAL EXERCISES
--      complete_assignment(assignment_id, client_id) binds a completion to a
--      REAL persisted attempt owned by the member, matching the assignment's
--      mode + exercise ref, above a minimum effort floor. The score is
--      computed SERVER-SIDE from the attempt's server-derived wpm/accuracy —
--      the client can no longer post an arbitrary "100".
--
--   3. EMPLOYER ASSESSMENT INVITE DEFINITION RESOLUTION
--      fetch_assessment_definition(invite) lets candidates resolve EXACTLY the
--      saved module sequence (validated + non-expired) instead of a hardcoded
--      list. submit_assessment_result validates result shape/bounds and caps
--      module count to the definition, so arbitrary payloads are rejected.
--
--   4. MULTIPLAYER HOST AUTHORITY + RESULT VALIDATION
--      Rooms carry a sha256 host-token hash; start/restart verify it, so only
--      the creator can start/rematch. finish_room recomputes wpm/accuracy from
--      submitted evidence counts within the race time window and dedupes per
--      player. Permissive world-insert table policies are removed — all room/
--      result writes flow through the RPCs.
--
--   5. SYNC IDEMPOTENCY SIGNAL
--      submit_attempt reports duplicate:true when the (user_id, client_id)
--      pair was already persisted, letting the offline queue distinguish
--      "accepted" from "already persisted" without risking data loss.

-- ---------------------------------------------------------------------------
-- 1. submit_attempt: explicit duplicate signal (create-or-replace of 0002 body)
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
  v_client text;
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
  v_client := p->>'client_id';

  -- Idempotency fast-path: this exact logical attempt is already persisted.
  -- Report the STORED verdict; never insert a second row.
  if v_client is not null and exists (
    select 1 from public.attempts a where a.user_id = uid and a.client_id = v_client
  ) then
    select wpm, accuracy, integrity into v_wpm, v_acc, v_integrity
    from public.attempts a where a.user_id = uid and a.client_id = v_client
    order by created_at desc limit 1;
    return jsonb_build_object('accepted', v_integrity = 'ranked', 'integrity', v_integrity,
      'duplicate', true, 'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(ARRAY[]::text[]));
  end if;

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

  if coalesce(array_length(v_reasons, 1), 0) = 0 and v_typed >= 20 and v_elapsed >= 8000 then
    v_integrity := 'ranked';
  elsif coalesce(array_length(v_reasons, 1), 0) = 0 then
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
      values (uid, v_client, p->>'exercise_id', coalesce(p->>'exercise_version','v3'),
        coalesce(p->>'scoring_version','v2.0.0'), p->>'normalization_version', v_mode, v_lang,
        v_dur, v_elapsed, v_typed, v_uncorr, v_wpm, v_acc, v_integrity, v_challenge,
        v_challenge_version, true, p->'metrics');
      return jsonb_build_object('accepted', true, 'integrity', 'ranked', 'duplicate', false,
        'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(ARRAY[]::text[]));
      exception when unique_violation then
        v_integrity := 'practice'; v_ranked := false;
        v_reasons := v_reasons || array['daily_already_ranked'];
    end;
  end if;

  begin
    insert into public.attempts (user_id, client_id, exercise_id, exercise_version,
      scoring_version, normalization_version, mode, language, duration_sec, elapsed_ms,
      typed_chars, uncorrected_errors, wpm, accuracy, integrity, challenge_date,
      challenge_version, ranked_accepted, metrics)
    values (uid, v_client, p->>'exercise_id', coalesce(p->>'exercise_version','v3'),
      coalesce(p->>'scoring_version','v2.0.0'), p->>'normalization_version', v_mode, v_lang,
      v_dur, v_elapsed, v_typed, v_uncorr, v_wpm, v_acc, v_integrity, v_challenge,
      v_challenge_version, v_ranked, p->'metrics');
  exception
    when unique_violation then
      -- Concurrent duplicate of the same logical attempt: idempotent no-op.
      return jsonb_build_object('accepted', v_ranked, 'integrity', v_integrity,
        'duplicate', true, 'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(v_reasons));
  end;

  return jsonb_build_object('accepted', v_ranked, 'integrity', v_integrity, 'duplicate', false,
    'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(v_reasons));
end; $$;

-- ---------------------------------------------------------------------------
-- 2. Teams: authorized membership creation only
-- ---------------------------------------------------------------------------

-- Atomic team creation: creates the team AND its owner membership in one
-- statement pair, so a team can never exist without its owner row.
create or replace function public.create_team(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_name text := left(btrim(coalesce(p_name, '')), 60);
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if not public.bump_rate_limit('create_team:' || uid::text, 5, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  if char_length(v_name) < 2 then raise exception 'invalid_name'; end if;
  insert into public.teams (name, owner_id) values (v_name, uid)
    returning id, join_code into v_id, v_code;
  insert into public.team_members (team_id, user_id, role) values (v_id, uid, 'owner');
  return jsonb_build_object('id', v_id, 'name', v_name, 'join_code', v_code, 'owner_id', uid);
end; $$;
grant execute on function public.create_team(text) to authenticated;

-- Remove BOTH direct client insert paths. After this migration the ONLY ways
-- to create membership/team rows are the SECURITY DEFINER RPCs
-- (create_team / join_team), which enforce join codes, rate limits and roles.
drop policy if exists "join via code" on public.team_members;
drop policy if exists "teams created by owner" on public.teams;

-- join_team stays as in 0002 (atomic, idempotent, rate-limited) but is
-- restated here so the full authorized-membership contract lives in one place.
create or replace function public.join_team(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid uuid;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if not public.bump_rate_limit('join_team:' || uid::text, 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select id into tid from public.teams where join_code = upper(trim(coalesce(p_code, '')));
  if tid is null then raise exception 'team_not_found'; end if;
  insert into public.team_members (team_id, user_id) values (tid, uid)
  on conflict do nothing;
  return tid;
end; $$;
grant execute on function public.join_team(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Assignments: completions must derive from REAL attempts
-- ---------------------------------------------------------------------------
alter table public.assignment_completions
  add column if not exists wpm numeric(6,1),
  add column if not exists accuracy numeric(5,1);

-- Deterministic completion score (documented in docs/ADR-004-trust-model.md):
--   score = round(0.6·accuracy + 0.4·min(wpm,100), 1)
-- computed from the SERVER-DERIVED attempt metrics, never from client claims.
create or replace function public.complete_assignment(p_assignment_id uuid, p_client_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a public.assignments%rowtype;
  att public.attempts%rowtype;
  v_score numeric(6,1);
  v_expected_mode text;
  v_expected_exercise text;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  select * into a from public.assignments where id = p_assignment_id;
  if a is null then raise exception 'assignment_not_found'; end if;
  if not exists (
    select 1 from public.team_members m
    where m.team_id = a.team_id and m.user_id = uid
  ) then raise exception 'not_a_member'; end if;

  -- The completion must reference an attempt THIS user really persisted.
  select * into att from public.attempts
  where user_id = uid and client_id = btrim(coalesce(p_client_id, ''))
  order by created_at desc limit 1;
  if att is null then raise exception 'attempt_not_found'; end if;

  -- Mode binding: assignment kind maps onto the attempt mode…
  v_expected_mode := case a.kind
    when 'data-entry' then 'numbers'
    when 'custom'     then 'custom-practice'
    else a.kind
  end;
  -- …and (when the definition carries an exercise ref) onto the exact
  -- deterministic exercise identity the runner was launched with.
  if a.payload ? 'ref' and coalesce(a.payload->>'ref', '') <> '' then
    v_expected_exercise := 'assignment:' || a.kind || ':' || (a.payload->>'ref')
      || ':' || coalesce(a.payload->>'language', 'en');
    if att.exercise_id <> v_expected_exercise then
      raise exception 'attempt_mismatch';
    end if;
  end if;
  if att.mode <> v_expected_mode then
    raise exception 'attempt_mismatch';
  end if;

  -- Effort floor: trivially empty runs cannot satisfy assignments.
  if att.typed_chars < 20 or att.elapsed_ms < 5000 then
    raise exception 'attempt_too_short';
  end if;

  v_score := round(att.accuracy * 0.6 + least(att.wpm, 100) * 0.4, 1);

  insert into public.assignment_completions
    (assignment_id, user_id, attempt_id, score, wpm, accuracy, completed_at)
  values (a.id, uid, att.id, v_score, att.wpm, att.accuracy, now())
  on conflict (assignment_id, user_id) do update set
    score = greatest(public.assignment_completions.score, excluded.score),
    attempt_id = case when excluded.score > public.assignment_completions.score
                      then excluded.attempt_id else public.assignment_completions.attempt_id end,
    wpm = case when excluded.score > public.assignment_completions.score
               then excluded.wpm else public.assignment_completions.wpm end,
    accuracy = case when excluded.score > public.assignment_completions.score
                    then excluded.accuracy else public.assignment_completions.accuracy end,
    completed_at = case when excluded.score > public.assignment_completions.score
                        then now() else public.assignment_completions.completed_at end;

  return jsonb_build_object('assignment_id', a.id, 'score', v_score,
    'wpm', att.wpm, 'accuracy', att.accuracy);
end; $$;
grant execute on function public.complete_assignment(uuid, text) to authenticated;

-- Arbitrary-score direct insertion is closed; completions exist only through
-- the validating RPC (or owner cleanup cascades).
drop policy if exists "record own completion" on public.assignment_completions;

-- ---------------------------------------------------------------------------
-- 4. Employer assessments: invite-resolvable definitions + hardened submission
-- ---------------------------------------------------------------------------

-- Candidates resolve the SAVED module sequence from the invite token.
-- Exposes nothing beyond title/modules/expiry — no owner identity, no emails.
create or replace function public.fetch_assessment_definition(p_invite text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r record;
  v_expires timestamptz;
begin
  select title, modules, created_at + make_interval(hours => window_hours) as expires_at
    into r
  from public.assessments where invite_code = upper(btrim(coalesce(p_invite, '')));
  if r is null or r.expires_at <= now() then
    raise exception 'invite_invalid_or_expired';
  end if;
  return jsonb_build_object('title', r.title, 'modules', r.modules, 'expires_at', r.expires_at);
end; $$;
grant execute on function public.fetch_assessment_definition(text) to anon, authenticated;

create or replace function public.submit_assessment_result(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  aid uuid;
  v_module_count int;
  m jsonb;
begin
  if not public.bump_rate_limit('assess:' || coalesce(auth.uid()::text, p->>'candidate_key','x'), 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select id, jsonb_array_length(modules) into aid, v_module_count
  from public.assessments
  where invite_code = upper(btrim(coalesce(p->>'invite_code','')))
    and created_at + make_interval(hours => window_hours) > now();
  if aid is null then raise exception 'invite_invalid_or_expired'; end if;

  -- Results must describe the DEFINED modules with plausible metrics —
  -- arbitrary payloads are rejected rather than trusted.
  if p->'results'->'modules' is null
     or jsonb_typeof(p->'results'->'modules') <> 'array'
     or jsonb_array_length(p->'results'->'modules') = 0
     or jsonb_array_length(p->'results'->'modules') > v_module_count then
    raise exception 'invalid_results';
  end if;
  for m in select jsonb_array_elements(p->'results'->'modules') loop
    if coalesce((m->>'wpm')::numeric, -1) < 0 or coalesce((m->>'wpm')::numeric, -1) > 300
       or coalesce((m->>'accuracy')::numeric, -1) < 0 or coalesce((m->>'accuracy')::numeric, -1) > 100 then
      raise exception 'invalid_results';
    end if;
  end loop;

  insert into public.assessment_results (assessment_id, candidate_key, label, results, integrity_flags)
  values (aid, left(coalesce(p->>'candidate_key','x'), 40),
          left(regexp_replace(coalesce(p->>'label','candidate'), '[^[:alnum:] _\-]', '', 'g'), 40),
          p->'results',
          coalesce((select array_agg(x::text) from jsonb_array_elements_text(coalesce(p->'flags','[]'::jsonb)) x), '{}'))
  on conflict (assessment_id, candidate_key) do nothing;
end; $$;
grant execute on function public.submit_assessment_result(jsonb) to anon, authenticated;

-- Definition sanity: an assessment always carries a non-empty module array.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assessments_modules_nonempty'
  ) then
    alter table public.assessments
      add constraint assessments_modules_nonempty
      check (jsonb_array_length(modules) between 1 and 12);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Multiplayer: host authority + evidence-based results
-- ---------------------------------------------------------------------------
alter table public.rooms add column if not exists host_token_hash text;
alter table public.room_results
  add column if not exists typed_chars int,
  add column if not exists correct_chars int,
  add column if not exists elapsed_ms int;

-- Close the permissive direct-write policies from 0002: room/result rows are
-- created exclusively through the SECURITY DEFINER RPCs below.
drop policy if exists "rooms create (rate-limited)" on public.rooms;
drop policy if exists "results insert (rate-limited)" on public.room_results;

-- Returns {code, host_token}; the raw token is shown ONCE to the creator and
-- only its sha256 hash is stored — nobody else can start/restart the room.
-- (Return type changed from 0002's text, so the old function must be dropped.)
drop function if exists public.create_room(jsonb);
create or replace function public.create_room(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
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

-- HOST-only start: verifies the sha256 token hash against the stored value.
-- (Second parameter renamed from 0002's p_player_key, so the old function
-- must be dropped first — CREATE OR REPLACE cannot rename parameters.)
drop function if exists public.start_room(text, text);
create or replace function public.start_room(p_code text, p_host_token text)
returns void language plpgsql security definer set search_path = public as $$
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

-- HOST-only rematch: resets the room to a fresh lobby with a new seed and
-- clears prior results, keeping the same shareable code.
create or replace function public.restart_room(p_code text, p_host_token text)
returns void language plpgsql security definer set search_path = public as $$
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

-- Results are validated against the ROOM STATE and derived from EVIDENCE:
--   * room must be running and inside its race window (+20s network grace);
--   * typed/correct counts must arrive and satisfy correctness invariants;
--   * wpm/accuracy are RECOMPUTED server-side from those counts;
--   * implausible derived speeds (>220 wpm) are rejected outright;
--   * one result per player (dedupe by player_key).
-- (Return type changed from 0002's void, so the old function must be dropped.)
drop function if exists public.finish_room(text, text, jsonb);
create or replace function public.finish_room(p_code text, p_player_key text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.rooms;
  v_typed int; v_correct int; v_elapsed int;
  v_wpm numeric; v_acc numeric;
begin
  if not public.bump_rate_limit('finishroom:' || coalesce(auth.uid()::text, left(coalesce(p_player_key,'x'),40)), 20, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select * into r from public.rooms where code = upper(btrim(coalesce(p_code, ''))) for update;
  if r is null then raise exception 'room_not_found'; end if;
  if r.state <> 'running' or r.started_at is null or r.ends_at is null then
    raise exception 'race_not_running';
  end if;
  if now() > r.ends_at + interval '20 seconds' then
    raise exception 'race_window_closed';
  end if;

  v_typed   := coalesce((p->>'typed_chars')::int, -1);
  v_correct := coalesce((p->>'correct_chars')::int, -1);
  v_elapsed := coalesce((p->>'elapsed_ms')::int, -1);
  if v_typed < 0 or v_typed > 20000
     or v_correct < 0 or v_correct > v_typed
     or v_elapsed < 1000 or v_elapsed > r.duration_sec * 1000 + 15000 then
    raise exception 'invalid_evidence';
  end if;

  v_wpm := round((v_typed::numeric / 5) / (v_elapsed / 60000.0), 1);
  v_acc := round((v_correct::numeric / v_typed) * 100, 1);
  if v_wpm > 220 then raise exception 'implausible_result'; end if;

  -- Insert-or-detect: RETURNING is empty when the player already finished.
  declare
    inserted_key text;
    existing public.room_results%rowtype;
  begin
    insert into public.room_results
      (room_code, player_key, display_name, wpm, accuracy, typed_chars, correct_chars, elapsed_ms)
    values (r.code, left(coalesce(p_player_key, 'x'), 40),
            left(regexp_replace(coalesce(p->>'display_name','player'), '[^[:alnum:] _\-.]', '', 'g'), 24),
            v_wpm, v_acc, v_typed, v_correct, v_elapsed)
    on conflict (room_code, player_key) do nothing
    returning player_key into inserted_key;

    if inserted_key is null then
      select * into existing from public.room_results
      where room_code = r.code and player_key = left(coalesce(p_player_key, 'x'), 40);
      return jsonb_build_object('accepted', true, 'duplicate', true,
        'wpm', existing.wpm, 'accuracy', existing.accuracy);
    end if;
  end;

  return jsonb_build_object('accepted', true, 'duplicate', false, 'wpm', v_wpm, 'accuracy', v_acc);
end; $$;
grant execute on function public.finish_room(text, text, jsonb) to anon, authenticated;
