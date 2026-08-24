# ADR-003 — Scoring v2 semantics

**Status:** accepted (2026-08). Supersedes prototype scoring v1.

## Corrections over v1 (and why)

| Area | v1 behaviour | v2 behaviour |
|---|---|---|
| Timed tests | Ended when the passage was fully typed | Endless deterministic stream (`src/lib/stream.ts`); test ends only at the configured duration |
| Accuracy | `correct / max(targetLen, typedLen)` — untyped future text counted as errors | `correctChars / typedChars` over committed entries only |
| Error attribution | Positional char comparison; one insertion cascaded into phantom errors | Event-level entries + Wagner–Fischer alignment for final text (`src/lib/alignment.ts`) |
| Corrected vs uncorrected | Heuristic `min(backspaces, mismatches)` | Precise pairing: wrong entry removed by backspace = corrected; wrong entry remaining = uncorrected (`src/lib/corrections.ts`) |
| Correction latency | Time from previous key to backspace, narrow case | Time from creating the wrong entry to its removing backspace, plus immediate-correction and neutral-backspace distinctions |
| WPM | Single gross figure | Gross + net (uncorrected errors subtracted) + CPM |
| Dictation word accuracy | Positional words | Word-level alignment (drift-tolerant) |
| Punctuation | Not measured | Aligned punctuation accuracy (substituted-away or omitted marks count as misses) |

## Versioning contract

Every result records: exercise id+version, `scoringVersion`, normalization
version where relevant, language/mode/duration, and challenge date+version for
Daily Arena. Constants live in `src/lib/types.ts`. Changing semantics requires
bumping the constant so historical results remain interpretable (old rows keep
their old version strings).

## Formulas

- **Gross WPM** = typedChars / 5 / minutes(elapsedMs)
- **Net WPM** = max(0, typedChars − uncorrectedErrors) / 5 / minutes
- **Accuracy** = correctChars / typedChars × 100 (typed scope only)
- **Strict similarity** = alignedMatches / max(refLen, typedLen) × 100
- **Word accuracy** = alignedMatchedRefWords / refWords × 100 (optionally normalized first)
- **Punctuation accuracy** = reproducedRefMarks / refMarks × 100 (null if reference has none)
- **Replay ratio** = actualPlayedSeconds / realClipDuration (measured via media events; null until metadata loads)

## Integrity model (blueprint §13)

`ranked` → eligible for shared boards. `practice` → valid but excluded from
boards (e.g. one focus loss on a ≥20s test). `flagged` → paste, impossible
burst (>10 chars/400 ms), >2 focus losses, or challenge-metadata mismatch.
Client classification is duplicated by DB policy/views: only ranked rows are
publicly visible at all, and plausibility CHECKs bound fabricated values.
