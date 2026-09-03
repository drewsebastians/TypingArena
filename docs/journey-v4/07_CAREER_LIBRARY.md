# Journey v4 — Career and Library

Status: COMPLETE—PROVEN for local flows

## Contract applied

Career remains a practice benchmark, not certification. Its five existing tracks, real sequential modules, transparent scoring, local history, and static audio remain intact. After a result, the lowest-accuracy module gets a truthful “Recommended focus” continuation to the appropriate existing skill route.

The Transcription Library remains filterable and browsable. It now shares the Practice family bar in both list and active-clip views; selecting a clip still launches the existing full transcription engine and static asset.

## Implementation

- `src/app/career/page.tsx` adds the Practice family navigation.
- `src/components/CareerPanel.tsx` adds the weakest-module continuation and `career_weak_skill_clicked` event without changing scoring.
- `src/components/TranscriptionLibraryPanel.tsx` adds shared navigation to list/active views.

## Proof

- E2E verifies all five career tracks are present and the real runner is startable.
- E2E verifies the library remains filterable across English/Indonesia and keeps its clip count contract.
- Evidence: `artifacts/journey-v4/after/transcription-desktop-1440x900.png` and `assessments-desktop-1440x900.png`.

