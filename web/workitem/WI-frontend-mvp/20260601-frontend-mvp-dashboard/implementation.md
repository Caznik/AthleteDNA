---
wi: WI-frontend-mvp / 20260601-frontend-mvp-dashboard
phase: implementation
status: completed
date: 2026-06-01
---

## Architecture Notes

### Backend (hexagonal, Spring Boot 4)
- **Ports/adapters layout confirmed:** in-ports live in `application/port/in`, their impls in `application/usecases` annotated `@Service` (+ `@Profile("jpa")` for Strava-dependent ones). New `IsStravaLinkedUseCase`/`IsStravaLinkedService` follow this exactly, mirroring `InitiateStravaAuthService` (uses `CurrentUserProvider.current()` + a repository).
- **Config props pattern:** `StravaProperties` is a `record` annotated `@ConfigurationProperties(prefix=...)` and registered via `@EnableConfigurationProperties(StravaProperties.class)` in `StravaConfig` — there is NO `@ConfigurationPropertiesScan`. New `AppProperties` follows the same: a record + explicit `@EnableConfigurationProperties` (added to `DomainConfig`, the only non-Strava `@Configuration`). This keeps it loadable under the default profile so `contextLoads` (no `jpa` profile) is unaffected.
- **ActivityWebMapper conversion:** currently a static utility with `static` methods, called via method refs (`ActivityWebMapper::toDTO`). Plan converts it to an injectable `@Component` holding `TrainingLoadCalculator` (already a `@Bean` in `DomainConfig`). `ActivityController` switches from static refs to an injected instance (`mapper::toDTO`). `toDomain` deliberately ignores the new field (derived), keeping `activities/sync` input backward-compatible.
- **TrainingLoadCalculator** = `duration(sec) * avgHr`, null-safe → `Long`. Mapper sets `trainingLoad = calculator.calculate(domain)`.
- **Callback redirect:** `callback` is hit by the browser via Strava's redirect, so it must 302 (was returning JSON `{status:linked}`). `@RestControllerAdvice StravaExceptionHandler` maps `InvalidOAuthStateException` → JSON 400; the callback must catch it locally and 302 to an error page instead, bypassing the advice. Will return `ResponseEntity<Void>` with `Location` header (version-agnostic, no `RedirectView` dependency).
- **Tests:** project uses plain JUnit5 + Mockito + AssertJ unit tests (no MockMvc anywhere except `@SpringBootTest contextLoads`). New backend tests follow the constructor-injected-mock unit style of `CompleteStravaAuthServiceTest`/`ActivitiesSearchUseCaseTest`. Controller redirect is verified by direct method call asserting `ResponseEntity` status + `Location` header (no web layer needed).

### Frontend (Next.js App Router + BFF)
- `web/frontend` is currently empty. Node v22.16 / npm 10.9.2 available (≥18.18 OK).
- **BFF discipline (AC-5):** browser only calls Next.js Route Handlers under `/api/*`; handlers use a server-only `backend.ts` fetch wrapper reading `BACKEND_URL`. No client code imports `BACKEND_URL`; no CORS config on Spring.
- **Backend contract mirrored in `types.ts`:** activity DTO fields are `{id,type,distance(Double km? -> see note),duration(sec Integer),avgHr(Integer),externalStravaId,startDate(Instant ISO),trainingLoad(Long)}`. NOTE: backend `distance` is a `Double`; unit (m vs km) is whatever Strava sync stored — formatters treat the raw number and `formatDistanceKm` divides by 1000 (Strava distances are meters). connect→`{authorizationUrl}`, status→`{linked}`, sync→`{synced}`.
- Backend endpoints: `GET api/strava/connect`, `GET api/strava/status` (new), `POST api/strava/sync`, `GET activities/getAll`. Note `activities` has NO `api/` prefix (Endpoints.ACTIVITIES_ENDPOINT = "activities"); BFF wrapper must use the correct backend paths.

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 4 | Scaffold via `create-next-app` + `shadcn init` CLIs | Scaffolded `web/frontend` manually with pinned `package.json` and hand-authored config + shadcn-equivalent UI primitives (button/card/table/badge/skeleton) | The interactive CLIs prompt and pull "latest", which is non-deterministic in this environment; manual pinned setup is reproducible and yields the same App Router + TS + Tailwind + shadcn structure. |
| 4 | Pin `next` at create-next-app latest | Pinned `next`/`eslint-config-next` to `15.5.18` | `15.1.3` carries a critical CVE (CVE-2025-66478); bumped to the patched 15.5.x line. Security patch, no API change. |
| 4 | `sonner` shadcn component | Used the `sonner` package's `Toaster`/`toast` directly (wired in `providers.tsx`) | The shadcn `sonner` wrapper just re-exports `sonner`; using it directly avoids a `next-themes` dependency wrinkle while delivering identical toast behavior. |
| 5 | (implicit) | Added `server-only` dependency for `backend.ts` | Enforces at build time that the BFF fetch wrapper can never be imported into client code (hard guarantee for AC-5). |
| 9 | shadcn `chart` registry component | Charted directly with Recharts primitives inside a shadcn `Card` | The shadcn `chart` wrapper is a thin Recharts container; using Recharts directly is simpler and avoids registry version churn. Same visual outcome. |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `StravaControllerTest::status_returnsLinkedTrue` / `status_returnsLinkedFalse`; `IsStravaLinkedServiceTest` (2 tests). `StravaController.status()` → `{linked:<bool>}` via `IsStravaLinkedUseCase`. | COVERED |
| AC-2 | `StravaControllerTest::callback_success_redirectsToLinkedPage` (302 + `Location` = `${frontendUrl}/strava/linked`) and `callback_invalidState_redirectsToErrorState` (302 + `...?error=invalid_state`). | COVERED |
| AC-3 | `ActivityWebMapperTest::toDTO_populatesTrainingLoadFromCalculator` (asserts `3600*150`); `ActivityDTO` now carries `trainingLoad`; `ActivityController.getAll` maps via injected `ActivityWebMapper`. | COVERED |
| AC-4 | `npm run build` ✓ (10 routes compiled), `npm run lint` ✓ (no warnings/errors), `npm run dev` script present. `frontend/package.json`. | COVERED |
| AC-5 | `src/lib/backend.ts` imports `server-only`; all browser calls go to `src/app/api/**` Route Handlers; no client module references `BACKEND_URL`. Build shows `/api/*` as server-rendered (ƒ). No CORS config added to Spring. | COVERED |
| AC-6 | `connection-banner.tsx` `handleConnect` → `useConnect` (`/api/strava/connect`) → `window.location.href = authorizationUrl`. `connect/route.ts` proxies backend `api/strava/connect`. `connection-banner.test.tsx::shows a connect CTA`. | COVERED |
| AC-7 | `src/app/strava/linked/page.tsx` confirms via `useStravaStatus` (connected → "Go to dashboard" link). Backend redirect target verified by AC-2 tests. | COVERED |
| AC-8 | `connection-banner.test.tsx` (4 tests: CTA when not linked, badge when linked, skeleton loading, error badge) driven by `useStravaStatus` → `/api/strava/status`. | COVERED |
| AC-9 | `sync-button.tsx` → `useSync` (`/api/strava/sync` POST); `queries.ts useSync` toasts `${synced} activities synced` and invalidates `activitiesKey` + `stravaStatusKey` (refresh without reload). | COVERED |
| AC-10 | `summary-cards.test.tsx::renders four cards with metric-formatted totals` (count, 15.00 km, 1h 30m, 140 bpm). `summarize()` in `aggregate.ts`. | COVERED |
| AC-11 | `aggregate.test.ts` weeklyTrainingLoad: 12 buckets, empty weeks 0, correct bucketing, window exclusion, same-week summing (5 tests). `training-load-chart.tsx` renders via Recharts. | COVERED |
| AC-12 | `activities-table.test.tsx`: newest-first default sort, type filter narrows rows, metric-formatted columns (3 tests). Columns type/date/distance/duration/avgHr/trainingLoad. | COVERED |
| AC-13 | `page.tsx` + `activities/page.tsx` render distinct `EmptyState`: not-connected (Connect CTA) vs connected-no-activities (Sync CTA). `empty-state.tsx`. | COVERED |
| AC-14 | Route Handlers return 502 on backend failure (try/catch); `queries.ts` mutations `onError` toast; query `isError` branch in pages shows non-blocking EmptyState + Sync. `connection-banner.test.tsx::shows an error badge`. | COVERED |
| AC-15 | `format.test.ts` (10 tests) — all display units (km/h:m/bpm) flow through `src/lib/format.ts`; components import these formatters only. | COVERED |
| AC-16 | `npm test` → 28 tests pass across format, aggregate, summary-cards, activities-table, connection-banner. | COVERED |
| AC-17 | `frontend/README.md` documents env vars (`BACKEND_URL`, `FRONTEND_URL`) and the Postgres → backend `jpa,local` → `npm run dev` run sequence. | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1, AC-2, AC-3 (backend) | PASS — 39/39 backend tests green incl. new `ActivityWebMapperTest` (4), `IsStravaLinkedServiceTest` (2), `StravaControllerTest` (6) | TDD: wrote failing tests then implementation; ran `mvnw test` with JDK 21 (JBR). |
| 2 | AC-11, AC-10, AC-15 (pure logic) | PASS — 19/19 (`format.test.ts` 10, `aggregate.test.ts` 9) | Authored formatters + aggregation with tests; `vitest run`. |
| 3 | AC-8, AC-10, AC-12, AC-14, AC-16 (components) | PASS — 28/28 frontend tests (added summary-cards, activities-table, connection-banner) | Component tests via Testing Library; `npm test`. |
| 4 | AC-4, AC-5 (gates) | PASS — `npm run lint` clean; `npm run build` compiled 10 routes; `/api/*` server-rendered (BFF) | Ran lint + build; confirmed no CORS and server-only BFF boundary. |
| 5 | All 17 AC | PASS — every AC Pre-Check row COVERED with a test or build/lint/file evidence | Final review of AC table against artifacts. |

## Regression
**Test suite run:** yes (backend Maven + frontend Vitest)
**Result:** pass
- Backend: `mvnw test` → `Tests run: 39, Failures: 0, Errors: 0, Skipped: 0` — BUILD SUCCESS. Includes pre-existing `@SpringBootTest contextLoads` (default profile) which still passes after adding `AppProperties`/`@EnableConfigurationProperties` and converting `ActivityWebMapper` to a `@Component`.
- Frontend: `npm test` → 28 passed (5 files); `npm run build` ✓; `npm run lint` ✓ (no warnings/errors).
**Failures:** none.
**Environment note:** No JDK is on the shell PATH (only a Java 8 JRE). Tests were run with `JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"` (OpenJDK 21.0.8), matching the project's `<java.version>21</java.version>`. CI / other machines need a JDK 21 on PATH or `JAVA_HOME` set.
**Manual verification not performed:** true end-to-end Strava OAuth (requires Postgres up + backend run with `jpa,local` profiles + live Strava redirect) was not exercised in this sandbox; the backend redirect/status behavior is covered by unit tests and the BFF/UI by component tests + a clean production build.
