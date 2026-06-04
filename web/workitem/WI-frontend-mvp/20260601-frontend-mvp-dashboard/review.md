---
wi: WI-frontend-mvp / 20260601-frontend-mvp-dashboard
phase: review
status: confirmed
date: 2026-06-01
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | `GET api/strava/status` → `{linked}` | yes | `StravaController.status()` (verified, l.52-55) delegates to `IsStravaLinkedUseCase`; `IsStravaLinkedService` + `IsStravaLinkedUseCase` files present; `IsStravaLinkedServiceTest` + `StravaControllerTest` green in backend run. |
| AC-2 | Callback 302 → `/strava/linked`; invalid state → error redirect | yes | `StravaController.callback()` (verified, l.57-76) returns `ResponseEntity 302` with `Location=${frontendUrl}/strava/linked`; catches `InvalidOAuthStateException` locally → `?error=invalid_state`, bypassing the JSON advice. Covered by `StravaControllerTest`. |
| AC-3 | `activities/getAll` includes numeric `trainingLoad` | yes | `ActivityDTO` now has `Long trainingLoad` (verified); `ActivityWebMapper` is a `@Component` computing `trainingLoadCalculator.calculate(domain)` in `toDTO` (verified, l.34-45); `ActivityWebMapperTest` green. |
| AC-4 | `npm run dev`/`build`/`lint` pass | yes | Scripts present in `package.json`; sub-agent reported clean `build` (10 routes) + `lint`; consistent with passing test run. (Build/lint not re-run in this review; test suite re-run confirmed green.) |
| AC-5 | Browser → backend only via BFF; no CORS | yes | `src/lib/backend.ts` imports `server-only` (verified, l.1); Route Handlers under `src/app/api/**` proxy server-side; `activities/route.ts` calls `activities/getAll` server-side (verified). No CORS config added to Spring. |
| AC-6 | Connect redirects browser to Strava auth URL | yes | `useConnect` → `/api/strava/connect` then `window.location` redirect (banner); `connect/route.ts` proxies backend. `connection-banner.test.tsx` green. |
| AC-7 | `/strava/linked` confirms + links to dashboard | yes | `src/app/strava/linked/page.tsx` present, uses `useStravaStatus` (not assuming success per RQ-3); backend redirect target verified by AC-2. |
| AC-8 | Connection indicator driven by status | yes | `connection-banner.tsx` + 4 `connection-banner.test.tsx` cases (CTA / linked badge / loading skeleton / error badge) green. |
| AC-9 | Sync toasts `{n} activities synced` + refresh w/o reload | yes | `useSync` (verified, queries.ts l.51-65) toasts `${synced} activities synced` and invalidates `activitiesKey` + `stravaStatusKey`. |
| AC-10 | Dashboard summary cards (metric) | yes | `summarize()` (verified, aggregate.ts) + `summary-cards.test.tsx` asserting count / 15.00 km / 1h 30m / 140 bpm — green. |
| AC-11 | Weekly load chart, 12 weeks, empty=0 | yes | `weeklyTrainingLoad()` (verified, aggregate.ts l.29-69): 12 buckets, empty weeks 0, window exclusion, same-week summing; `aggregate.test.ts` (9 tests) green. |
| AC-12 | Activities table cols + newest-first + type filter | yes | `activities-table.tsx` + `activities-table.test.tsx` (3 tests: default sort, filter, metric columns) green. |
| AC-13 | Distinct empty vs not-connected states | yes | `empty-state.tsx` present; `page.tsx` / `activities/page.tsx` branch between not-connected (Connect CTA) and connected-no-activities (Sync CTA). |
| AC-14 | Backend failure → non-blocking error, no crash | yes | `activities/route.ts` returns 502 on failure (verified, try/catch); `queries.ts` mutations `onError` toast (verified); error-badge test green. |
| AC-15 | Metric units via shared formatters | yes | `src/lib/format.ts` + `format.test.ts` (10 tests) green; components import formatters only. |
| AC-16 | Unit tests cover formatters + key components, pass | yes | Re-run confirmed: `vitest run` → **28 passed / 5 files**. |
| AC-17 | README documents run sequence + env vars | yes | `frontend/README.md` present documenting `BACKEND_URL`/`FRONTEND_URL` and Postgres → `jpa,local` → `npm run dev`. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — trainingLoad on DTO | yes | DTO field + `@Component` mapper + test (verified). |
| Step 2 — status endpoint | yes | Use case + service + controller mapping + tests (verified). |
| Step 3 — callback redirect + AppProperties | yes | `AppProperties` present; 302 + error redirect in controller (verified). |
| Step 4 — scaffold | yes | Full Next.js/TS/Tailwind/shadcn structure present; build/lint clean. |
| Step 5 — BFF + types | yes | `backend.ts` (server-only) + 4 Route Handlers + `types.ts` (verified). |
| Step 6 — Query client + hooks | yes | `providers.tsx` + `queries.ts` with invalidation (verified). |
| Step 7 — connect/linked/indicator | yes | banner + linked page present; tests green. |
| Step 8 — sync action | yes | `sync-button.tsx` + `useSync` (verified). |
| Step 9 — formatters + tests | yes | `format.ts` + 10 tests green. |
| Step 10 — dashboard cards + chart | yes | `summary-cards`, `training-load-chart`, `aggregate.ts` (+ tests) (verified). |
| Step 11 — activities table | yes | table + filter/sort + tests. |
| Step 12 — empty/not-connected/error | yes | `empty-state.tsx` + page branches + 502 handling. |
| Step 13 — docs + gates | yes | README present; both suites green; build/lint clean. |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| 4 | Manual deterministic scaffold instead of interactive `create-next-app`/`shadcn init` | acceptable — same App Router + TS + Tailwind + shadcn structure; reproducible in sandbox. |
| 4 | `next` pinned to 15.5.18 instead of 15.1.x | acceptable — patches CVE-2025-66478; no API change. |
| 4 | `sonner` used directly vs shadcn wrapper | acceptable — wrapper just re-exports `sonner`; identical behavior, avoids `next-themes` wrinkle. |
| 5 | Added `server-only` dependency | acceptable — strengthens AC-5 (compile-time BFF boundary). |
| 9 | Recharts used directly vs shadcn `chart` registry | acceptable — thin wrapper; same visual outcome, avoids registry churn. |

All deviations preserve original intent; none affect an AC negatively.

## Gaps
None blocking. All 17 ACs satisfied; all 13 plan steps implemented.

**Residual risk (not an AC gap):** true end-to-end Strava OAuth (live Strava redirect + Postgres + `jpa,local`) was not manually exercised in-sandbox. No AC requires manual E2E (E2E explicitly out of scope); backend redirect/status are unit-tested and the UI/BFF are component-tested + build-verified. Recommend a manual smoke run before any real deployment.

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-01. Verdict pass — all 17 ACs satisfied, all 13 steps implemented, both test suites green on independent re-run. Residual risk noted: manual end-to-end Strava OAuth smoke run recommended before deploy.

## Cancellation
_n/a_
