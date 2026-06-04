---
wi: WI-dashboard-filters/20260603-dashboard-wide-filters
phase: analyze
status: confirmed
date: 2026-06-03
---

## Requirements

### Current behavior (problem)
- The time-range filter (7d / 30d / 6m / 1y) lives inside `ChartPanel` and is passed only to the distribution pie (`ActivityTypeChart` via `days=`). It is only visible when the distribution chart is selected.
- `SummaryCards` computes totals over the **entire** activity list, ignoring the range.
- `TrainingLoadChart` ignores the range (uses its own fixed "last 12 weeks").
- Net effect: the filter is a chart-level control, not a dashboard-level one.

### Target behavior
1. The time-range selector becomes a **dashboard-wide filter** that drives the shared data set.
2. **In scope of the filter:** Summary cards and the Distribution pie both reflect only activities within the selected period.
3. **Out of scope of the filter:** Training Load chart keeps its fixed "last 12 weeks" window, independent of the dashboard filter.
4. The selector moves to the **dashboard header** (top of page, beside the title / Sync button) and is always visible — no longer conditional on which chart is selected.
5. Range options remain 7d / 30d / 6m / 1y.
6. Default range is **30 days**; the user's selection persists across reloads (localStorage).
7. Summary cards recompute (count, total distance, total time, average HR) over the filtered activities.
8. When the selected period contains **zero activities**, summary cards render zeros (0 activities, 0 distance, 0 time) and a dash ("—") for average HR; the distribution pie keeps its existing "No activities in this period" message. The dashboard is NOT replaced by a full empty state.

## Out of Scope
- Filters other than time range (e.g. by activity type, by distance) — not part of this workitem.
- Making the Training Load chart respond to the dashboard filter — explicitly excluded; it stays on its fixed 12-week window.
- Backend/API changes — filtering remains client-side over already-loaded activities.
- Replacing the whole dashboard with an empty state on an empty period.

## Open Questions
_none — all resolved during interview._

## Acceptance Criteria
- [ ] **AC-1** — A single time-range selector (7d / 30d / 6m / 1y) is rendered in the dashboard header, always visible regardless of which chart is selected.
- [ ] **AC-2** — Selecting a range filters the activity set so that **both** the summary cards and the distribution pie reflect only activities within that period.
- [ ] **AC-3** — Summary cards (count, total distance, total time, average HR) are computed over the filtered activities, not the full list.
- [ ] **AC-4** — The Training Load chart is unaffected by the dashboard filter and continues to render its fixed "last 12 weeks" window.
- [ ] **AC-5** — The default range on first load is 30 days, and the selected range persists across page reloads via localStorage.
- [ ] **AC-6** — When the selected period has zero activities, summary cards show 0 / 0 / 0 and "—" for average HR, and the distribution pie shows "No activities in this period"; the dashboard body is not replaced by an empty state.
- [ ] **AC-7** — The range selector no longer appears as a separate per-chart control inside the chart panel (the duplicate/chart-level filter is removed in favor of the dashboard-level one).

## Interview Notes
- Confirmed the only existing "filter" is the time-range selector; scope is to lift it to dashboard level (agent-identified, user agreed by selecting Summary cards + Distribution pie).
- User chose to **exclude** Training Load from the filter to avoid the conflict between short ranges (7d) and its 12-week design.
- User chose the dashboard header as the selector location.
- User raised the default from the current 7d to **30d** for a fuller first-load view, keeping localStorage persistence.
- Empty period: user chose graceful zeros/dashes over a full dashboard empty-state takeover.

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-03
