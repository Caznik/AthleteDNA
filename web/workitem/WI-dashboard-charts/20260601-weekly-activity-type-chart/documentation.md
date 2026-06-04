---
wi: WI-dashboard-charts / 20260601-weekly-activity-type-chart
phase: documentation
status: confirmed
date: 2026-06-01
project-docs-found: yes
---

## Project Documentation Updated
| File | Section | Change |
|---|---|---|
| `web/frontend/README.md` | Architecture | Added the new `last7DaysCountsByType` aggregation, the `chart-panel.tsx` selector panel (and the two frameless chart bodies), and the `use-persisted-state.ts` hook. |

## Workitem Documentation

### What was built
A second chart for the dashboard plus a selector to switch between charts. The
dashboard already had a "weekly training load" chart, but it renders empty when
activities have no heart-rate data (training load = duration × HR = 0). This
workitem adds an **"activities by type, last 7 days"** bar chart — one bar per
activity type (Run, WeightTraining, …) counting how many of each were done in the
rolling last 7 days — which shows a useful signal regardless of HR.

The dashboard chart area now has a **dropdown** to choose which chart to show:
"Last 7 days by type" (the new default) or "Training load (last 12 weeks)". The
chosen option is remembered across page reloads.

This was a **frontend-only** change — no backend change. It uses the activity
`type` and `startDate` fields the API already returns.

### How it works
- **Window = rolling last 7 days, not a calendar week.** `last7DaysCountsByType`
  (`src/lib/aggregate.ts`) counts activities whose `startDate` falls between the
  start of (today − 6 days) at 00:00 UTC and now, inclusive. This was a deliberate
  choice: a strict Mon–Sun "current week" would have rendered empty (the test data
  is dated 25–31 May while "today" was Mon 1 Jun, a new ISO week), and the backend's
  7-day sync cap means little calendar-week history accrues. The chart title and the
  dropdown label both say "last 7 days" so the window is unambiguous.
- **Panel owns the frame.** `chart-panel.tsx` holds the shadcn `Card`, a title that
  changes with the selection, and a native `<select>`. The two chart components
  (`activity-type-chart.tsx`, `training-load-chart.tsx`) were refactored to render
  just their chart body (no `Card`), so the panel is the single source of the
  header/title. A native `<select>` is used because the project has no shadcn
  `Select` component — zero new dependencies.
- **Persistence is SSR-safe.** `use-persisted-state.ts` returns the default on the
  server and first client render, then hydrates from `localStorage` in an effect
  (key `dashboard.chart`, default `last7-type`). This avoids a Next.js hydration
  mismatch while still remembering the user's choice.
- **Empty state.** When the last 7 days contain no activities, the chart body shows
  "No activities in the last 7 days" instead of an empty axis.

### Usage
On the dashboard (`/`), the chart panel defaults to "Last 7 days by type". Use the
dropdown in the panel's top-right to switch to "Training load (last 12 weeks)". The
selection is remembered on your next visit. The new chart shows one bar per activity
type you did in the last 7 days; the y-axis is a count.

### Known limitations
Review verdict was **pass** with no accepted AC gaps. Residual notes:
- **Rendered bars are not asserted in automated tests.** Recharts' `ResponsiveContainer`
  reports a 0×0 size under jsdom, so it produces no bars in tests. Coverage is split:
  the data (counts, alphabetical order, window edges, empty case) is fully unit-tested
  at the `last7DaysCountsByType` layer, and the components are tested for the
  chart-vs-empty branch and the title. A manual browser check is recommended to
  confirm the bars display (same limitation already accepted for the training-load
  chart). A `ResizeObserver` no-op polyfill was added to `vitest.setup.ts` so
  chart-mounting tests don't throw.
- **Out of scope (this iteration):** duration/distance variants of the per-type chart
  (count only), historical/multi-week per-type breakdown, per-type colors, and any
  change to the training-load formula or backend.

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-01.

## Cancellation
_n/a_
