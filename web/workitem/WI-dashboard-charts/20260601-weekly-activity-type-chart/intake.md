---
wi: WI-dashboard-charts
sub-feature: 20260601-weekly-activity-type-chart
phase: intake
status: confirmed
date: 2026-06-01
---

## Request
Add a "current week by activity type" chart to the dashboard, plus a dropdown/selector on the dashboard chart panel to switch between charts.

- **New chart:** counts the current week's activities grouped by activity type (e.g. Run, WeightTraining) — a bar per type.
- **Selector:** a dropdown lets the user choose which visualization to show (existing weekly training-load chart over 12 weeks ↔ new current-week activity-type counts); both remain available.
- **Motivation:** the existing training-load chart is empty because synced activities have no HR data (`trainingLoad = duration × avgHr = 0`). A count-by-type view gives a useful signal regardless of HR.
- **Scope:** frontend-only in `web/frontend` (new aggregation helper + chart component + selector + unit tests). No backend change expected — `activities/getAll` already returns `type` and `startDate`.

User-selected design choices (from pre-intake discussion):
- Metric per bar: **count** of activities.
- Window: **current week only**.
- Placement: **dropdown selector** switching between charts (not replace, not always-both).

## Classification
- Type: new feature (dashboard visualization + selector)
- Scope: full

## Routing Decision
- Flow: full workflow
- Phases: intake → analyze → propose → plan → implement → review → document → (repo likely skipped) → archive
- Rationale: genuine feature with UI/UX decisions (selector pattern, current-week boundary, aggregation) worth settling via analyze/plan; consistent with WI-frontend-mvp. Lighter since frontend-only and the data contract already exists.

## Confirmation
- Confirmed by user: yes

## Cancellation
_none_
