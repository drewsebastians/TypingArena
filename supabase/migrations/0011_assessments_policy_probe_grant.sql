-- Migration 0011 — closure pass V follow-up: invoker-privilege reads needed
-- by RLS policy evaluation.
--
-- RLS policy subqueries run with the INVOKER's privileges. The owner-only
-- policy on assessment_results references public.assessments, so anonymous
-- probes failed with 'permission denied for table assessments' even though
-- the result set would be empty. Granting SELECT lets policy evaluation run;
-- the policy itself still guarantees non-owners see zero rows.

grant select on public.assessments to anon;
