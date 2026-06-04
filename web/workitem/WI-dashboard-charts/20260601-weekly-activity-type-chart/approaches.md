---
wi: WI-dashboard-charts / 20260601-weekly-activity-type-chart
phase: propose
status: confirmed
date: 2026-06-01
triggered: no
---

## Approach A — Client-side aggregation + Recharts bar chart + selector hook (only viable approach)
**Summary:** Add a pure aggregation helper (current-week count-by-type) alongside the existing `aggregate.ts`, render it with a Recharts bar chart in a shadcn `Card`, and add a dropdown selector that swaps between the new chart and the existing training-load chart. Selection persists via a small localStorage-backed state hook. All data comes from the existing `useActivities()` query.

**Why this is the only reasonable direction:**
- Frontend-only; the data contract (`activities/getAll` with `type` + `startDate`) already exists — no backend alternative to weigh.
- Aggregation must run client-side from already-fetched activities (no new endpoint in scope).
- Charting library (Recharts) and panel primitive (shadcn `Card`) are already established by WI-frontend-mvp; introducing another would be gratuitous.
- The selector control type (dropdown) and persistence (localStorage) were fixed during analyze.

**Effort:** low

## Selected Approach
**Choice:** Approach A
**Rationale:** Single obvious direction given the frontend-only scope and existing patterns/contract. No trade-offs to surface.

## Confirmation
**Confirmed by user:** yes
**Notes:** Propose not triggered (`triggered: no`); recorded for completeness per workflow.

## Cancellation
_n/a_
