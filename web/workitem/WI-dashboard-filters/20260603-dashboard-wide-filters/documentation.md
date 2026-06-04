---
wi: WI-dashboard-filters/20260603-dashboard-wide-filters
phase: documentation
status: confirmed
date: 2026-06-03
project-docs-found: yes
---

## Project Documentation Updated
| File | Section | Change |
|---|---|---|
| `frontend/README.md` | Architecture | Updated the `aggregate.ts` bullet to describe the new `filterWithinDays` / `countsByType` / `countsByTypeWithinDays` helpers (replacing the stale `last7DaysCountsByType` reference); added a new `src/app/page.tsx` bullet documenting the dashboard-wide time-range filter; updated the `chart-panel.tsx` bullet to reflect its new `{ filtered, all }` props and the removal of its per-chart range control; updated the `use-persisted-state.ts` bullet to note it now also persists the selected time range. |

## Workitem Documentation

### What was built
The dashboard's time-range selector (7 days / 30 days / 6 months / 1 year) was previously a per-chart control buried inside the chart panel — it only affected the activities-distribution pie, and only when that chart was selected. The summary cards always showed totals over *all* activities regardless of the range.

This change promotes that selector to a **dashboard-wide filter**. It now lives in the dashboard header (always visible) and drives the whole dashboard's data: the summary cards (count, distance, time, average HR) and the distribution pie both reflect only activities within the selected period. The Training Load chart is intentionally left out — it keeps its own fixed "last 12 weeks" window.

### How it works
- A single helper, `filterWithinDays(activities, days, now?)` in `src/lib/aggregate.ts`, defines the rolling time window in exactly one place: `[startOfUtcDay(now − (days − 1)), now]`, inclusive at both ends, dropping activities with a missing/invalid `startDate`. The pre-existing `countsByTypeWithinDays` was reimplemented as `countsByType(filterWithinDays(...))` so there is no duplicated date-boundary logic.
- The dashboard (`src/app/page.tsx`) holds the range state via `usePersistedState<RangeKey>("dashboard.range", "30d")`, renders the header `<select>`, computes `filtered = filterWithinDays(data, activeRange.days)` **once**, and passes `filtered` to both `SummaryCards` and `ChartPanel` (for the pie). It passes the full unfiltered `data` to `ChartPanel` as `all`, which routes it to the Training Load chart.
- `ChartPanel` props are now `{ filtered, all }`; it no longer owns any range state or range selector (only the chart-type selector remains). `ActivityTypeChart` dropped its `days` prop and renders whatever pre-filtered list it is given via `countsByType`.
- The selected range persists across reloads under the localStorage key `dashboard.range` (the old per-chart key `dashboard.distribution.range` is abandoned; existing users start fresh at the 30d default).

### Usage
On the dashboard, use the time-range dropdown in the header (top-right, beside the Sync button) to pick 7 days, 30 days, 6 months, or 1 year. The summary cards and the activities-distribution pie immediately recompute for that window; the choice is remembered the next time you open the dashboard. When the chosen period contains no activities, the summary cards show `0`, `0.00 km`, `0h 0m`, and `—` for average HR, and the pie shows "No activities in this period" — the dashboard is not replaced by a full empty state.

### Known limitations
None functionally (review verdict: pass). Note for future contributors: there is no page-level integration test for `src/app/page.tsx`; the end-to-end "one filter drives both the cards and the pie" behavior is covered indirectly by the `filterWithinDays` unit tests plus the `filtered`/`all` prop assertions in `chart-panel.test.tsx` and `summary-cards.test.tsx`.

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-03; repo phase skipped by user.

## Cancellation
_n/a_
