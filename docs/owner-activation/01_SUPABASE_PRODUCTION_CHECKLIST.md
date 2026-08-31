# Production Supabase Checklist

This is an owner-run, potentially mutating procedure. It is not executed by
the independent review.

## Prerequisites

- Owner access to the intended Supabase project and its project ref.
- Confirmed staging/production identity and a current backup/snapshot policy.
- Approval to apply the additive migration chain `0001` through `0016`.
- Final HTTPS site origin, Auth redirect/origin policy, and a rollback owner.

## Procedure

1. Capture the project ref, region, environment label, and current migration
   history. In the Supabase dashboard, export/confirm a backup where the plan
   supports it.
2. From a clean checkout, link without exposing credentials:

   ```bash
   supabase link --project-ref <project-ref>
   supabase migration list
   ```

3. Verify the target does not contain unexpected application migrations. With
   owner approval, apply the additive chain:

   ```bash
   supabase db push
   supabase migration list
   ```

4. In Supabase Auth, enable Anonymous Sign-Ins. Set the Site URL and allowed
   redirect/origin entries to the exact HTTPS deployment origin.
5. Verify RLS is enabled and the public RPC/view surface matches the migration
   contract: server-authoritative `submit_attempt`, scoped management
   capabilities, accepted-only public boards, and no `user_id` column in
   `public_leaderboard` or `public_daily_board`.
6. Confirm `purge_expired()` is callable only by the intended operator and is
   scheduled by the chosen approved scheduler. The migrations provide the
   function; scheduling is an owner infrastructure decision.
7. If tournaments/Edge Functions are not in launch scope, leave them disabled
   and record that decision. If they are in scope, verify their separate key,
   CORS, rate-limit, and least-privilege configuration before use.

## Expected evidence

Migration list showing `0001`–`0016`, Auth settings, origin settings, a
redacted RLS/function verification result, purge schedule, and a hosted
shared-flow smoke result. Do not attach bearer capability fragments or raw
service credentials.

## Failure and rollback

Stop if the migration history is unexpected, the push reports a destructive or
non-additive operation, RLS/function verification fails, or Auth origin does
not match hosting. Do not reset a live database. Preserve logs and use a
forward corrective migration or restore the approved backup under the owner's
incident process.

## Mutation and approval

`supabase db push`, Auth changes, scheduler changes, and any production SQL
mutate production and require owner approval. Read-only dashboard inspection
and `supabase migration list` do not mutate data.
