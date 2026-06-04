---
wi: WI-frontend-mvp
sub-feature: 20260601-frontend-mvp-dashboard
phase: intake
status: confirmed
date: 2026-06-01
---

## Request
Build the frontend MVP + dashboard for AthleteDNA: Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, in `web/frontend/`. Next.js Route Handlers act as a BFF proxy to the Spring Boot backend (`BACKEND_URL=http://localhost:8080`).

Scope: Strava connect/sync flow, activities table, and a dashboard (summary cards + training-load-over-time chart).

Includes 3 small backend prerequisites:
1. `GET api/strava/status` → `{linked:boolean}`.
2. Callback 302-redirects to frontend `/strava/linked` instead of returning JSON.
3. Add `trainingLoad` to `ActivityDTO`, populated from the existing `TrainingLoadCalculator`.

Auth stays stub single-user; BFF built so a session layer can drop in later.

## Classification
- Type: new feature (greenfield frontend + coupled backend contract changes)
- Scope: full

## Routing Decision
- Flow: full workflow
- Phases: intake → analyze → propose → plan → implement → review → document → repo → archive
- Rationale: non-trivial scope (OAuth flow, BFF, dashboard/charts) coupled with backend contract changes; acceptance criteria and the FE↔BE contract should be settled before coding.

## Confirmation
- Confirmed by user: yes

## Cancellation
_none_
