---
wi: WI-dashboard-filters/20260603-dashboard-wide-filters
phase: review
status: confirmed
date: 2026-06-03
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | Single range selector in dashboard header, always visible | yes | `page.tsx:88-104` renders one `<select aria-label="Time range">` in the header row beside `<h1>`/`SyncButton`, unconditional on chart selection. `chart-panel.test.tsx:53` "does not render a per-chart time range selector" confirms it's gone from the panel. |
| AC-2 | Range filters both summary cards and distribution pie | yes | `page.tsx:82` computes `filtered = filterWithinDays(data, activeRange.days)` once; passed to `SummaryCards` (`:108`) and `ChartPanel`'s pie (`:109` → `chart-panel.tsx:78` `ActivityTypeChart activities={filtered}`). `aggregate.test.ts:199` `filterWithinDays` suite covers windowing; `chart-panel.test.tsx:60` confirms the pie consumes `filtered`. |
| AC-3 | Summary totals computed over filtered activities | yes | `page.tsx:108` `SummaryCards activities={filtered}`; `summarize` runs on the passed list. `summary-cards.test.tsx:44` exercises the filtered-out (empty) case. |
| AC-4 | Training Load unaffected; keeps 12-week window | yes | `page.tsx:109` `all={data}` (full unfiltered list); `chart-panel.tsx:76` `TrainingLoadChart activities={all}`. `weeklyTrainingLoad` default `weeks=12` untouched. `chart-panel.test.tsx:69` confirms it renders. |
| AC-5 | Default 30d; persists across reloads | yes | `page.tsx:27-30` `usePersistedState<RangeKey>("dashboard.range", "30d")`; fallback `?? RANGE_OPTIONS[1]` (30d) at `:81`. `use-persisted-state.ts` read-on-mount/write-on-change provides persistence (covered by its own tests + `dashboard.chart` persistence tests). |
| AC-6 | Empty period → zeros/dash on cards, pie empty message, no takeover | yes | `summary-cards.test.tsx:44` asserts "0", "0.00 km", "0h 0m", "—" on an empty list; `activity-type-chart` shows "No activities in this period" on empty; `page.tsx:70` empty-state guard fires only on `data.length === 0` (full list), never on the filtered list → no takeover. |
| AC-7 | Per-chart range control removed | yes | `chart-panel.tsx` no longer defines `RangeKey`/`RANGE_OPTIONS`/range `<select>` (only the chart-type select remains). `chart-panel.test.tsx:53` asserts absence. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — Shared windowing helper | yes | `aggregate.ts:87` `filterWithinDays`, `:107` `countsByType`, `:120` `countsByTypeWithinDays` reimplemented as their composition. Tests at `aggregate.test.ts:199`/`:260`. |
| Step 2 — Lift range filter into dashboard header | yes | `page.tsx` holds range state, renders header selector, filters once, passes `filtered`/`all`. |
| Step 3 — Refactor ChartPanel | yes | Props now `{ filtered, all }`; range state/options/select removed; chart-type select + `dashboard.chart` persistence retained. Tests updated. |
| Step 4 — Refactor ActivityTypeChart | yes | `days` prop dropped; renders pre-filtered list via `countsByType`. Empty body retained. Tests updated. |
| Step 5 — Empty-period behavior + tests | yes | `summary-cards.test.tsx:44` added; no code change needed in `summary-cards.tsx` (verified against `format.ts`: `formatDuration(0)` → "0h 0m"). |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| Step 2 | Fallback uses `RANGE_OPTIONS[1]` (30d) instead of `[0]` | acceptable — aligns the fallback with the AC-5 default (30d); intent preserved, no AC impact. |
| Step 3 | Range tests replaced (not just deleted): added "no per-chart selector" + "pie renders from `filtered`" tests | acceptable — strengthens coverage of AC-7 and the new prop split; no scope expansion. |

## Gaps
None. All 7 ACs satisfied with code + test evidence; all 5 plan steps implemented.

Known non-gap (per plan's stated unknown): `page.tsx` has no dedicated page-level test, so the end-to-end "filter drives both cards and pie" is verified via the unit pieces (`filterWithinDays` tests + the `filtered`/`all` prop assertions in `chart-panel.test.tsx` and `summary-cards.test.tsx`) rather than an integration test. This matches the plan and is acceptable.

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** Pass verdict confirmed 2026-06-03.

## Cancellation
_n/a_
