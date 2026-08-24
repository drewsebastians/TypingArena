# ADR-002 — Product-day boundary (Daily Arena & streaks)

**Status:** accepted (2026-08)

## Decision

A **product day** is the calendar date in **Asia/Jakarta (UTC+7)**, which has no
daylight saving time. Implemented in `src/lib/datetime.ts` as pure offset math
(no `toLocaleDateString` dependence); mirrored in SQL via
`timestamptz` comparisons against the same fixed offset.

## Rationale

- Indonesia-first positioning (blueprint §32 option 3) while remaining
  deterministic for every other timezone.
- Fixed offsets are stable forever; named timezones in client JS depend on ICU
  data and can disagree with the database. Offset arithmetic cannot.
- Client (`arenaDateString`) and server (challenge_date column) always agree
  because both derive from UTC instants shifted by +7h.

## Rules encoded

- Daily Arena challenge for date D is selected by
  `dailySeed(D | CHALLENGE_VERSION)` — identical for all users worldwide.
- Streaks increment at most once per product day; any scored attempt in any
  mode qualifies; a gap of ≥2 product days resets to zero on next activity.
- Ranked daily attempts are unique per user per product day (partial unique
  index in the migration).
