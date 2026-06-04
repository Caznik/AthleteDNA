---
wi: WI-dashboard-filters/20260603-dashboard-wide-filters
phase: implementation
status: completed
date: 2026-06-03
---

## Architecture Notes
The codebase follows a "dumb chart body + smart panel" split: `activity-type-chart.tsx` and `training-load-chart.tsx` render chart bodies only, while `chart-panel.tsx` owns the Card frame, header, selectors, and persistence. Aggregation logic lives entirely in `frontend/src/lib/aggregate.ts` (pure functions, `now` injected for testability via a default `new Date()` param). Persistence uses `usePersistedState<T>(key, default)` (SSR-safe: starts at default, hydrates from localStorage in an effect) — `src/lib/use-persisted-state.ts`.

Key constraints honored:
- The date-window boundary is currently defined once inside `countsByTypeWithinDays` (rolling window `[startOfUtcDay(now − (days−1)), now]` inclusive). To keep a single source of truth, `filterWithinDays` reuses that exact boundary and `countsByTypeWithinDays` is reimplemented as `countsByType(filterWithinDays(...))`. This keeps all existing `countsByTypeWithinDays` tests valid unchanged.
- Selectors in the panel use `<select>` with `sr-only` labels and `aria-label`; tests select via `getByRole("combobox", { name })`. The lifted dashboard selector follows the same accessible pattern.
- `page.tsx` renders the selector only after the existing empty/loading/not-connected guards (i.e. once `data.length > 0`), so the always-visible requirement (AC-1) is scoped to the populated dashboard, consistent with existing guard ordering.
- AC-4: `TrainingLoadChart` keeps receiving the full unfiltered list; only the pie + summary cards consume the filtered list.
- The localStorage key changes from `dashboard.distribution.range` (default 7d) to `dashboard.range` (default 30d) per AC-5; the old key is abandoned.

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 2 | `activeRange = RANGE_OPTIONS.find(...) ?? RANGE_OPTIONS[0]` (the existing [0] fallback pattern) | Used `?? RANGE_OPTIONS[1]` (30d) as the fallback | The fallback should match the AC-5 default (30d), which is index 1, not the first option (7d). 1-line change, no new abstraction. |
| 3 | Delete the three range-selector tests in chart-panel.test.tsx | Deleted the two redundant ones (default-7d, persists-range) and replaced the "hides range for training-load" test with a "does not render a per-chart time range selector" test; also added a "renders pie from `filtered`" test asserting the new prop split | Keeps explicit coverage that AC-7's removal holds and that the new `filtered`/`all` prop wiring is correct. No scope expansion. |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `src/app/page.tsx:` header renders a `<select aria-label="Time range">` beside `<h1>`/`SyncButton`, unconditional on chart selection; `chart-panel.test.tsx::does not render a per-chart time range selector` confirms it is no longer inside the panel | COVERED |
| AC-2 | `src/app/page.tsx` computes `filtered = filterWithinDays(data, activeRange.days)` once and passes it to both `SummaryCards` and `ChartPanel` (pie); `aggregate.test.ts` `describe(filterWithinDays)` covers the windowing; `chart-panel.test.tsx::renders the distribution pie from the 'filtered' list` confirms the pie consumes `filtered` | COVERED |
| AC-3 | `src/app/page.tsx:` `SummaryCards activities={filtered}`; `summary-cards.test.tsx::renders zeros and a dash for an empty (filtered-out) period` + existing totals test confirm cards compute over the passed list | COVERED |
| AC-4 | `src/app/page.tsx:` `ChartPanel filtered={filtered} all={data}`; `chart-panel.tsx` renders `TrainingLoadChart activities={all}` (full list); `chart-panel.test.tsx::swaps to the training-load chart` confirms it renders | COVERED |
| AC-5 | `src/app/page.tsx:` `usePersistedState<RangeKey>("dashboard.range", "30d")` + `?? RANGE_OPTIONS[1]` fallback; persistence behavior covered by `use-persisted-state` (read-on-mount/write-on-change) and exercised by existing `dashboard.chart` persistence tests in `chart-panel.test.tsx` | COVERED |
| AC-6 | `summary-cards.test.tsx::renders zeros and a dash for an empty (filtered-out) period` (0 / 0.00 km / 0h 0m / —); `activity-type-chart.test.tsx::renders the empty-state message when the (filtered) list is empty`; no empty-state takeover — `page.tsx` empty guard fires only on `data.length === 0` (full list), not the filtered list | COVERED |
| AC-7 | `chart-panel.tsx` no longer defines `RangeKey`/`RANGE_OPTIONS`/range `<select>`; `chart-panel.test.tsx::does not render a per-chart time range selector` asserts absence | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1..AC-7 | All pass | Ran `npm test` (73 passed, 10 files), `npx tsc --noEmit` (clean), `npm run lint` (no warnings/errors). Verified each AC against the cited tests/evidence above. |

## Regression
**Test suite run:** yes (`npm test` → vitest, frontend)
**Result:** pass — 73/73 tests across 10 files; `tsc --noEmit` clean; `next lint` no warnings/errors.
**Failures:** none. (recharts emits a benign jsdom "width(0)/height(0)" stderr warning in ResponsiveContainer during tests — pre-existing, not a test failure.)
**Notes:** `page.tsx` has no dedicated component test (none existed before); cross-component "filter drives both cards and pie" is verified via the unit pieces (`filterWithinDays` tests + the `filtered`/`all` prop assertions in `chart-panel.test.tsx` and `summary-cards.test.tsx`), per the plan's known-unknown.
