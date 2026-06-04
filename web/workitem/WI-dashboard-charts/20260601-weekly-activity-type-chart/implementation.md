---
wi: WI-dashboard-charts / 20260601-weekly-activity-type-chart
phase: implementation
status: completed
date: 2026-06-01
---

## Architecture Notes
**Fit with existing patterns.**
- Aggregation lives in `src/lib/aggregate.ts` alongside `weeklyTrainingLoad`/`summarize`/`activityTypes`, all pure functions taking `Activity[]` and a `now: Date` injection for deterministic tests (see existing `weeklyTrainingLoad(activities, weeks, now)`). The new `last7DaysCountsByType(activities, now)` follows the same UTC-day-aligned, dependency-injected-`now` shape and reuses the `Array.from(new Set(...)).sort()` alphabetical-ordering idiom already in `activityTypes`.
- Chart components are client components wrapping Recharts `BarChart` inside a `ResponsiveContainer` in a sized `div` with a `data-testid`, e.g. `training-load-chart.tsx` (`data-testid="training-load-chart"`, `h-72 w-full`). The new `activity-type-chart.tsx` mirrors this exactly (XAxis `dataKey`, single `Bar`, `fill="hsl(var(--primary))"`).
- Panel framing uses shadcn `Card`/`CardHeader`/`CardTitle`/`CardContent` from `@/components/ui/card`. Plan moves the `Card` frame up to a new `ChartPanel` so the two chart bodies are frameless; this matches how `summary-cards.tsx` owns its own Cards and keeps a single source of the header/title.

**Constraint discovered — Recharts + jsdom.** `ResponsiveContainer` measures its parent via the DOM layout box, which is always 0x0 in jsdom; Recharts then renders no `<svg>`/bars. This is exactly why `training-load-chart.tsx` has no direct test today. Consequence for AC-2: component tests cannot reliably assert on rendered bars. Coverage strategy: (a) bucketing/ordering/window edges are fully unit-tested at the pure-function layer (`last7DaysCountsByType`) for AC-1 and the AC-2 ordering/"one bar per type" data contract; (b) the component test asserts the populated path renders the chart wrapper (`data-testid="activity-type-chart"`) and NOT the empty message, and the empty path renders the `activity-type-empty` message (AC-3, fully deterministic). The chart title text ("last 7 days") is asserted at the panel level (AC-2 title, R-2b).

**SSR/hydration.** `usePersistedState` must return the default on the server and first client render, then hydrate from `localStorage` in `useEffect`, to avoid Next hydration mismatch (plan Step 3). jsdom supplies `localStorage`, so persistence is testable. Native `<select>` is used (no shadcn Select exists in `components/ui/`), styled with Tailwind to match the design — zero new deps.

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 2 / 6 | Plan implied component tests assert "bars per present type". | Bar count is asserted at the pure-function layer (`last7DaysCountsByType` unit tests); the component test asserts the chart wrapper renders vs. the empty message. | Recharts `ResponsiveContainer` renders 0x0 in jsdom — no bars are produced, so per-bar DOM assertions are impossible. Data-contract (one row per type, alphabetical) is fully covered by unit tests. |
| 6 | Plan listed Step 6 as verification with "Files: none". | Added a 6-line `ResizeObserver` no-op polyfill to `vitest.setup.ts`. | jsdom lacks `ResizeObserver`, which Recharts `ResponsiveContainer` calls on mount; without it any test that mounts a chart body throws. Test-infra only, no app behavior change. |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `src/lib/aggregate.test.ts` — `last7DaysCountsByType` block: counts per type, alphabetical order, lower-bound inclusion (`2026-05-26T00:00:00Z`), exclusion just before bound (`2026-05-25T23:59:59Z`) and after now (`12:00:01Z`), empty window, invalid/null startDate. Impl `src/lib/aggregate.ts:last7DaysCountsByType`. | COVERED |
| AC-2 | Ordering + one-row-per-type via AC-1 unit tests. Component renders `data-testid="activity-type-chart"` with `XAxis dataKey="type"` + single `Bar dataKey="count"` (`src/components/activity-type-chart.tsx`); chart-present path asserted in `activity-type-chart.test.tsx`. Title "Activities by type (last 7 days)" asserted in `chart-panel.test.tsx::defaults to the last-7-days-by-type chart` (R-2b). | COVERED |
| AC-3 | `src/components/activity-type-chart.test.tsx::renders the empty-state message` — asserts `data-testid="activity-type-empty"` + text "No activities in the last 7 days" and absence of the chart wrapper. Impl `activity-type-chart.tsx` empty branch. | COVERED |
| AC-4 | `src/components/chart-panel.test.tsx::offers both chart options` (both options present) and `::swaps to the training-load chart when selected` (selecting swaps body). Impl `chart-panel.tsx`. | COVERED |
| AC-5 | `chart-panel.test.tsx::defaults to the last-7-days-by-type chart` — combobox value `last7-type`, activity-type chart shown. Impl: `usePersistedState("dashboard.chart", "last7-type")`. | COVERED |
| AC-6 | `chart-panel.test.tsx::persists the selection to localStorage` and `::restores the selection from localStorage on mount`; plus `src/lib/use-persisted-state.test.ts` (default/restore/persist). Impl `use-persisted-state.ts`. | COVERED |
| AC-7 | No backend/data-layer files touched. `src/app/page.tsx` still sources `useActivities()`; `ChartPanel`/`ActivityTypeChart` consume only `Activity.type` + `Activity.startDate` from the existing contract (`src/lib/types.ts`). `npm run build` succeeds against existing API routes. | COVERED |
| AC-8 | `npm test` 45/45 pass (28 pre-existing + 17 new), `npm run build` clean, `npm run lint` "No ESLint warnings or errors". See Regression. | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1..AC-8 | 6 fails: chart-mounting tests threw `ResizeObserver is not defined` (jsdom). AC-1/AC-6 (non-chart) passed. | Added `ResizeObserver` no-op polyfill to `vitest.setup.ts`. |
| 2 | AC-1..AC-8 | 1 fail: `getByText(/last 7 days/i)` matched both the title and the select option (multiple elements). | Tightened AC-2 title assertion to exact text "Activities by type (last 7 days)". |
| 3 | AC-1..AC-8 | PASS — 45/45 tests green, build clean, lint clean. | None; all AC Pre-Check rows COVERED. |

## Regression
**Test suite run:** yes (`npm test` → `vitest run`)
**Result:** pass — 45/45 tests across 8 files. The 28 pre-existing tests (format, aggregate, summary-cards, activities-table, connection-banner) remain green after the `TrainingLoadChart` body-only refactor and the `page.tsx` swap to `ChartPanel`. 17 new tests added (last7DaysCountsByType ×7, activity-type-chart ×2, use-persisted-state ×3, chart-panel ×5).
**Build:** `npm run build` succeeds; `/` route builds as static.
**Lint:** `npm run lint` → "No ESLint warnings or errors".
**Failures:** none.
**Notes:** Recharts emits a benign console warning ("width(0) and height(0)") under jsdom's zero-size layout; it is not a test failure and does not occur in the browser.
