---
wi: WI-frontend-mvp
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
| 20260601-frontend-mvp-dashboard | completed (phases: all; repo skipped) |

## Active Blockers
_none_

## Key Decisions Log
- 2026-06-01 — **Frontend stack:** Next.js (App Router) + TypeScript, Tailwind + shadcn/ui, in `web/frontend/`. Next.js Route Handlers act as a BFF proxy to Spring Boot (`BACKEND_URL=http://localhost:8080`) — avoids CORS, clean home for OAuth callback and future auth. Chosen over pure Vite SPA for the BFF benefit.
- 2026-06-01 — **OAuth callback UX:** backend `api/strava/callback` will 302-redirect to frontend `/strava/linked` after linking, instead of returning JSON.
- 2026-06-01 — **Connection status:** add `GET api/strava/status` → `{linked:boolean}` so the UI can show connected vs not.
- 2026-06-01 — **Training load:** add `trainingLoad` to `ActivityDTO`, populated from existing domain `TrainingLoadCalculator` (single source of truth) rather than duplicating the formula in the frontend.
- 2026-06-01 — **Auth:** stays stub single-user; BFF structured so a session layer drops in later.
- 2026-06-01 — **Data-flow approach (propose):** Approach B — Client SPA with TanStack Query over BFF Route Handlers. Chosen over RSC-first (Approach A) for SPA ergonomics and clean sync→refetch; trade-off = more client JS.
- 2026-06-01 | wi-implement dispatch #1 for 20260601-frontend-mvp-dashboard | initial
- 2026-06-01 — **Repo phase skipped:** user explicitly chose to skip. No git repository is initialized in the project (same as the prior WI-strava-oauth workitem). No commit suggested.

## Parking / Cancellation
_none_
