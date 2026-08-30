# Anonymous identity and capability DB evidence

> Historical preparation evidence: run `33312001583` predates migration
> `0016_public_board_privacy.sql`. The final-head DB proof and exact current
> workflow ID are maintained in `docs/closure/PR4_FINAL_INDEPENDENT_REVIEW.md`;
> this file is retained for provenance, not as the final-head authority.

## Execution

- Workflow: `Backend integration (local Supabase)`
- PR: [#4](https://github.com/drewsebastians/TypingArena/pull/4)
- Run: [33312001583](https://github.com/drewsebastians/TypingArena/actions/runs/33312001583)
- Migration reset: PASS, migrations `0001` through `0015` applied from a fresh local stack (historical; final chain is through `0016`).
- Runner: GitHub Actions Ubuntu runner with Docker and Supabase CLI.
- Result: **117 passed, 0 failed**.

## Proven assertions

- Anonymous direct `attempts` inserts denied.
- Valid evidence accepted as ranked through `submit_attempt`.
- WPM and accuracy recomputed server-side from counts.
- Forged 250 WPM claims demoted and hidden from public boards.
- Official exercise and Daily date binding preserved.
- Duplicate client IDs remain idempotent.
- Anonymous-style identities have no email.
- Shared bootstrap stores a nickname.
- Capability tokens have high entropy and are returned only at issue time.
- Only SHA-256-sized capability hashes are stored.
- Authenticated clients cannot read capability rows.
- Capability type/resource scope cannot cross team, custom, or assessment resources.
- Non-owners cannot issue management capabilities.
- Valid capabilities recover exactly their named resource.
- Recovery transfers only the named resource and invalidates the previous capability.
- Rotation revokes the previous capability; owner revocation invalidates the active capability.
- Direct team roster/role escalation and completion forgery are denied.
- Assignment completions require the real matching attempt and derive score fields.
- Assessment invite order/identity, expiry, revocation, and private-result boundaries hold.
- Shared deletion cascades owned resources and the anonymous auth user under the tested deletion contract.
- Friend, team, assignment, assessment, and multiplayer trust-boundary regressions remain green.

## Local limitation

The workstation does not have Docker or the Supabase CLI, so the same scenarios cannot be run locally. The GitHub Actions run above is the authoritative real-database proof for the final pushed closure. Hosted production migration/application remains an owner-controlled external action.
