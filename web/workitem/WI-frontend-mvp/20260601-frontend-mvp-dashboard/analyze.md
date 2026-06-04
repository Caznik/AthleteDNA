---
wi: WI-frontend-mvp / 20260601-frontend-mvp-dashboard
phase: analyze
status: confirmed
date: 2026-06-01
---

## Requirements

### Backend prerequisites (Spring Boot)
- R-B1: Expose `GET api/strava/status` returning `{ "linked": boolean }` for the current (stub) user, based on whether a `StravaAccount` exists.
- R-B2: After a successful link, the `api/strava/callback` endpoint 302-redirects the browser to `${FRONTEND_URL}/strava/linked` instead of returning JSON. Invalid/expired state results in a redirect to a frontend error state (e.g. `/strava/linked?error=...`) rather than an unhandled JSON error.
- R-B3: `ActivityDTO` includes a `trainingLoad` field populated from the existing domain `TrainingLoadCalculator` (`duration × avgHr`); `GET activities/getAll` returns it.

### Frontend (Next.js)
- R-F1: Next.js (App Router) + TypeScript project scaffolded in `web/frontend/`, styled with Tailwind + shadcn/ui.
- R-F2: BFF layer — Route Handlers proxy `connect`, `sync`, `status`, and `activities` to `BACKEND_URL` server-side, so the browser never calls Spring directly (no CORS).
- R-F3: Strava connect flow — a Connect action fetches the authorization URL and redirects the browser to Strava.
- R-F4: `/strava/linked` landing page confirms success (and surfaces an error state) and links back to the dashboard.
- R-F5: A connection indicator reflects `GET api/strava/status` — shows "connected" vs a connect call-to-action.
- R-F6: Sync action triggers `POST api/strava/sync`, shows a toast `"{n} activities synced"`, and refreshes the displayed data.
- R-F7: Dashboard summary cards: total activities, total distance (km), total time (h:m), average HR (bpm) over synced data.
- R-F8: Dashboard training-load chart — load summed per week over the last 12 weeks (rolling window); weeks with no activity render as 0.
- R-F9: Activities table — columns: type, date, distance (km), duration (h:m), avg HR, training load. Default sort newest-first; filterable by activity type.
- R-F10: Empty state (no activities synced) and not-connected state both guide the user to the next action.
- R-F11: Error handling — backend unreachable or a failed sync surfaces a non-blocking error (toast/banner); the app does not crash.
- R-F12: Metric units throughout (km, m, bpm, h:m); shared formatting utilities.

### Quality
- R-Q1: Component/unit tests (Vitest + Testing Library): formatting utilities and key components (summary cards, activities table, connection indicator).
- R-Q2: `npm run build` and `npm run lint` pass cleanly.
- R-Q3: README documents the full local run sequence (Postgres via compose → backend with `jpa,local` profiles for real Strava creds → frontend `npm run dev`) and required env vars.

## Out of Scope
- Disconnect / unlink Strava (no backend endpoint; deferred).
- Real authentication / multi-user (stays stub single-user; BFF structured to add a session layer later).
- Imperial units / user-toggleable units.
- E2E / Playwright tests this iteration.
- Pagination / infinite scroll on activities (getAll returns all; acceptable at MVP volume).
- Activity detail pages, maps, Strava webhooks / automatic background sync.

## Resolved Questions
- RQ-1 (was OQ-1): Backend frontend-URL config → `app.frontend-url` / env `FRONTEND_URL`, default `http://localhost:3000`. Used for the callback redirect target.
- RQ-2 (was OQ-2): Real Strava creds exist in `application-local.properties` (gitignored). True end-to-end link is testable by running the backend with both profiles: `--spring.profiles.active=jpa,local`.
- RQ-3 (was OQ-3): `/strava/linked` does not assume success — it calls `api/strava/status` and renders the real state (connected → dashboard link; not connected → Connect CTA), so it is honest regardless of how it is reached.

## Acceptance Criteria
- [ ] **AC-1** — `GET api/strava/status` returns `{linked:true}` when the stub user has a linked `StravaAccount`, `{linked:false}` otherwise.
- [ ] **AC-2** — On successful callback, the backend issues a 302 to `${FRONTEND_URL}/strava/linked`; an invalid state redirects to a frontend error state instead of returning a raw error.
- [ ] **AC-3** — `GET activities/getAll` responses include a numeric `trainingLoad` equal to `TrainingLoadCalculator` output for each activity.
- [ ] **AC-4** — `web/frontend` runs via `npm run dev`; `npm run build` and `npm run lint` pass.
- [ ] **AC-5** — Browser requests reach the backend only through Next.js Route Handlers (BFF); no direct browser→Spring calls and no CORS configuration required.
- [ ] **AC-6** — Clicking Connect redirects the browser to a Strava authorization URL obtained from `api/strava/connect`.
- [ ] **AC-7** — After linking, the user lands on `/strava/linked` with a success confirmation and a link to the dashboard.
- [ ] **AC-8** — The connection indicator shows connected vs. a connect CTA, driven by `api/strava/status`.
- [ ] **AC-9** — Sync triggers `api/strava/sync`, shows a `"{n} activities synced"` toast, and the activity list/dashboard reflect new data without a manual reload.
- [ ] **AC-10** — Dashboard shows summary cards: total activities, total distance (km), total time (h:m), avg HR (bpm), computed from synced activities.
- [ ] **AC-11** — Dashboard chart plots weekly training load over the last 12 weeks; empty weeks show 0.
- [ ] **AC-12** — Activities table shows type, date, distance (km), duration (h:m), avg HR, training load; default sort newest-first; type filter works.
- [ ] **AC-13** — Distinct empty (no activities) and not-connected states are shown with guidance.
- [ ] **AC-14** — A backend failure on load or sync surfaces a non-blocking error and does not crash the UI.
- [ ] **AC-15** — All displayed units are metric and produced by shared formatters.
- [ ] **AC-16** — Unit tests cover the formatters and key components; tests pass.
- [ ] **AC-17** — README documents the local run sequence and required env vars.

## Interview Notes
- Stack/architecture (Next.js App Router + TS, Tailwind + shadcn, BFF proxy) and the four core decisions were settled during planning prior to intake; see `source_of_truth.md` Key Decisions Log.
- Agent-suggested and user-accepted in analyze: metric units (no toggle), training-load chart as a rolling 12-week weekly aggregation, disconnect deferred out of scope, testing limited to component/unit this iteration.

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-01
