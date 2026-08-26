-- Migration 0009 — closure pass V follow-up: owner-read grant for
-- assessment results (caught by CI: owner dashboard query failed at the
-- GRANT layer before RLS could scope it to owned rows).

grant select on public.assessment_results to authenticated;
