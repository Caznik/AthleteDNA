# AthleteDNA Frontend

Next.js (App Router) + TypeScript dashboard for the AthleteDNA Strava integration.
The browser talks **only** to this app's Route Handlers (`/api/*`), which proxy to
the Spring Boot backend (Backend-for-Frontend pattern). No CORS configuration is
required on the backend.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui primitives
- TanStack Query (data fetching + cache invalidation)
- Recharts (weekly training-load chart)
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
- `src/lib/queries.ts` — TanStack Query hooks; `useSync` invalidates the activities
  and status caches on success so the UI refreshes without a reload.
- `src/lib/format.ts` — shared metric formatters (km, h:m, bpm).
- `src/lib/aggregate.ts` — pure aggregations: summary totals, weekly training-load
  bucketing, `filterWithinDays` (the single source of truth for the dashboard
  time-range window — returns activities within the last N days), `countsByType`
  (per-type counts of an already-filtered list), and `countsByTypeWithinDays`
  (composed from the two).
- `src/app/page.tsx` — the dashboard owns the **dashboard-wide time-range filter**:
  a header `<select>` (7d / 30d / 6m / 1y, default 30d, persisted under
  `dashboard.range`). It calls `filterWithinDays(activities, days)` once and feeds
  the filtered list to both the summary cards and the distribution pie, while the
  Training Load chart receives the full unfiltered list (it keeps its own fixed
  12-week window).
- `src/components/chart-panel.tsx` — dashboard chart panel; owns the `Card` frame, a
  dynamic title, and a `<select>` that switches between the "Activities distribution"
  pie and the "Training load (last 12 weeks)" chart. It takes `filtered` (drives the
  pie) and `all` (drives Training Load) as props — it no longer owns a time-range
  control. The two chart components (`activity-type-chart.tsx`,
  `training-load-chart.tsx`) are frameless bodies.
- `src/lib/use-persisted-state.ts` — SSR-safe localStorage-backed state (remembers
  both the selected dashboard chart and the selected time range across reloads).
