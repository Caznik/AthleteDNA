# AthleteDNA Frontend

Next.js (App Router) + TypeScript dashboard for the AthleteDNA Strava integration.
The browser talks **only** to this app's Route Handlers (`/api/*`), which proxy to
the Spring Boot backend (Backend-for-Frontend pattern). No CORS configuration is
required on the backend.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui primitives
- TanStack Query (data fetching + cache invalidation)
- Recharts (PMC fitness/fatigue chart, weekly-load + distribution charts)
- Vitest + Testing Library (unit/component tests)

## Environment

Copy `.env.local.example` to `.env.local`:

```
BACKEND_URL=http://localhost:8080
```

`BACKEND_URL` is read **server-side only** by the BFF Route Handlers; it is never
exposed to the browser.

The backend reads `FRONTEND_URL` (default `http://localhost:3000`) to build the
Strava OAuth callback redirect target.

## Local run sequence

The full flow needs Postgres, the backend (with real Strava credentials), and this
frontend.

1. **Postgres** — start via Docker Compose:
   ```
   docker compose up -d postgres
   ```
2. **Backend** — from `backend/athletedna`, run with the `jpa` and `local` profiles
   (the `local` profile supplies real Strava credentials from the gitignored
   `application-local.properties`):
   ```
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=jpa,local
   ```
   The backend listens on `http://localhost:8080`.
3. **Frontend** — from `web/frontend`:
   ```
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```
   Open `http://localhost:3000`.

> Without Postgres + the `jpa,local` backend profiles, the Strava endpoints
> (`connect`/`status`/`sync`/`callback`) are not active. The dashboard and table
> still render (empty / not-connected states), but a real Strava link requires the
> full stack.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Vitest watch mode |

## Architecture

- `src/lib/backend.ts` — server-only fetch wrapper (reads `BACKEND_URL`).
- `src/app/api/**` — BFF Route Handlers proxying `connect`, `status`, `sync`,
  `activities`, and auth (`login`, `register`, `me`, `me/photo`). `me/photo` is special:
  `PUT`/`DELETE` proxy JSON via `authedBackendFetch`, but `GET` is a hand-rolled binary
  relay (it streams the image bytes back, since `backend.ts` forces JSON).
- `src/lib/photo.ts` — `photoSrc(user)` builds the `/api/auth/me/photo?v=<photoUpdatedAt>`
  URL (or `null` when the user has no photo); the `?v=` token busts the browser cache on
  upload/remove. Rendered as `<AvatarImage>` over the initials `<AvatarFallback>` in the
  profile header and the top-nav avatar.
- `src/lib/auth-queries.ts` — `useUploadPhoto`/`useRemovePhoto` mutations write the updated
  user into the cache and `invalidateQueries` so the nav avatar refreshes without a reload.
- **Theme (light / dark / system).** `next-themes` `ThemeProvider` (`attribute="class"`,
  `defaultTheme="system"`) is wired in `src/app/providers.tsx`; it toggles `.dark` on `<html>`
  (which carries `suppressHydrationWarning`) and its blocking script prevents a flash of the
  wrong theme. The preference is persisted per-user on the backend: the `Appearance` card
  (`src/components/profile-theme-form.tsx`, a segmented control built from `buttonVariants`)
  calls `setTheme()` for an instant switch and fires the `useUpdateTheme` mutation
  (`PUT /api/auth/me/theme` BFF route → backend). `src/components/theme-sync.tsx`, rendered
  app-wide inside `ThemeProvider`, reads `useCurrentUser` and pushes the backend
  `themePreference` into `setTheme` so the stored theme is restored on login and on a fresh
  device — not only on the Profile page.
- `src/lib/queries.ts` — TanStack Query hooks; `useSync` invalidates the activities
  and status caches on success so the UI refreshes without a reload. `useTrainingInsights`
  (key `["insights","training"]`) fetches the `/api/insights/training` BFF route; it is **not**
  invalidated by `useSync` — the Insights page exposes a manual **Refresh** button instead
  (Strava's API is rate-limited, so refreshes are user-initiated).
- `src/lib/format.ts` — shared metric formatters (km, h:m, bpm, and `formatPace` →
  `m:ss/km`, with non-positive/missing values rendered as "—").
- `src/lib/aggregate.ts` — pure aggregations: summary totals, `filterWithinDays` (the
  single source of truth for the dashboard time-range window — returns activities within
  the last N days), `filterSeriesWithinDays` (its sibling for engine PMC series points,
  which carry a calendar `date` instead of an Activity `startDate`), `countsByType`
  (per-type counts of an already-filtered list), and `countsByTypeWithinDays`
  (composed from the two). *(The former client-side `weeklyTrainingLoad` approximation
  was removed — weekly load now comes from the insight engine; see the Insights page.)*
- `src/app/page.tsx` — the dashboard owns the **dashboard-wide time-range filter**:
  a header `<select>` (7d / 30d / 6m / 1y, default 30d, persisted under
  `dashboard.range`). It calls `filterWithinDays(activities, days)` once and feeds the
  filtered list to both the summary cards and the distribution pie.
- `src/components/chart-panel.tsx` — dashboard chart panel; owns the `Card` frame and
  renders the "Activities distribution" pie for the `filtered` list. (It previously had a
  selector switching to a client-side training-load chart; that was retired when weekly
  load moved to the Insights page, so the panel is now distribution-only.)
- `src/app/insights/page.tsx` — the **Insights dashboard** (`/insights`, linked from the
  top-nav "Insights" tab). Consumes `useTrainingInsights()` and renders, in order:
  `current-form-cards.tsx` (Fitness/Fatigue/Form snapshot + a form badge), a Performance
  Management Chart (`pmc-chart.tsx` — CTL/ATL on the left axis, TSB on a secondary right
  axis) with a trends readout, `weekly-load-chart.tsx` (engine `weeklyLoad`), and
  `personal-records-table.tsx`. A header `<select>` (7d / 15d / 30d / 6 months, default 30d,
  persisted under `insights.range`) narrows **only** the PMC chart via `filterSeriesWithinDays`;
  a **Refresh** button calls the query's `refetch()`. Handles loading (skeleton), empty
  (`pmc.series` empty → "sync your training data"), `503` ("temporarily unavailable"), and
  generic-error states.
- `src/lib/use-persisted-state.ts` — SSR-safe localStorage-backed state (remembers the
  dashboard time range under `dashboard.range` and the Insights PMC range under
  `insights.range` across reloads).
