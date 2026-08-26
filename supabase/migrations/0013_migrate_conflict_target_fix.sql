-- Migration 0013 — closure pass V: correct partial-index conflict target for
-- history migration.
--
-- attempts_user_client_uniq is a PARTIAL unique index
--   ... where client_id is not null
-- so ON CONFLICT inference requires the matching predicate; a bare column
-- list raises 'no unique or exclusion constraint matching the ON CONFLICT
-- specification' (caught by CI). Logic otherwise identical to 0005.

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

    -- Imported history is NEVER ranked — no exceptions. The conflict target
    -- carries the partial index's predicate so inference succeeds.
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
    on conflict (user_id, client_id) where client_id is not null do nothing;
    if found then inserted := inserted + 1; end if;
  end loop;
  return inserted;
end; $$;
grant execute on function public.migrate_local_history(jsonb) to authenticated;
