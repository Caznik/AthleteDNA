---
wi: WI-dashboard-charts / 20260601-weekly-activity-type-chart
phase: plan
status: confirmed
date: 2026-06-01
approach: Approach A — Client-side aggregation + Recharts bar chart + selector hook
---

## Context
**Selected approach:** Approach A (frontend-only; client-side aggregation, Recharts, dropdown selector with localStorage).
**AC coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8 *(all 8)*

**Codebase facts grounding the plan:**
- `src/app/page.tsx` renders `<TrainingLoadChart activities={data} />` directly after `<SummaryCards>`. The dashboard is a client component using `useActivities()`/`useStravaStatus()`.
- `TrainingLoadChart` (training-load-chart.tsx) wraps its own shadcn `Card` + `CardHeader`/`CardTitle` and a Recharts `BarChart` (testid `training-load-chart`). No test file targets it directly.
- `src/lib/aggregate.ts` already has `startOfIsoWeek` (Monday 00:00 UTC) — reuse it for the current-week boundary.
- `components/ui/` has `button card table badge skeleton` — **no Select/dropdown component**. Plan uses a styled native `<select>` to avoid pulling the Radix shadcn `select` (deterministic, zero new deps). Switching to shadcn `Select` later is a trivial swap.
- Existing frontend tests: format, aggregate, summary-cards, activities-table, connection-banner (28 total) — must stay green.

## Implementation Sequence

### Step 1 — Last-7-days count-by-type aggregation
**Satisfies:** AC-1
**Files:** `src/lib/aggregate.ts`, `src/lib/aggregate.test.ts`
**Description:** Add `last7DaysCountsByType(activities, now = new Date()): { type: string; count: number }[]`. Window lower bound = start of UTC day (now) minus 6 days (i.e. today + the previous 6 whole days, inclusive); include activities with `startDate >= windowStart` and `<= now`. Count per `type`, return sorted alphabetically by type. Unit tests: correct counts/bucketing, inclusion at the 7-day lower bound, exclusion just before it and after now, multiple types, empty window.

### Step 2 — Activity-type chart component (+ empty state)
**Satisfies:** AC-2, AC-3
**Files:** `src/components/activity-type-chart.tsx` (+ test `activity-type-chart.test.tsx`)
**Description:** Body component taking `activities`; computes data via `last7DaysCountsByType`. If empty → render a centered "No activities in the last 7 days" message (testid `activity-type-empty`). Otherwise a Recharts `BarChart` with `XAxis dataKey="type"`, `YAxis` (integer ticks), one `Bar dataKey="count"`. Renders chart body only (no `Card`) so the panel owns the frame. Tests: bars per present type / empty message.

### Step 3 — Persisted-selection hook
**Satisfies:** AC-6
**Files:** `src/lib/use-persisted-state.ts` (+ test `use-persisted-state.test.ts`)
**Description:** SSR-safe `usePersistedState<T>(key, default)` — initializes with `default` (so server and first client render match), then reads localStorage in `useEffect` to avoid hydration mismatch; writes on change. Test: default when unset, restores stored value, persists on update (jsdom localStorage).

### Step 4 — Chart panel with dropdown selector
**Satisfies:** AC-4, AC-5, AC-6
**Files:** `src/components/chart-panel.tsx` (+ test `chart-panel.test.tsx`); refactor `src/components/training-load-chart.tsx` to a body-only component (strip its `Card`, keep testid)
**Description:** `ChartPanel` owns the shadcn `Card`. `CardHeader` holds a dynamic title + a right-aligned native `<select>` with options `"last7-type"` ("Last 7 days by type") and `"training-load"` ("Training load (last 12 weeks)"). The title reflects the selection and, for the new chart, clearly reads "last 7 days" (R-2b). Selection stored via `usePersistedState("dashboard.chart", "last7-type")` → **defaults to last7-type (AC-5)**, persists (AC-6). `CardContent` renders the chosen chart body. Refactor `TrainingLoadChart` to export the chart body without its own `Card`/header (title moves to the panel). Tests: default selection shows activity-type chart; changing the select swaps to training-load; selection restored from localStorage.

### Step 5 — Wire panel into the dashboard
**Satisfies:** AC-4, AC-7
**Files:** `src/app/page.tsx`
**Description:** Replace `<TrainingLoadChart activities={data} />` with `<ChartPanel activities={data} />`. No backend or data-layer change — still sourced from `useActivities()` (`activities/getAll` already returns `type` + `startDate`), confirming AC-7.

### Step 6 — Test/build/lint gate
**Satisfies:** AC-8
**Files:** _none (verification)_
**Description:** Run `npm test` (new + existing all green), `npm run build`, `npm run lint`. Confirm the 28 existing tests still pass after the `TrainingLoadChart` refactor and `page.tsx` change.

## Risks / Known Unknowns
- **RESOLVED — window definition.** Originally a strict current ISO week would have rendered empty today (activities are 25–31 May; today Mon 2026-06-01 starts a new week). User chose a **rolling last-7-days** window, explicitly labeled "last 7 days", which includes all 4 current activities. Reflected in R-1/R-2/R-2b/AC-1/AC-2/AC-3 and Steps 1–4.
- **No shadcn Select installed** — using a native `<select>`; if a shadcn `Select` look is required that's a deviation (extra Radix dep).
- **localStorage + Next hydration** — must lazy-read in `useEffect`; mitigated by Step 3 design. jsdom provides localStorage for tests.
- **TrainingLoadChart refactor** — moving the title into the panel and stripping its `Card` is low-risk (no test targets it directly), but `page.tsx` is its only consumer; verified in Step 5/6.

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-01. Window = rolling last 7 days (user-amended from current ISO week), labeled "last 7 days".

## Cancellation
_n/a_
