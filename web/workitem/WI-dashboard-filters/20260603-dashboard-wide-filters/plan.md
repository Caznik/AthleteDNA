---
wi: WI-dashboard-filters/20260603-dashboard-wide-filters
phase: plan
status: confirmed
date: 2026-06-03
approach: Approach A — Lift state + filter once
---

## Context
**Selected approach:** Approach A — Lift state into `DashboardPage`, filter the activity list once with a shared helper, prop-drill the filtered list to the summary cards and the distribution pie; the Training Load chart keeps the full unfiltered list.
**AC coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7

Key files in play:
- `frontend/src/app/page.tsx` — dashboard; currently passes full `data` to both `SummaryCards` and `ChartPanel`.
- `frontend/src/components/chart-panel.tsx` — currently owns the range state + range `<select>` and only feeds it to the pie.
- `frontend/src/components/activity-type-chart.tsx` — pie; currently filters internally via `countsByTypeWithinDays(activities, days)`.
- `frontend/src/components/summary-cards.tsx` — totals via `summarize(activities)`; no change to logic, will receive the filtered list.
- `frontend/src/components/training-load-chart.tsx` — must keep receiving the full list (AC-4).
- `frontend/src/lib/aggregate.ts` — add the shared windowing helper.
- Tests: `aggregate.test.ts`, `chart-panel.test.tsx`, `activity-type-chart.test.tsx`, `summary-cards.test.tsx`.

## Implementation Sequence

### Step 1 — Shared windowing helper in aggregate.ts
**Satisfies:** AC-2, AC-3
**Files:** `frontend/src/lib/aggregate.ts`, `frontend/src/lib/aggregate.test.ts`
**Description:** Add `filterWithinDays(activities, days, now = new Date())` that returns activities whose `startDate` falls in the rolling window `[startOfUtcDay(now − (days−1)), now]` inclusive — reusing the exact boundary logic already in `countsByTypeWithinDays`. Add a plain `countsByType(activities)` (the current per-type counting without the date window). Reimplement `countsByTypeWithinDays` as `countsByType(filterWithinDays(activities, days, now))` so the date boundary is defined in exactly one place and existing pie/aggregate tests stay valid. Add unit tests for `filterWithinDays` (in-window, out-of-window, boundary inclusivity, missing/invalid `startDate`) and `countsByType`.

### Step 2 — Lift range filter into the dashboard header
**Satisfies:** AC-1, AC-3, AC-5
**Files:** `frontend/src/app/page.tsx`
**Description:** Move the `RangeKey`/`RANGE_OPTIONS` definitions and the range state into `DashboardPage`. Use `usePersistedState<RangeKey>("dashboard.range", "30d")` (new key; default 30d per AC-5). Render the range `<select>` in the dashboard header row (beside the `<h1>`/`SyncButton`), always visible. Compute `filtered = filterWithinDays(data, activeRange.days)` once. Pass `filtered` to `SummaryCards` and to `ChartPanel` (as the pie's data); pass the full `data` to `ChartPanel` for the Training Load chart. (Selector is only rendered once `data.length > 0`, consistent with the existing empty/loading guards.)

### Step 3 — Refactor ChartPanel to consume the lifted filter
**Satisfies:** AC-1, AC-4, AC-7
**Files:** `frontend/src/components/chart-panel.tsx`, `frontend/src/components/chart-panel.test.tsx`
**Description:** Remove the range state, `RangeKey`/`RANGE_OPTIONS`, and the range `<select>` from `ChartPanel` (AC-7 — the per-chart range control is gone). Change its props to `{ filtered: Activity[]; all: Activity[] }`: the distribution pie renders from `filtered`, the Training Load chart renders from `all` (AC-4). Keep the existing chart-type `<select>` (which chart) and its `dashboard.chart` persistence untouched. Update `chart-panel.test.tsx`: delete the three range-selector tests (default 7d, persists range, hides range for training-load) since that control moves to the dashboard; keep/adjust the chart-swap and chart-persistence tests to the new props.

### Step 4 — Refactor ActivityTypeChart to render pre-filtered data
**Satisfies:** AC-2
**Files:** `frontend/src/components/activity-type-chart.tsx`, `frontend/src/components/activity-type-chart.test.tsx`
**Description:** Drop the `days` prop; accept an already-filtered `activities` list and compute slices with `countsByType(activities)`. Keep the existing "No activities in this period" empty body. Update `activity-type-chart.test.tsx` to pass pre-filtered lists instead of `days` (the windowing is now covered by `filterWithinDays` tests in Step 1).

### Step 5 — Empty-period behavior + tests
**Satisfies:** AC-6
**Files:** `frontend/src/components/summary-cards.test.tsx` (and verify `summary-cards.tsx`, no code change expected)
**Description:** Confirm `summarize([])` → count 0, distance 0, duration 0, avgHr null, which `SummaryCards` renders as "0", "0.00 km", "0h 0m", "—" (verified against `format.ts`). Add a `SummaryCards` test for the empty list asserting those four values. The pie's empty message is already covered by Step 4. No dashboard empty-state takeover is introduced (AC-6).

## Risks / Known Unknowns
- **Test churn:** `chart-panel.test.tsx` and `activity-type-chart.test.tsx` assert the old chart-level range control and `days` prop; they must be updated, not just extended. Low risk but touches several tests.
- **localStorage key change:** switching from `dashboard.distribution.range` (7d) to `dashboard.range` (30d) means existing users start at the new 30d default rather than inheriting their old selection. Acceptable per AC-5 (default 30d); old key is simply abandoned.
- **No dashboard integration test today:** `page.tsx` has no test, so cross-component "filter drives both cards and pie" (AC-2) is verified via the unit pieces (filterWithinDays + component props) plus manual/QA verification rather than an end-to-end test. Implementer may add a lightweight page test if practical.

## Confirmation
**Confirmed by user:** yes
**Notes:** Approved 2026-06-03.

## Cancellation
_n/a_
