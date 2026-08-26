-- Migration 0006 — closure pass IV: career assignments, room cancellation,
-- assessment result identity binding.
--
--   1. CAREER ASSIGNMENT COMPLETION
--      complete_assignment now binds kind='career' assignments to the
--      canonical career attempt identity ('career:{trackId}') so classrooms
--      can assign full Career tracks with server-derived scores, matching the
--      single-exercise kinds.
--
--   2. ROOM CANCELLATION (host authority)
--      close_room(code, host_token) lets ONLY the creator end a stale/abandoned
--      race: state -> 'finished', ends_at -> now(). Subsequent finish attempts
--      are rejected by the existing race-state guard. Rate-limited.
--
--   3. ASSESSMENT RESULT IDENTITY BINDING
--      submit_assessment_result no longer accepts arbitrary module payloads:
--      each submitted module must match the DEFINITION's kind + ref at the
--      same position (order preserved), closing payload-shuffling/forgery.

-- ---------------------------------------------------------------------------
-- 1. Career-kind exercise binding in complete_assignment
-- ---------------------------------------------------------------------------
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

  if a.kind = 'career' then
    -- Career tracks persist one aggregated attempt with the canonical
    -- 'career:{trackId}' exercise identity.
    v_expected_exercise := 'career:' || coalesce(a.payload->>'ref', '');
  elsif a.payload ? 'ref' and coalesce(a.payload->>'ref', '') <> '' then
    v_expected_exercise := 'assignment:' || a.kind || ':' || (a.payload->>'ref')
      || ':' || coalesce(a.payload->>'language', 'en');
  end if;

  if v_expected_exercise is not null and att.exercise_id <> v_expected_exercise then
    raise exception 'attempt_mismatch';
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

-- ---------------------------------------------------------------------------
-- 2. Host-only room cancellation
-- ---------------------------------------------------------------------------
create or replace function public.close_room(p_code text, p_host_token text)
returns void language plpgsql security definer set search_path = public as $$
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

-- ---------------------------------------------------------------------------
-- 3. Assessment results must match the definition's module identities IN ORDER
-- ---------------------------------------------------------------------------
create or replace function public.submit_assessment_result(p jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  aid uuid;
  v_def jsonb;
  v_count int;
  m jsonb;
  d jsonb;
  i int := 0;
begin
  if not public.bump_rate_limit('assess:' || coalesce(auth.uid()::text, p->>'candidate_key','x'), 10, interval '1 hour') then
    raise exception 'rate_limited';
  end if;
  select id, modules, jsonb_array_length(modules) into aid, v_def, v_count
  from public.assessments
  where invite_code = upper(btrim(coalesce(p->>'invite_code','')))
    and revoked = false
    and (opens_at is null or opens_at <= now())
    and created_at + make_interval(hours => window_hours) > now();
  if aid is null then raise exception 'invite_invalid_expired_or_revoked'; end if;

  if p->'results'->'modules' is null
     or jsonb_typeof(p->'results'->'modules') <> 'array'
     or jsonb_array_length(p->'results'->'modules') <> v_count then
    -- The submission must describe EXACTLY the defined modules — none may be
    -- skipped and none may be invented.
    raise exception 'invalid_results';
  end if;

  -- Identity + order binding: submitted module[i] must carry the same kind
  -- AND ref as definition module[i].
  for m in select jsonb_array_elements(p->'results'->'modules') loop
    d := v_def -> i;
    if coalesce(m->>'kind','') <> coalesce(d->>'kind','')
       or coalesce(m->>'ref','')  <> coalesce(d->>'ref','') then
      raise exception 'invalid_results';
    end if;
    if coalesce((m->>'wpm')::numeric, -1) < 0 or coalesce((m->>'wpm')::numeric, -1) > 300
       or coalesce((m->>'accuracy')::numeric, -1) < 0 or coalesce((m->>'accuracy')::numeric, -1) > 100 then
      raise exception 'invalid_results';
    end if;
    i := i + 1;
  end loop;

  insert into public.assessment_results (assessment_id, candidate_key, label, results, integrity_flags)
  values (aid, left(coalesce(p->>'candidate_key','x'), 40),
          left(regexp_replace(coalesce(p->>'label','candidate'), '[^[:alnum:] _\-]', '', 'g'), 40),
          p->'results',
          coalesce((select array_agg(x::text) from jsonb_array_elements_text(coalesce(p->'flags','[]'::jsonb)) x), '{}'))
  on conflict (assessment_id, candidate_key) do nothing;
end; $$;
grant execute on function public.submit_assessment_result(jsonb) to anon, authenticated;
