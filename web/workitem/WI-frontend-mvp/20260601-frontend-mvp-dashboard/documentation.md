---
wi: WI-frontend-mvp / 20260601-frontend-mvp-dashboard
phase: documentation
status: confirmed
date: 2026-06-01
project-docs-found: yes
---

## Project Documentation Updated
| File | Section | Change |
|---|---|---|
| `web/README.md` | (new file) | Created project-level README: structure, full-stack run sequence, the backend HTTP API table (incl. the 3 new/changed endpoints), and backend configuration (`app.frontend-url`, Strava props). |
| `web/frontend/README.md` | (whole file) | Authored as part of this workitem (AC-17): stack, env vars, local run sequence, scripts, frontend architecture. |

## Workitem Documentation

### What was built
A first-iteration web frontend for AthleteDNA plus the small backend changes it
needed. The frontend (in `web/frontend`) is a Next.js (App Router) + TypeScript
single-page-style app, styled with Tailwind + shadcn/ui, that lets a user:

- connect their Strava account,
- sync activities from Strava,
- see a dashboard (summary cards + a weekly training-load chart), and
- browse all activities in a sortable, type-filterable table.

The browser never calls the Spring Boot backend directly. Instead it calls the
frontend's own `/api/*` Route Handlers, which proxy to the backend server-side
(Backend-for-Frontend pattern). This avoids CORS and gives a clean place to add a
real auth/session layer later.

Three backend changes supported the UI:
1. `GET api/strava/status` → `{ linked }` so the UI can show connected vs. not.
2. `api/strava/callback` now issues a `302` redirect back to the frontend
   (`/strava/linked`) instead of returning JSON, so the user lands in the app after
   authorizing on Strava.
3. `ActivityDTO` gained a derived `trainingLoad` field so the dashboard chart has a
   single, server-authoritative number to plot.

### How it works
- **BFF boundary (hard guarantee):** `src/lib/backend.ts` imports `server-only`, so
  any accidental import into client code fails the build. Only the Route Handlers
  under `src/app/api/**` use it; `BACKEND_URL` is never shipped to the browser.
- **Data flow:** TanStack Query owns client-side fetching/caching
  (`src/lib/queries.ts`). `useSync` invalidates both the activities and Strava-status
  caches on success, so the dashboard/table refresh without a manual reload, and a
  `"{n} activities synced"` toast fires.
- **`/strava/linked` is honest:** rather than assuming success because the user
  landed there, the page calls `api/strava/status` and renders the real state
  (connected → dashboard link; not connected → Connect CTA; `?error=` → error
  message).
- **Training load:** computed server-side only (`TrainingLoadCalculator` =
  `duration × avgHr`, null-safe). `ActivityWebMapper` became an injectable
  `@Component` so `toDTO` can call the calculator; `toDomain` deliberately ignores
  `trainingLoad` so the `activities/sync` input contract stays backward-compatible.
- **Weekly aggregation:** `src/lib/aggregate.ts#weeklyTrainingLoad` buckets activity
  `trainingLoad` into the last 12 ISO weeks (Monday-anchored, UTC); weeks with no
  activity render as `0`.
- **Callback redirect detail:** `StravaController.callback` catches
  `InvalidOAuthStateException` locally and redirects with `?error=invalid_state`,
  bypassing the `@RestControllerAdvice` that would otherwise return JSON — necessary
  because the callback is hit by a browser redirect, not an API client.
- **Config:** `AppProperties` (`@ConfigurationProperties("app")`, registered via
  `@EnableConfigurationProperties` in `DomainConfig`) holds `frontendUrl`; kept
  loadable under the default profile so the existing `contextLoads` test is
  unaffected.

### Usage
Run the stack as documented in `web/README.md` / `web/frontend/README.md`
(Postgres → backend with `jpa,local` profiles → `npm run dev`). Then, in the app:
1. Click **Connect** → authorize on Strava → you are redirected back to
   `/strava/linked`.
2. Click **Sync** → activities are pulled; a toast confirms the count and the views
   refresh.
3. View the **dashboard** (totals + 12-week load chart) and the **Activities** table
   (sort newest-first, filter by type).

All displayed units are metric (km, h:m, bpm) via shared formatters in
`src/lib/format.ts`.

### Known limitations
Review verdict was **pass** with no accepted AC gaps. Residual notes:
- **Manual end-to-end OAuth not exercised in-sandbox.** Backend redirect/status are
  unit-tested and the UI/BFF are component-tested + build-verified; a live
  Strava-link smoke run (real creds + Postgres + `jpa,local`) is recommended before
  any deployment.
- **Out of scope this iteration:** disconnect/unlink Strava, real auth/multi-user,
  imperial units, E2E tests, activity pagination, activity detail pages, and Strava
  webhooks/auto-sync.
- **Build environment:** no JDK is on PATH (only a Java 8 JRE); backend tests were run
  with JDK 21 from Android Studio's bundled JBR. CI/other machines need JDK 21
  available.

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-01.

## Cancellation
_n/a_
