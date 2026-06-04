---
wi: WI-dashboard-filters/20260603-dashboard-wide-filters
phase: propose
status: confirmed
date: 2026-06-03
triggered: yes
---

## Approach A — Lift state + filter once (prop drilling)
**Summary:** Move the range state out of `ChartPanel` into `DashboardPage` (`page.tsx`). Render the range selector in the dashboard header. Add a `filterWithinDays(activities, days)` helper in `aggregate.ts` that defines the period boundary in one place. Compute the filtered list once in the dashboard and prop-drill it to `SummaryCards` and the distribution pie; pass the full unfiltered list to `TrainingLoadChart`. Refactor the pie to render from a pre-filtered list (using a plain `countsByType`) so a single boundary definition drives both summary cards and the pie.
**Pros:**
- Lowest surface area; satisfies every AC with minimal new abstraction.
- Single source of truth for the filtered set → summary cards and pie are guaranteed consistent (AC-2).
- Easy to test: one helper + straightforward component props.
- Matches current reality (one filter); no speculative machinery.
**Cons:**
- Prop-drilling the filtered list; if many more filters/consumers are added later, a context may be warranted (can be refactored then).
**Effort:** low

## Approach B — Filter context/provider
**Summary:** Introduce a `DashboardFilterContext` holding the range (and room for future filters), exposed via a hook. Components read the filter/filtered data from context instead of props.
**Pros:**
- Scales cleanly if more filters (activity type, distance) are added later.
- No prop-drilling.
**Cons:**
- More boilerplate (provider, hook, types) for a single filter today — YAGNI.
- More moving parts to test for the same outcome.
**Effort:** medium

## Selected Approach
**Choice:** Approach A
**Rationale:** Current scope is a single time-range filter; lifting state and filtering once satisfies all acceptance criteria with the least complexity and gives a single source of truth for the filtered set. If future filters are added, evolving to a context (Approach B) is a localized refactor.

## Confirmation
**Confirmed by user:** yes
**Notes:** User selected Approach A (Lift state + filter once).

## Cancellation
_n/a_
