# Final Security Review

## Decision

Application security closure is COMPLETE — PROVEN for the repository and the
fresh database integration path through migration 0016. A hosted production
security smoke is EXTERNAL ACTION REQUIRED because no staging/production URL or
credentials were provided to this workspace.

## Proven controls

| Boundary | Control | Evidence |
| --- | --- | --- |
| Identity | Anonymous Supabase identity is created only for an explicit shared action; ordinary local practice does not bootstrap it. | `src/lib/remote.ts`, `src/lib/sync.ts`, privacy/progress E2E |
| Ranked writes | `submit_attempt()` is the authoritative write path; server derives WPM/accuracy and integrity from compact evidence. | DB integration: valid evidence ranked, forged 250 WPM rejected/hidden, direct writes denied |
| Daily binding | Challenge date/version and one-ranked-entry-per-day rules are enforced server-side; duplicate client id is idempotent. | DB integration Daily assertions |
| Public views | Leaderboard and Daily board expose only server-accepted public rows and no auth UUID column; unconfigured deployments show a setup notice, never fake competitors. | migration `0016_public_board_privacy.sql`, `src/lib/remote.ts`, DB assertion, leaderboard/Daily E2E |
| Capability links | High-entropy token is returned only on issuance; only SHA-256-sized digest is stored; clients cannot read capability rows; rotation/revoke invalidates older links. | DB integration capability assertions |
| Resource scope | Capability type/resource scope and owner checks prevent cross-resource access or non-owner issuance. | DB integration scope/owner assertions |
| Teams | Membership, role escalation, assignment completion, and forged completion attempts are rejected or silently denied by policy/RPC. | DB integration team/assignment assertions |
| Assessments | Saved module order is exact; candidate result is bound to the invite and private to the organizer; invalid/expired/revoked/private cases are covered. | DB integration assessment assertions |
| Multiplayer | Host token hash, start/rematch/cancel authority, evidence-bound results, and room lifecycle are tested. | DB integration multiplayer assertions |
| Privacy | Device history can be exported/deleted separately from shared data; analytics is consent-gated and answer text is not captured. | `PrivacyPanel`, analytics adapter, unit/E2E checks |
| Runtime | Static production bundle has no runtime AI/TTS endpoint or speech synthesis dependency. | CI bundle guard + final local bundle scan |

## Database proof record

The historical GitHub Actions backend integration run `33312001583` reset a
fresh stack through migrations 0001–0015 and is retained as provenance. The
final-head integration run through migration 0016 is the authoritative result
listed in `PR4_FINAL_INDEPENDENT_REVIEW.md`; it adds public-board column
privacy, malformed/cross-resource/expiry capability checks, raw-token storage
checks, and shared-data deletion assertions.

## Residual risks and owner actions

- Anti-cheat signals are heuristic integrity checks, not formal proctoring.
- Anonymous identities are not a substitute for account recovery; capability
  URLs must be treated as bearer keys and kept private.
- Production must enable anonymous sign-ins, apply migrations in order, set RLS
  policies, rotate exposed operational keys, and run the hosted smoke script.
- Rate limits, auth configuration, provider retention, and CORS/site URL need a
  final check in the actual Supabase project.

No unresolved code-level security blocker was found in the available evidence.
