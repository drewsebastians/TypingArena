-- Migration 0010 — closure pass V follow-up: anonymous probe of assessment
-- results must resolve through RLS (returning zero rows) instead of failing
-- at the grant layer. The owner-only RLS policy guarantees non-owners see
-- nothing; this grant only lets the empty-set proof execute.

grant select on public.assessment_results to anon;
