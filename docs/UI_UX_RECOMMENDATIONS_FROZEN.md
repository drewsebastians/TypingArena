# UI/UX Recommendations — Frozen (Pass VII)

**Frozen:** 2026-08-26 after baseline capture, before implementation.
Source: `docs/UI_UX_AUDIT_PASS_VII.md` (14 findings, P0–P2).

## Must fix now (P0/P1 HIGH, blocks or serious friction)

| Group | IDs | Scope |
|---|---|---|
| **A. Navigation hierarchy** | UX-001, UX-002 | Header: introduce 4 primaries — Practice, Compete, Groups, Progress — with desktop dropdowns and accessible mobile drawer; all routes remain reachable |
| **B. Typography** | UX-004 | globals.css + layout: coherent Geist Sans / Geist Mono system |
| **C. Locale semantics + reactivity** | UX-005, UX-006 | html lang reactive + locale subscription/context |
| **D. Degraded-state copy** | UX-007 | Replace README-facing copy with user-facing states |
| **E. Mobile nav a11y** | UX-002 | Drawer: Escape, focus trap, current route, touch ≥44 px |
| **F. Homepage grouping** | UX-003 | Sectioned discovery with progressive disclosure |
| **G. Result hierarchy** | UX-008 | Primary metric → secondary → CTA → Details disclosure |
| **H. Active-exercise focus** | UX-009 | Dim secondary chrome during active test |
| **I. Responsive overflow** | UX-011 | Stack/wrap metrics at narrow widths |

## Should fix now (P2 with system value, bundled when coherent)

| Group | IDs | Scope |
|---|---|---|
| **J. Visual consistency** | UX-010, UX-013 | Lightweight primitives + dark continuity |
| **K. Empty/loading states** | UX-014 | Standard empty component |
| **L. Trust messaging density** | UX-012 | Demote detail to supporting context |

## Do not change in this pass

- Scoring, exercise logic, DB/RPC/security, ranked eligibility — frozen
- New product surfaces, thin SEO pages, broad brand redesign
- Speculative gamification/monetization ideas
- Backend architecture, ad-safety rule weakening
- Route removal — every public URL stays reachable and indexable
- Runtime AI — remains prohibited
