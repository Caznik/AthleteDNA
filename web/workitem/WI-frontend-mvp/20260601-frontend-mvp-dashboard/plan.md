---
wi: WI-frontend-mvp / 20260601-frontend-mvp-dashboard
phase: plan
status: confirmed
date: 2026-06-01
approach: Approach B — Client SPA with TanStack Query over BFF Route Handlers
---

## Context
**Selected approach:** Approach B — Client SPA with TanStack Query; Next.js Route Handlers proxy to Spring Boot (BFF), browser talks only to Next.js JSON routes.
**AC coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17 *(all 17)*

**Codebase facts grounding the plan:**
- `ActivityWebMapper` is a static utility used by `ActivityController`; `Activity` domain model has no training-load field; `TrainingLoadCalculator` is a domain service. → to expose `trainingLoad`, the mapper must obtain a calculator instance (make it an injectable `@Component`).
- Strava endpoints are `@Profile("jpa")`. `CompleteStravaAuthService` already resolves `userId` via OAuth state; `InitiateStravaAuthService` uses `CurrentUserProvider`. `StravaAccountRepository.findByUserId` exists — sufficient for a link-status check.
- `callback` currently returns JSON; it's hit by the browser via Strava redirect, so it must 302 instead. `InvalidOAuthStateException` is currently mapped to a JSON 400 by `StravaExceptionHandler` — the callback needs local handling to redirect with an error param instead.
- No `frontend-url` config exists yet.

---

## Implementation Sequence

### Step 1 — Backend: expose `trainingLoad` on activities
**Satisfies:** AC-3
**Files:** `infrastructure/web/dtos/ActivityDTO.java`, `infrastructure/web/mappers/ActivityWebMapper.java`, `infrastructure/web/controllers/ActivityController.java`, `config/DomainConfig.java` (verify `TrainingLoadCalculator` bean), new test `ActivityWebMapperTest.java`
**Description:** Add nullable `Long trainingLoad` to `ActivityDTO`. Convert `ActivityWebMapper` to an injectable `@Component` holding `TrainingLoadCalculator`; `toDTO` sets `trainingLoad = calculator.calculate(domain)`. `toDomain` ignores it (derived field; keeps `activities/sync` input compatible). Inject the mapper into `ActivityController`. Unit-test the mapping.

### Step 2 — Backend: Strava link-status endpoint
**Satisfies:** AC-1
**Files:** new `application/port/in/IsStravaLinkedUseCase.java`, new `application/usecases/IsStravaLinkedService.java` (`@Profile("jpa")`), `infrastructure/web/controllers/StravaController.java`, new test `IsStravaLinkedServiceTest.java`
**Description:** New use case `isLinkedForCurrentUser()` → `CurrentUserProvider.current()` + `StravaAccountRepository.findByUserId(...).isPresent()`. Add `GET api/strava/status` → `{ "linked": <bool> }`. Test linked/not-linked.

### Step 3 — Backend: callback 302-redirect + frontend-url config
**Satisfies:** AC-2
**Files:** new `config/AppProperties.java` (`@ConfigurationProperties("app")`, field `frontendUrl`), `application.properties` (`app.frontend-url=${FRONTEND_URL:http://localhost:3000}`), `infrastructure/web/controllers/StravaController.java`, new/updated controller test
**Description:** Inject `AppProperties` into `StravaController`. Change `callback` to return a 302 (`ResponseEntity` with `Location`) to `${frontendUrl}/strava/linked` on success; catch `InvalidOAuthStateException` locally and 302 to `${frontendUrl}/strava/linked?error=invalid_state`. Test both redirects (location header + status).

### Step 4 — Frontend: scaffold project
**Satisfies:** AC-4
**Files:** `web/frontend/**` (Next.js App Router + TS + Tailwind + ESLint), `package.json`, `tailwind.config`, `components.json` (shadcn), `.env.local.example` (`BACKEND_URL`), add deps: `@tanstack/react-query`, shadcn components (`button card table badge skeleton sonner chart`), `recharts`, Vitest + Testing Library
**Description:** `create-next-app` in `web/frontend`, init shadcn, add TanStack Query + test tooling. App shell layout (sidebar/topbar). Verify `npm run dev`, `npm run build`, `npm run lint`.

### Step 5 — Frontend: BFF Route Handlers + typed contracts
**Satisfies:** AC-5
**Files:** `src/lib/types.ts`, `src/lib/backend.ts` (server-only fetch wrapper reading `BACKEND_URL`), `src/app/api/strava/connect/route.ts`, `src/app/api/strava/sync/route.ts`, `src/app/api/strava/status/route.ts`, `src/app/api/activities/route.ts`
**Description:** Types mirror backend (`Activity` incl. `trainingLoad`, `{authorizationUrl}`, `{linked}`, `{synced}`). Route Handlers proxy each backend call server-side so the browser never hits Spring directly and no CORS is needed.

### Step 6 — Frontend: Query client + API hooks
**Satisfies:** AC-5, AC-9, AC-14
**Files:** `src/app/providers.tsx` (QueryClientProvider + Toaster), `src/lib/queries.ts` (`useActivities`, `useStravaStatus`, `useConnect`, `useSync` mutations with cache invalidation), wire provider into `app/layout.tsx`
**Description:** Client query/mutation hooks calling the Route Handlers. `useSync` invalidates the activities + status queries on success. Centralized error surfacing for failed fetches/mutations (feeds AC-14).

### Step 7 — Frontend: connect flow, linked page, connection indicator
**Satisfies:** AC-6, AC-7, AC-8
**Files:** `src/components/connection-banner.tsx`, `src/app/strava/linked/page.tsx`, connect button wiring
**Description:** Connect button → `useConnect` → `window.location = authorizationUrl`. `/strava/linked` calls status (not assuming success) and shows connected + dashboard link, or not-connected + Connect CTA, plus an error message when `?error=` present. Connection banner reflects `useStravaStatus`.

### Step 8 — Frontend: sync action
**Satisfies:** AC-9
**Files:** `src/components/sync-button.tsx`
**Description:** Sync button → `useSync` → on success toast `"{n} activities synced"` and invalidate queries so dashboard + table update without reload; disabled/loading state while pending.

### Step 9 — Frontend: metric formatters + unit tests
**Satisfies:** AC-15, AC-16
**Files:** `src/lib/format.ts` (`formatDistanceKm`, `formatDuration`, `formatHr`, `formatDate`), `src/lib/format.test.ts`, component tests for summary cards / table / connection banner
**Description:** Shared metric formatters used everywhere. Vitest + Testing Library unit tests for formatters and key components.

### Step 10 — Frontend: dashboard (cards + weekly load chart)
**Satisfies:** AC-10, AC-11
**Files:** `src/app/page.tsx`, `src/components/summary-cards.tsx`, `src/components/training-load-chart.tsx`, `src/lib/aggregate.ts` (+ test)
**Description:** Summary cards (count, total distance km, total time h:m, avg HR). `aggregate.ts` buckets `trainingLoad` by ISO week over the last 12 weeks (empty weeks = 0); chart renders via shadcn/Recharts. Aggregation helper unit-tested.

### Step 11 — Frontend: activities table
**Satisfies:** AC-12
**Files:** `src/app/activities/page.tsx`, `src/components/activities-table.tsx`
**Description:** shadcn Table — type, date, distance km, duration h:m, avg HR, training load. Default sort newest-first; client-side type filter (from query data).

### Step 12 — Frontend: empty / not-connected / error states
**Satisfies:** AC-13, AC-14
**Files:** `src/components/empty-state.tsx`, error/empty handling in dashboard + activities pages
**Description:** Distinct not-connected state (guide to Connect) vs. connected-but-no-activities (guide to Sync). Backend-unreachable or failed sync surfaces a non-blocking toast/banner; no crash.

### Step 13 — Docs & final gates
**Satisfies:** AC-4, AC-17
**Files:** `web/frontend/README.md` (or root README section)
**Description:** Document run sequence (Postgres via compose → backend `--spring.profiles.active=jpa,local` → frontend `npm run dev`) and env vars (`BACKEND_URL` on frontend, `FRONTEND_URL` on backend). Final `npm run build` + `npm run lint` + backend `mvnw test` green.

---

## Risks / Known Unknowns
- **Node/Next version:** Next.js (latest) needs Node ≥ 18.18. Assumed available on the dev machine; verify in Step 4.
- **shadcn chart + client components:** chart is a client component fed by TanStack Query data — straightforward, but the shadcn `chart` registry pulls Recharts; confirm versions resolve cleanly.
- **End-to-end OAuth test:** requires Postgres up and backend run with `jpa,local`; `ddl-auto=update` creates tables. Without those, FE is verified against the BFF with the backend reachable but Strava link exercised manually.
- **`ActivityDTO` reuse on input:** `activities/sync` accepts `ActivityDTO`; adding nullable `trainingLoad` is backward-compatible since `toDomain` ignores it. Confirm no serializer strictness breaks.
- **`trainingLoad` magnitude:** `duration × avgHr` as `Long` can be large but well within JSON number range; FE treats as number.
- **Spring Boot 4 specifics:** redirect via `ResponseEntity` 302 is version-agnostic; no concern, but the existing `@RestControllerAdvice` must not intercept the callback's invalid-state path (handled locally in Step 3).

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-01. Implementation deliberately deferred to next session (token budget). Resume with `/dako:wi-implement` — next step is Step 1 (backend trainingLoad).

## Cancellation
_n/a_
