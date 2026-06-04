---
wi: WI-dashboard-charts / 20260601-weekly-activity-type-chart
phase: review
status: confirmed
date: 2026-06-01
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | Rolling-7-day count-by-type aggregation, unit-tested | yes | `last7DaysCountsByType` (verified, aggregate.ts l.86-107): `windowStart = startOfUtcDay(now) − 6 days`, includes `[startMs, endMs]` inclusive, counts per type, `localeCompare` alphabetical sort, skips null/NaN startDate. `aggregate.test.ts` 7 cases (bounds incl/excl, multiple types, empty). Re-run green. |
| AC-2 | One bar per type (alphabetical); title says "last 7 days" | yes | Data contract (one row/type, alphabetical) covered by AC-1 unit tests. `activity-type-chart.tsx` (verified): `XAxis dataKey="type"`, single `Bar dataKey="count"`, testid `activity-type-chart`. Panel title "Activities by type (last 7 days)" (chart-panel.tsx l.22) asserted in `chart-panel.test.tsx`. |
| AC-3 | Empty-window message instead of empty chart | yes | `activity-type-chart.tsx` l.20-29: empty branch renders "No activities in the last 7 days" (testid `activity-type-empty`). `activity-type-chart.test.tsx::renders the empty-state message`. |
| AC-4 | Dropdown selector swaps charts | yes | `chart-panel.tsx`: native `<select>` with both options; body switches on `selected`. `chart-panel.test.tsx`: "offers both chart options" + "swaps to the training-load chart when selected". `page.tsx` l.69 renders `<ChartPanel>`. |
| AC-5 | Defaults to "Last 7 days by type" | yes | `usePersistedState("dashboard.chart", "last7-type")` (chart-panel.tsx l.35-38). `chart-panel.test.tsx::defaults to the last-7-days-by-type chart` (combobox value `last7-type`). |
| AC-6 | Selection persists in localStorage, restored on reload | yes | `use-persisted-state.ts` (verified): SSR-safe default, reads localStorage in effect, writes on change. `use-persisted-state.test.ts` (default/restore/persist) + `chart-panel.test.tsx` persist/restore cases. |
| AC-7 | No backend change; uses existing contract | yes | No backend/data-layer files touched; `ChartPanel`/`ActivityTypeChart` consume only `Activity.type` + `Activity.startDate`; `page.tsx` still sources `useActivities()`. Build succeeds against existing routes. |
| AC-8 | Tests cover helper + chart/selector; test/build/lint pass | yes | Independent re-run: `npm test` → **45/45 (8 files)**. Sub-agent reported `npm run build` + `npm run lint` clean. 17 new tests added; 28 pre-existing intact. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — last7DaysCountsByType + tests | yes | aggregate.ts + 7 unit tests (verified). |
| Step 2 — ActivityTypeChart + empty state | yes | activity-type-chart.tsx + test (verified). |
| Step 3 — usePersistedState hook | yes | use-persisted-state.ts + 3 tests (verified). |
| Step 4 — ChartPanel + selector; TrainingLoadChart body refactor | yes | chart-panel.tsx (verified); TrainingLoadChart stripped of Card, testid kept (verified). |
| Step 5 — Wire into page.tsx | yes | page.tsx l.69 `<ChartPanel activities={data} />` (verified). |
| Step 6 — test/build/lint gate | yes | 45/45 re-run green; build + lint clean per sub-agent. |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| 2 / 6 | Per-bar assertions moved to the pure-function layer; component test asserts chart-wrapper-vs-empty rather than bar count | acceptable — Recharts `ResponsiveContainer` renders 0×0 in jsdom (no bars produced), so per-bar DOM assertions are impossible. The data contract (one row/type, alphabetical) is fully unit-tested. Same constraint is why the pre-existing `TrainingLoadChart` had no direct test. |
| 6 | Added a 6-line `ResizeObserver` no-op polyfill to `vitest.setup.ts` | acceptable — jsdom lacks `ResizeObserver` which Recharts calls on mount; test-infra only, no app behavior change. |

## Gaps
None blocking. All 8 ACs satisfied; all 6 plan steps implemented.

**Residual note (not an AC gap):** because of the jsdom 0×0 limitation, the *rendered bars* themselves are not asserted in automated tests — only the data contract (unit-tested) and the chart-vs-empty branch + title (component-tested). A quick manual look in the browser is worthwhile to confirm the bars display. This mirrors the same limitation already accepted for `TrainingLoadChart`.

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-01. Verdict pass — 8/8 ACs satisfied, 6/6 steps implemented, 45/45 tests green on independent re-run. Residual: bars not asserted in jsdom (manual browser check recommended).

## Cancellation
_n/a_
