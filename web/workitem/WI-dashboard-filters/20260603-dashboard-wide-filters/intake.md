---
wi: WI-dashboard-filters
sub_feature: 20260603-dashboard-wide-filters
phase: intake
status: confirmed
date: 2026-06-03
---

## Request
Filters are being only applied at chart level. They might be applied to whole dashboard data.

## Classification
- Type: behavior change / refactor (filtering scope)
- Scope: dashboard data filtering — move filter application from per-chart to dashboard-wide

## Routing Decision
- Flow: full workflow
- Rationale: changing the scope at which filters apply affects how data flows through the dashboard and impacts multiple charts/components — this is a behavior-affecting change warranting analyze → propose → plan → implement → review → document.
- Phases: all

## Confirmation
- Confirmed by user: yes

## Cancellation
_none_
