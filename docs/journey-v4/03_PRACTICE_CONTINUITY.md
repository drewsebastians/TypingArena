# Journey v4 — Practice Continuity

Status: COMPLETE—PROVEN

## Contract applied

Practice routes read as one family while preserving their existing engines, scoring, content, audio assets, and public paths. `PracticeFamilyNav` appears on typing, dictation, transcription, Career, and the transcription library.

During active practice, route-level guidance, SkillProfile, related tools, and ads are not competing with the task. `ActiveTaskBoundary` and the existing document exercise marker keep the active region clean. Ads remain outside active tasks and are available again after completion.

Typing results now have one continuation hierarchy:

- primary: Next exercise;
- secondary: Test your listening;
- tertiary: Share, Challenge friend, and Daily Arena;
- details: corrections and heatmap.

Weak-key copy is truthful: “These keys caused the most errors in this attempt.” Personal comparison appears only when a prior local result matches the same mode, language, and configured duration.

## Implementation

- `src/components/PracticeRoutePage.tsx` wires lifecycle state to the shared boundary and hides secondary route content while active.
- `src/components/TypingTestPanel.tsx` no longer renders the duplicate typing-parent `NextStepCard`.
- `src/components/ResultCard.tsx` owns the result action hierarchy and valid local comparison.
- Static Dictation and Transcription engines remain unchanged in their scoring and playback contracts; their existing next-clip continuation remains available.

## Proof

- The active-ad E2E covers typing, dictation, transcription, noise, and Daily Arena.
- Result CTA keyboard proof passes on desktop and mobile.
- Screenshots: `artifacts/journey-v4/after/typing-desktop-1440x900.png`, `typing-mobile-390x844.png`, `dictation-desktop-1440x900.png`, and `transcription-desktop-1440x900.png`.

