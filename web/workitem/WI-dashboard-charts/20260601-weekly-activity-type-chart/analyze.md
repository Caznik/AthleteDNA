---
wi: WI-dashboard-charts / 20260601-weekly-activity-type-chart
phase: analyze
status: confirmed
date: 2026-06-01
---

## Requirements
- R-1: Add a new dashboard chart that shows the **count of the last 7 days' activities grouped by activity type** (e.g. Run, WeightTraining) — one bar per type, y-axis = count.
- R-2: Window = **rolling last 7 days**: activities with `startDate` from the start of (today − 6 days) through now, UTC day-aligned (today minus 6 whole days, inclusive of today). NOTE: this is intentionally a rolling 7-day window, **not** an ISO calendar week — chosen because today (Mon 2026-06-01) starts a fresh ISO week while the synced activities are 25–31 May, and the 7-day Strava sync cap means little calendar-week history accrues.
- R-2b: The chart's **title and selector label must clearly say "last 7 days"** (not "this week" / "current week") so the window is unambiguous to the user.
- R-3: Activity types are derived dynamically from the data (no hard-coded list) and ordered alphabetically for stable display.
- R-4: When no activities fall in the last 7 days, the chart area shows a **"No activities in the last 7 days"** message instead of an empty axis.
- R-5: Add a **dropdown selector** on the dashboard chart panel to switch between visualizations: "Last 7 days by type" and "Training load (last 12 weeks)". Both charts remain available; the existing training-load chart is unchanged in behavior.
- R-6: The selector **defaults to "Last 7 days by type"** on first load.
- R-7: The selected chart **persists across reloads** (localStorage); on return, the last-selected chart is shown. A first-time visitor with no stored value gets the default (R-6).
- R-8: Frontend-only change in `web/frontend`. Data comes from the existing `useActivities()` / `activities/getAll` (which already returns `type` and `startDate`). **No backend change.**
- R-9: Reuse existing patterns — shadcn `Card` for the panel, Recharts for the bar chart, shared types/hooks; metric/formatting conventions unaffected (count is unitless).
- R-10: Unit/component tests cover the new aggregation helper and the chart + selector behavior; `npm test`, `npm run build`, `npm run lint` pass.

## Out of Scope
- Duration- or distance-based variants of the per-type chart (count only this iteration).
- Multi-week / historical per-type breakdown (current week only).
- Changing the training-load formula or any backend change (tracked separately; this workitem is purely the new chart + selector).
- Per-type color theming/configuration beyond a sensible default.
- Server-side aggregation (done client-side from already-fetched activities).
- A general charting framework / more than these two chart options.

## Open Questions
_none_

## Acceptance Criteria
- [ ] **AC-1** — A new aggregation helper returns the count of activities in the **rolling last 7 days** (UTC day-aligned: start of today−6 days through now) grouped by type. Unit-tested for: correct bucketing, window inclusion/exclusion at both ends, multiple types, and the empty case.
- [ ] **AC-2** — The new chart renders one bar per activity type present in the last 7 days (y = count), with types ordered alphabetically; the chart title clearly reads "last 7 days".
- [ ] **AC-3** — When there are no activities in the last 7 days, the panel shows a "No activities in the last 7 days" message instead of an empty chart.
- [ ] **AC-4** — The dashboard chart panel has a dropdown selector offering "Last 7 days by type" and "Training load (last 12 weeks)"; selecting an option swaps the displayed chart.
- [ ] **AC-5** — On first load with no stored preference, the selector defaults to "Last 7 days by type".
- [ ] **AC-6** — The selected option persists in localStorage and is restored on reload.
- [ ] **AC-7** — No backend change; the feature works against the existing `activities/getAll` contract (`type` + `startDate`).
- [ ] **AC-8** — Unit/component tests cover the aggregation helper and the chart/selector behavior; `npm test`, `npm run build`, and `npm run lint` all pass.

## Interview Notes
- Triggered by debugging the empty training-load chart: live `activities/getAll` confirmed all 4 activities have `avgHr:null` → `trainingLoad:0`, so the load chart is correctly empty. User chose a count-by-type current-week chart as an HR-independent signal.
- User decisions in analyze: default chart = last-7-days-by-type; empty → "No activities in the last 7 days" message; selection persists across reloads (localStorage).
- **Plan-phase amendment (user-directed):** window changed from "current ISO week" to **rolling last 7 days**, explicitly labeled "last 7 days". Reason: today (Mon 2026-06-01) starts a fresh ISO week but all synced activities are 25–31 May, so a strict current-week chart would render empty; the 7-day sync cap compounds this. User: "1, but specify in the chart we are showing 7-days, not ISO week."
- Agent-set conventions accepted implicitly: UTC day-aligned window; types ordered alphabetically; count is unitless.

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-01
