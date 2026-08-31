-- Migration 0016 — public board privacy boundary.
--
-- Public leaderboards need a stable row key and display nickname, not an
-- auth.users UUID. The client previously used a user_id prefix as a fallback
-- when a profile was absent, which contradicted the no-contact/no-UUID UI
-- contract. Drop and recreate the views because CREATE OR REPLACE VIEW cannot
-- remove a column from an existing view definition.

drop view if exists public.public_leaderboard;
create view public.public_leaderboard
with (security_invoker = false) as
  select a.id, p.username, a.mode, a.language, a.duration_sec,
         a.wpm, a.accuracy, a.created_at as scored_at
  from public.attempts a
  left join public.profiles p on p.id = a.user_id
  where a.integrity = 'ranked' and a.ranked_accepted = true;
grant select on public.public_leaderboard to anon, authenticated;

drop view if exists public.public_daily_board;
create view public.public_daily_board
with (security_invoker = false) as
  select a.id, p.username, a.challenge_date, a.wpm, a.accuracy,
         a.created_at as scored_at
  from public.attempts a
  left join public.profiles p on p.id = a.user_id
  where a.integrity = 'ranked'
    and a.ranked_accepted = true
    and a.challenge_date is not null;
grant select on public.public_daily_board to anon, authenticated;
