# Extractable Superdesign components

## Layout components

### Header

- Source: `src/components/Header.tsx`
- Category: layout
- Description: Sticky bilingual global navigation with desktop route groups, mobile modal drawer, streak indicator, and locale switch.
- Extractable props: active route (derived from pathname), locale, drawer state.
- Hardcoded: TypingArena brand mark, navigation group labels, 44px control geometry, focus-trap behavior, Tailwind styles.

### ToolPageShell

- Source: `src/components/tool/ToolPageShell.tsx`
- Category: layout
- Description: Shared content-width wrapper with eyebrow, H1, description, and content rhythm.
- Extractable props: eyebrow, title, description, width.
- Hardcoded: max-width choices, gutters, typography, spacing classes.

### ActiveTaskBoundary

- Source: `src/components/tool/ActiveTaskBoundary.tsx`
- Category: layout
- Description: Provides active-task context and document state used by chrome and advertising boundaries.
- Extractable props: active, state, className.
- Hardcoded: `data-exercise-active`, task-state data attribute, React context behavior.

### ResultSection

- Source: `src/components/tool/ResultSection.tsx`
- Category: layout
- Description: Accessible result container with stable heading hierarchy.
- Extractable props: title, children, className.
- Hardcoded: border/card treatment and result heading id.

## Basic/reusable product components

### GoalGrid / GoalCard / GoalSummaryBar

- Source: `src/components/goals/GoalGrid.tsx`, `GoalCard.tsx`, `GoalSummaryBar.tsx`
- Category: basic
- Description: Six-card Goal-First selection and selected-workspace summary.
- Extractable props: selected, locale, onSelect, goal.
- Hardcoded: goal registry semantics, icons, accents, card geometry.

### NextStepCard

- Source: `src/components/tool/NextStepCard.tsx`
- Category: basic
- Description: Post-result cross-mode recommendation with optional step links.
- Extractable props: title, body, steps, children.
- Hardcoded: amber recommendation styling and arrow affordance.

### RelatedTools

- Source: `src/components/tool/RelatedTools.tsx`
- Category: basic
- Description: Registry-driven internal-link cluster for route discovery.
- Extractable props: route, title.
- Hardcoded: three-link limit, pill treatment, “Keep practicing” default.

### SafeAdSlot

- Source: `src/components/AdSlot.tsx`
- Category: basic
- Description: Stable ad/discovery slot that is absent during active skill execution.
- Extractable props: slot, format, activeTask, forbidden, context, className.
- Hardcoded: stable dimensions, no-config placeholder copy, active-marker observer.

### ResultCard

- Source: `src/components/ResultCard.tsx`
- Category: basic
- Description: Typing result hierarchy with metrics, integrity status, heatmap disclosure, share, and next actions.
- Extractable props: result, onNext.
- Hardcoded: cross-mode actions and metric labels.

### LocaleProvider

- Source: `src/components/LocaleProvider.tsx`
- Category: layout
- Description: Client locale context and dynamic `<html lang>` synchronization.
- Extractable props: children.
- Hardcoded: `en`/`id` persistence and event names.

### ConsentBanner

- Source: `src/components/ConsentBanner.tsx`
- Category: basic
- Description: Consent-gated analytics prompt independent from ordinary practice.
- Extractable props: none.
- Hardcoded: consent copy, privacy link, buttons, and dialog styling.
