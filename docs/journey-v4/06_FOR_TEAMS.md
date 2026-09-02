# Journey v4 — For Teams and Assessments

Status: IMPLEMENTED—PROOF PENDING for live backend paths

## Contract applied

For Teams is a shared family with Teams, Custom Tests, and Assessments. The Teams landing flow is ordered Join a team → Your teams → Create a team. Team rows make Open the primary action; management-link, revoke, leave, and delete actions are inside Settings.

Team detail retains the existing real assignment engine and server completion binding while exposing Overview, Assignments, Members, Results, and Settings tabs. Settings contains rare management and membership actions; backend permissions remain the final authority.

Assessment candidates now follow validate invite → lightweight intro → Begin → exact saved module sequence → submit/done. The intro shows title, module count, safe approximate duration, and results-sharing expectations. It does not add marketing or a second module definition.

## Implementation

- `src/components/TeamsPanel.tsx` implements the landing order and detail tabs without changing the remote RPC/data contracts.
- `src/components/AssessmentsPanel.tsx` adds the candidate intro state and `assessment_begin_clicked` event; exact saved modules still come from `fetchAssessmentDefinition`.
- `src/components/FeaturePageShell.tsx` and `src/components/TeamsNav.tsx` provide the shared family navigation.
- PII-safe journey instrumentation includes `teams_intent_selected`; analytics filtering still removes identifiers, secrets, codes, and content.

## Proof and boundary

- Teams and Assessments public route rendering, responsive fit, auth-control absence, and static build gates pass in the configured-backend-off environment.
- Live create/join/assignment/assessment flows require the shared backend configuration and were not fabricated or mutated during this run. Those paths remain `IMPLEMENTED—PROOF PENDING` until exercised against the owner’s deployment.
- Evidence: `artifacts/journey-v4/after/teams-desktop-1440x900.png` and `assessments-desktop-1440x900.png`.

