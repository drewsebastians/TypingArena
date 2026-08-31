# Key page dependency trees

All entries inherit `src/app/layout.tsx` → `src/components/LocaleProvider.tsx`, `src/components/Header.tsx`, `src/components/ConsentBanner.tsx`, and `src/app/globals.css`. The trees below trace the principal local UI and domain dependencies for the ten pages most relevant to Goal-First and route-family design; browser-only providers and node_modules are omitted.

## `/` — Goal-First home

Entry: `src/app/page.tsx`

Dependencies:

- `src/components/goals/GoalGrid.tsx`
  - `src/components/goals/GoalCard.tsx`
  - `src/lib/goals.ts`
- `src/components/goals/GoalSummaryBar.tsx`
  - `src/lib/goals.ts`
- `src/components/TypingTestPanel.tsx`
  - `src/components/TypingEngine.tsx`
    - `src/lib/scoring.ts`
    - `src/lib/alignment.ts`
    - `src/lib/corrections.ts`
    - `src/lib/integrity.ts`
    - `src/lib/history.ts`
    - `src/lib/sync.ts`
  - `src/components/ResultCard.tsx`
    - `src/components/ErrorHeatmap.tsx`
    - `src/lib/analytics.ts`
    - `src/lib/integrity.ts`
  - `src/components/tool/NextStepCard.tsx`
    - `src/lib/analytics.ts`
  - `src/lib/content/english.ts`
  - `src/lib/content/indonesian.ts`
- `src/components/DictationPanel.tsx`
  - `src/components/DictationEngine.tsx`
    - `src/lib/audioMetrics.ts`
    - `src/lib/scoring.ts`
    - `src/lib/history.ts`
    - `src/lib/sync.ts`
  - `src/components/tool/NextStepCard.tsx`
  - `src/lib/content/dictation.ts`
- `src/components/TranscriptionPanel.tsx`
  - `src/components/TranscriptionEngine.tsx`
    - `src/lib/audioMetrics.ts`
    - `src/lib/scoring.ts`
    - `src/lib/history.ts`
    - `src/lib/sync.ts`
  - `src/components/tool/NextStepCard.tsx`
  - `src/lib/content/dictation.ts`
- `src/components/tool/ActiveTaskBoundary.tsx`
  - `src/lib/taskLifecycle.ts`
- `src/components/AdSlot.tsx`
  - `src/components/tool/ActiveTaskBoundary.tsx`
  - `src/lib/config.ts`
- `src/components/LocaleProvider.tsx`
  - `src/lib/i18n.ts`
- `src/lib/analytics.ts`

## `/typing-test` — typing acquisition

Entry: `src/app/typing-test/page.tsx`

Dependencies:

- `src/components/TypingTestPanel.tsx`
  - `src/components/TypingEngine.tsx`
  - `src/components/ResultCard.tsx`
  - `src/components/tool/NextStepCard.tsx`
  - `src/lib/content/english.ts`
  - `src/lib/content/indonesian.ts`
- `src/components/SkillProfile.tsx`
  - `src/lib/history.ts`
  - `src/lib/skillMatrix.ts`
  - `src/lib/analytics.ts`
- `src/components/AdSlot.tsx`

## `/dictation` — audio acquisition

Entry: `src/app/dictation/page.tsx`

Dependencies:

- `src/components/DictationPanel.tsx`
  - `src/components/DictationEngine.tsx`
  - `src/components/tool/NextStepCard.tsx`
  - `src/lib/content/dictation.ts`
- `src/components/SkillProfile.tsx`
- `src/components/AdSlot.tsx`

## `/transcription-practice` — transcription active task

Entry: `src/app/transcription-practice/page.tsx`

Dependencies:

- `src/components/tool/ToolPageShell.tsx`
- `src/components/TranscriptionPanel.tsx`
  - `src/components/TranscriptionEngine.tsx`
  - `src/components/tool/NextStepCard.tsx`
  - `src/lib/content/dictation.ts`
- `src/components/AdSlot.tsx`
- `src/components/tool/RelatedTools.tsx`
  - `src/lib/routeRegistry.ts`

## `/transcription-library` — discovery/filtering

Entry: `src/app/transcription-library/page.tsx`

Dependencies:

- `src/components/TranscriptionLibraryPanel.tsx`
  - `src/components/TranscriptionEngine.tsx`
  - `src/lib/content/dictation.ts`
  - `src/lib/i18n.ts`
  - `src/lib/analytics.ts`

## `/career` — five-track practice benchmark

Entry: `src/app/career/page.tsx`

Dependencies:

- `src/components/CareerPanel.tsx`
  - `src/components/TypingEngine.tsx`
  - `src/components/DictationEngine.tsx`
  - `src/components/TranscriptionEngine.tsx`
  - `src/lib/career.ts`
  - `src/lib/content/english.ts`
  - `src/lib/content/indonesian.ts`
  - `src/lib/content/dictation.ts`
  - `src/lib/history.ts`
  - `src/lib/i18n.ts`
  - `src/components/AdSlot.tsx`

## `/daily-arena` — shared daily challenge

Entry: `src/app/daily-arena/page.tsx`

Dependencies:

- `src/components/TypingEngine.tsx`
- `src/components/DictationPanel.tsx`
  - `src/components/DictationEngine.tsx`
- `src/lib/daily.ts`
- `src/lib/datetime.ts`
- `src/lib/remote.ts`
- `src/lib/sync.ts`
- `src/lib/config.ts`
- `src/lib/analytics.ts`

## `/leaderboard` — accepted standings

Entry: `src/app/leaderboard/page.tsx`

Dependencies:

- `src/lib/remote.ts`
- `src/lib/config.ts`
- `src/lib/history.ts`
- `src/lib/analytics.ts`

## `/progress` — private local history

Entry: `src/app/progress/page.tsx`

Dependencies:

- `src/components/tool/ToolPageShell.tsx`
- `src/components/PrivacyPanel.tsx`
  - `src/lib/history.ts`
  - `src/lib/sync.ts`
  - `src/lib/analytics.ts`
- `src/components/AdSlot.tsx`
- `src/lib/skillMatrix.ts`
- `src/lib/nickname.ts`
- `src/lib/remote.ts`
- `src/lib/sync.ts`
- `src/lib/config.ts`
- `src/lib/i18n.ts`

## `/teams` — creator/member workspace

Entry: `src/app/teams/page.tsx`

Dependencies:

- `src/components/TeamsPanel.tsx`
  - `src/lib/remote.ts`
  - `src/lib/resourceAccess.ts`
  - `src/lib/nickname.ts`
  - `src/lib/analytics.ts`
  - `src/lib/config.ts`
  - `src/components/TypingEngine.tsx`
  - `src/components/AdSlot.tsx`

## Representative route-family siblings

The typing siblings (`/typing-test/1-minute`, `/typing-test/5-minute`, `/typing-test/indonesian`, `/tes-mengetik`, `/data-entry-test`, `/punctuation-typing-test`) reuse `TypingTestPanel`, `TypingEngine`, `ResultCard`, `SkillProfile`, and `AdSlot` with route-specific presets/metadata. Dictation language siblings reuse `DictationPanel` with locked language. `/noise-challenge` uses `DictationEngine`; `/custom` and `/assessments` use their creator/candidate panels and `resourceAccess`/`remote` adapters.
