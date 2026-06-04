---
wi: WI-dashboard-charts
created: 2026-06-01
updated: 2026-06-01
status: completed
---

## Current State
- phase: archive (complete)
- blocked: no
- next: workitem complete — all phases done

## Sub-features

| Sub-feature | Status |
|---|---|
| 20260601-weekly-activity-type-chart | completed (phases: all; repo skipped) |

## Active Blockers
_none_

## Key Decisions Log
- 2026-06-01 — **Motivation:** the existing weekly training-load chart renders flat/empty because synced Strava activities carry no HR data (`trainingLoad = duration × avgHr = 0`). Confirmed via live `activities/getAll` (4 activities, all `avgHr:null`, `trainingLoad:0`). A count-by-type view gives a useful signal independent of HR.

- 2026-06-01 | wi-implement dispatch #1 for 20260601-weekly-activity-type-chart | initial
- 2026-06-01 — **Repo phase skipped:** user explicitly chose to skip. No git repository initialized in the project (same as prior workitems). No commit suggested.

## Parking / Cancellation
_none_
