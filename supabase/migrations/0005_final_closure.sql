-- Migration 0005 — final closure pass II (corrective, additive).
--
-- Closes the last release-blocking security gaps:
--
--   1. DIRECT ATTEMPTS WRITE BYPASS (release-blocking)
--      The owner INSERT policy on public.attempts let a signed-in user insert
--      rows with arbitrary integrity='ranked' AND ranked_accepted=true —
--      instantly publishing forged leaderboard entries and bypassing the
--      authoritative submit_attempt RPC entirely.
--      submit_attempt() is now the ONLY authenticated write path into
--      official attempts; bulk local-history import moves to a dedicated
--      SECURITY DEFINER RPC that can NEVER produce ranked rows.
--
--   2. OFFICIAL RANKED EXERCISE BINDING
--      Ranked eligibility now additionally requires that the attempt's
--      exercise identity matches a canonical server-known configuration
--      (exercise id family, language, duration allowlist, version). Self-
--      consistent fabricated evidence for unknown exercises (friend-*, mp-*,
--      assignment:*, career-*, custom-*) is demoted to practice with an
--      explicit reason instead of ranking.
--
--   3. FRIEND CHALLENGE RESULT TRUST
--      Direct world INSERT into friend_challenge_results is replaced by a
--      rate-limited RPC validating challenge existence/expiry, sanitizing
--      display names, preferring server-derived metrics from evidence
--      counts, bounding values, and capping per-challenge spam.
--
--   4. ASSESSMENT INVITE LIFECYCLE
--      Adds opens_at / revoked state so candidate invites distinguish
--      available / not-yet-open / expired / REVOKED, plus an owner-only
--      revoke RPC.

-- ---------------------------------------------------------------------------
-- 1a. Close direct client writes into attempts
-- ---------------------------------------------------------------------------
drop policy if exists "attempts own insert" on public.attempts;
revoke insert, update on public.attempts from anon;
revoke insert, update on public.attempts from authenticated;

-- Defense-in-depth: every other table whose writes are RPC-mediated loses its
-- raw DML grants as well (RLS already denies, this makes intent explicit).
revoke insert on public.friend_challenge_results from anon, authenticated;
revoke insert on public.rooms from anon, authenticated;
revoke insert, update on public.room_results from anon, authenticated;
revoke insert, update on public.team_members from anon, authenticated;
revoke insert on public.assignment_completions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1b. Controlled bulk import of anonymous local history (never ranked)
--
-- Replaces the old direct .from("attempts").insert() used by one-shot account
-- migration. The server recomputes derived metrics from evidence, forces
-- integrity to practice/flagged, forces ranked_accepted=false, and is both
-- batch-capped and rate-limited. Idempotent via (user_id, client_id).
-- ---------------------------------------------------------------------------
create or replace function public.migrate_local_history(p_items jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  v_typed int; v_correct int; v_elapsed int; v_dur int;
  v_wpm numeric; v_acc numeric;
  v_paste boolean; v_burst boolean;
  inserted int := 0;
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  if not public.bump_rate_limit('migrate:' || uid::text, 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_batch';
  end if;
  if jsonb_array_length(p_items) > 200 then raise exception 'batch_too_large'; end if;

  for item in select jsonb_array_elements(p_items) loop
    v_typed   := coalesce((item->>'typed_chars')::int, -1);
    v_correct := coalesce((item->>'correct_chars')::int, -1);
    v_elapsed := coalesce((item->>'elapsed_ms')::int, -1);
    v_dur     := coalesce((item->>'duration_sec')::int, -1);
    v_paste   := coalesce((item->>'paste_flag')::boolean, false);
    v_burst   := coalesce((item->>'burst_flag')::boolean, false);

    -- Structural validation only: garbage is skipped, never trusted.
    if coalesce(item->>'client_id','') = ''
       or coalesce(item->>'exercise_id','') = ''
       or coalesce(item->>'mode','') not in ('sprint','copy-pro','dictation','transcription','numbers','punctuation','daily','career','custom-practice')
       or coalesce(item->>'language','') not in ('en','id')
       or v_dur < 5 or v_dur > 900
       or v_elapsed < 0 or v_elapsed > 960000
       or v_typed < 0 or v_typed > 20000
       or v_correct > v_typed then
      continue;
    end if;

    if v_elapsed > 500 and v_typed >= 5 then
      v_wpm := round((v_typed::numeric / 5) / (v_elapsed / 60000.0), 1);
      v_acc := round((v_correct::numeric / v_typed) * 100, 1);
    else
      v_wpm := 0; v_acc := 0;
    end if;

    -- Imported history is NEVER ranked — no exceptions.
    insert into public.attempts (
      user_id, client_id, exercise_id, exercise_version, scoring_version,
      normalization_version, mode, language, duration_sec, elapsed_ms,
      typed_chars, uncorrected_errors, wpm, accuracy, integrity,
      challenge_date, challenge_version, ranked_accepted, metrics)
    values (
      uid,
      left(item->>'client_id', 80),
      left(coalesce(item->>'exercise_id','imported'), 120),
      coalesce(left(item->>'exercise_version', 16), 'imported'),
      coalesce(left(item->>'scoring_version', 16), 'imported'),
      left(item->>'normalization_version', 16),
      item->>'mode',
      item->>'language',
      v_dur, v_elapsed, v_typed,
      greatest(0, coalesce((item->>'uncorrected_errors')::int, 0)),
      v_wpm, least(v_acc, 100),
      case when v_paste or v_burst then 'flagged' else 'practice' end,
      null, null, false,
      coalesce(item->'metrics', '{}'::jsonb))
    on conflict (user_id, client_id) do nothing;
    if found then inserted := inserted + 1; end if;
  end loop;
  return inserted;
end; $$;
grant execute on function public.migrate_local_history(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Official ranked exercise binding
--
-- Ranked eligibility requires a canonical exercise identity. Two families are
-- official today:
--   live product ids : {mode}-{lang}-{duration}-{sessionSeed}
--                      e.g. sprint-en-30-7, copy-pro-id-60-12
--   corpus registry  : {lang}-{family}-NNN
--                      e.g. en-sprint-001, id-numbers-004
-- Daily ids bind to the product date (date/version enforced elsewhere);
-- audio clips use dict/trans families. Everything else (friend-*, mp-*,
-- assignment:*, career-*, custom-*, assess-*) persists as practice/flagged
-- but can never enter official ranked boards.
-- ---------------------------------------------------------------------------
create or replace function public.is_official_ranked_config(
  p_mode text, p_lang text, p_dur int, p_exercise_id text, p_version text)
returns boolean language sql immutable as $$
  select case
    when p_version not in ('v2', 'v3') then false
    when p_mode in ('sprint', 'copy-pro', 'numbers') then
      p_dur = any(array[15, 30, 60, 120, 300])
      and (
        p_exercise_id ~ '^[a-z0-9-]+-(en|id)-(15|30|60|120|300)-[0-9]{1,6}$'
        or p_exercise_id ~ '^(en|id)-(sprint|copypro|numbers|punct)-[0-9]{3}$'
      )
    when p_mode = 'daily' then
      p_dur between 15 and 300
      and p_exercise_id ~ '^daily-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    when p_mode = 'dictation' then
      p_exercise_id ~ '^dict-(en|id)-[0-9]{3}$' and p_dur between 30 and 120
    when p_mode = 'transcription' then
      p_exercise_id ~ '^trans-(en|id)-[0-9]{3}$' and p_dur between 30 and 600
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Friend challenge result submission through a validated RPC
-- ---------------------------------------------------------------------------
create or replace function public.submit_friend_result(
  p_challenge_id text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_exists boolean;
  v_rows int;
  v_typed int; v_correct int; v_elapsed int;
  v_wpm numeric; v_acc numeric;
begin
  if not public.bump_rate_limit(
       'friendresult:' || coalesce(auth.uid()::text, left(coalesce(p->>'display_name','anon'),40)),
       20, interval '1 hour') then
    raise exception 'rate_limited';
  end if;

  select true into v_exists from public.friend_challenges c
  where c.id = upper(btrim(coalesce(p_challenge_id, '')))
    and c.expires_at > now();
  if v_exists is null then raise exception 'challenge_not_found_or_expired'; end if;

  select count(*) into v_rows from public.friend_challenge_results
  where challenge_id = upper(btrim(p_challenge_id));
  if v_rows >= 500 then raise exception 'challenge_full'; end if;

  v_typed   := coalesce((p->>'typed_chars')::int, -1);
  v_correct := coalesce((p->>'correct_chars')::int, -1);
  v_elapsed := coalesce((p->>'elapsed_ms')::int, -1);

  if v_typed >= 0 then
    -- Preferred path: derive metrics from evidence counts.
    if v_typed > 20000 or v_correct < 0 or v_correct > v_typed
       or v_elapsed < 1000 or v_elapsed > 960000 then
      raise exception 'invalid_evidence';
    end if;
    v_wpm := round((v_typed::numeric / 5) / (v_elapsed / 60000.0), 1);
    v_acc := round((v_correct::numeric / v_typed) * 100, 1);
    if v_wpm > 220 then raise exception 'implausible_result'; end if;
  else
    -- Casual fallback (no evidence available): bounded claims only.
    v_wpm := least(greatest(coalesce((p->>'claimed_wpm')::numeric, 0), 0), 220);
    v_acc := least(greatest(coalesce((p->>'claimed_accuracy')::numeric, 0), 0), 100);
  end if;

  insert into public.friend_challenge_results
    (challenge_id, user_id, display_name, wpm, accuracy)
  values (
    upper(btrim(p_challenge_id)),
    auth.uid(),
    left(regexp_replace(coalesce(p->>'display_name','guest'), '[^[:alnum:] _\-.]', '', 'g'), 24),
    round(v_wpm, 1), round(v_acc, 1));

  return jsonb_build_object('accepted', true, 'wpm', round(v_wpm,1), 'accuracy', round(v_acc,1));
end; $$;
grant execute on function public.submit_friend_result(text, jsonb) to anon, authenticated;

drop policy if exists "results world insert" on public.friend_challenge_results;

-- ---------------------------------------------------------------------------
-- 4. Assessment invite lifecycle: opens_at + revoked + owner revoke RPC
-- ---------------------------------------------------------------------------
alter table public.assessments
  add column if not exists opens_at timestamptz,
  add column if not exists revoked boolean not null default false;

-- Owner-only invite revocation (no general UPDATE policy is granted).
create or replace function public.revoke_assessment_invite(p_assessment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign_in_required'; end if;
  update public.assessments set revoked = true
  where id = coalesce(p_assessment_id, gen_random_uuid()) and owner_id = uid;
  if not found then raise exception 'not_found_or_not_owner'; end if;
end; $$;
grant execute on function public.revoke_assessment_invite(uuid) to authenticated;

-- Candidate definition fetch distinguishes all four lifecycle states.
drop function if exists public.fetch_assessment_definition(text);
create or replace function public.fetch_assessment_definition(p_invite text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  r record;
begin
  select title, modules, opens_at, revoked,
         created_at + make_interval(hours => window_hours) as expires_at
    into r
  from public.assessments where invite_code = upper(btrim(coalesce(p_invite, '')));
  if r is null then raise exception 'invite_invalid'; end if;
  if r.revoked then raise exception 'invite_revoked'; end if;
  if r.opens_at is not null and r.opens_at > now() then raise exception 'invite_not_open'; end if;
  if r.expires_at <= now() then raise exception 'invite_expired'; end if;
  return jsonb_build_object('title', r.title, 'modules', r.modules,
    'opens_at', r.opens_at, 'expires_at', r.expires_at);
end; $$;
grant execute on function public.fetch_assessment_definition(text) to anon, authenticated;

-- Candidate submission enforces the same lifecycle.
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
    and revoked = false
    and (opens_at is null or opens_at <= now())
    and created_at + make_interval(hours => window_hours) > now();
  if aid is null then raise exception 'invite_invalid_expired_or_revoked'; end if;

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

-- ---------------------------------------------------------------------------
-- 5. submit_attempt: enforce official ranked binding + close legacy paths
--    (replaces the 0004 body; signature unchanged)
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

  -- Idempotency fast-path: report the STORED verdict; never re-insert.
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

  if p ? 'claimed_wpm' and (p->>'claimed_wpm')::numeric > 0 and v_wpm > 0
     and abs((p->>'claimed_wpm')::numeric - v_wpm) / v_wpm > 0.10 then
    v_reasons := v_reasons || array['wpm_mismatch'];
  end if;
  if p ? 'claimed_accuracy' and abs((p->>'claimed_accuracy')::numeric - v_acc) > 10 then
    v_reasons := v_reasons || array['accuracy_mismatch'];
  end if;

  if v_paste then v_reasons := v_reasons || array['paste']; end if;
  if v_burst then v_reasons := v_reasons || array['burst']; end if;
  if v_wpm > 220 then v_reasons := v_reasons || array['implausible_speed']; end if;

  if v_mode = 'daily' then
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

  -- OFFICIAL RANKED BINDING: only canonical server-known exercise
  -- configurations may rank; everything else is demoted with an explicit
  -- reason. Career/custom-practice modes can never rank by policy.
  if v_ranked then
    if v_mode in ('career', 'custom-practice')
       or not public.is_official_ranked_config(
            v_mode, v_lang, v_dur, coalesce(p->>'exercise_id', ''),
            coalesce(p->>'exercise_version', 'v3')) then
      v_reasons := v_reasons || array['unofficial_exercise'];
      v_integrity := 'practice';
      v_ranked := false;
    end if;
  end if;

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
      return jsonb_build_object('accepted', v_ranked, 'integrity', v_integrity,
        'duplicate', true, 'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(v_reasons));
  end;

  return jsonb_build_object('accepted', v_ranked, 'integrity', v_integrity, 'duplicate', false,
    'wpm', v_wpm, 'accuracy', v_acc, 'reasons', to_jsonb(v_reasons));
end; $$;

grant execute on function public.submit_attempt(jsonb) to authenticated;
