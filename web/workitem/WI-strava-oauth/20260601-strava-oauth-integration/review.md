---
wi: WI-strava-oauth/20260601-strava-oauth-integration
phase: review
status: confirmed
date: 2026-06-01
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | User entity + seeded test user as current user | yes | `domain/model/User.java`, `infrastructure/persistence/entities/UserEntity.java` (table `users`, unique `email`). `config/StubUserSeeder.java` is a `@Profile("jpa") CommandLineRunner` that idempotently inserts UUID `00000000-0000-0000-0000-000000000001`. `application/StubCurrentUserProvider.java` returns it. |
| AC-2 | StravaAccount with `userId`, `stravaAthleteId`, tokens, `expiresAt`, `scope`, unique per user | yes | `domain/model/StravaAccount.java` carries all required fields plus `lastSyncedAt`. `StravaAccountEntity` declares `uk_strava_accounts_user_id` unique constraint on `user_id`. Adapter implements upsert by `userId`. |
| AC-3 | `GET /api/strava/connect` returns auth URL with all required params + state | yes | `StravaController` → `InitiateStravaAuthService` → `StravaRestClientAdapter.buildAuthorizationUrl` (lines 37–45). URL contains `client_id`, `redirect_uri`, `response_type=code`, `scope=activity:read_all`, `state` (URL-encoded). |
| AC-4 | `GET /api/strava/callback` validates state, exchanges code, persists account | yes | `CompleteStravaAuthService.complete` consumes state → `StravaClient.exchangeCode` → `stravaAccountRepository.save`. Covered by `CompleteStravaAuthServiceTest.complete_validState_exchangesCodeAndPersistsAccount`. |
| AC-5 | State mismatch/missing → 400, no tokens persisted | yes | `InvalidOAuthStateException` thrown in use case; `StravaExceptionHandler` maps to HTTP 400. Test `complete_invalidState_throwsAndNeverPersists` asserts no persistence. |
| AC-6 | Auto-refresh expired tokens | yes | `StravaTokenService.accessTokenFor` checks expiry with 60s skew, calls `refreshToken`, persists, returns new token. Three dedicated tests: expired / within-skew / fresh paths. |
| AC-7 | `POST /api/strava/sync` with `after = max(lastSyncedAt, now-7d)`, paginated | yes | `SyncStravaActivitiesService.syncForCurrentUser` (verified by reading source): computes `after = lastSyncedAt.isAfter(sevenDaysAgo) ? lastSyncedAt : sevenDaysAgo` and loops until `batch.size() < PAGE_SIZE`. Five sync tests cover null, 30d, 2d, pagination, and forwarding. |
| AC-8 | `lastSyncedAt` updated after successful sync | yes | Service sets `account.lastSyncedAt = clock.instant()` and persists at the end of `syncForCurrentUser`. Test `sync_updatesLastSyncedAtToNow`. |
| AC-9 | Env-driven credentials, `.env` gitignored, no secrets committed | yes | `StravaProperties` reads `strava.client-id`/`client-secret` from env via `${STRAVA_CLIENT_ID:}` placeholders in `application.properties`. `.env.example` documents the keys. `.gitignore` line 36 excludes `.env`. Reviewed source — no real secrets present. |
| AC-10 | Unit tests cover callback, refresh-on-expiry, 7-day cap; HTTP client mocked | yes | 4 new test files: `CompleteStravaAuthServiceTest`, `SyncStravaActivitiesServiceTest`, `StravaTokenServiceTest`, `OAuthStateServiceTest`. Final run: 27 tests, 0 failures, 0 errors. `StravaClient` and repository ports are Mockito mocks. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — Strava config + env | yes | `StravaProperties`, `StravaConfig`, `application.properties` updated, `.env.example`, `.gitignore` already had `.env`. `application-jpa.properties` left unchanged (deviation #4, acceptable). |
| Step 2 — User stub + seeder + `CurrentUserProvider` | yes | All listed files exist; `StubCurrentUserProvider` is the seam. |
| Step 3 — StravaAccount entity + JPA persistence | yes | Entity, JPA repo, adapter, mapper all present. Upsert path implemented. |
| Step 4 — Strava outbound port + domain DTOs | yes | `StravaClient` port, `StravaTokens`, `StravaActivitySummary` records all created. |
| Step 5 — Strava client adapter (`RestClient`) | yes | `StravaRestClientAdapter` + Jackson DTOs (`StravaTokenResponse`, `StravaActivityResponse`). Adapter handles errors via `StravaApiException`. |
| Step 6 — OAuth state service | yes | `OAuthStateService` with `issueState`/`consumeState`, 10-min TTL, `ConcurrentHashMap`-backed. Tests cover roundtrip, double-consume, expiry. |
| Step 7 — Initiate auth use case + controller | yes | `InitiateStravaAuthUseCase`, `InitiateStravaAuthService`, `StravaController.connect`, `Endpoints.STRAVA_ENDPOINT`. |
| Step 8 — Callback use case + controller + exception handler | yes | `CompleteStravaAuthUseCase`, `CompleteStravaAuthService`, `StravaController.callback`, `StravaExceptionHandler` (with bonus `StravaNotLinkedException` → 409, deviation #3). |
| Step 9 — Token freshness service | yes | `StravaTokenService.accessTokenFor` with 60s skew, three test cases. |
| Step 10 — Sync use case + controller + Activity model extension | yes | `SyncStravaActivitiesService`, `StravaController.sync`. `Activity` extended with `externalStravaId` + `startDate`. `ActivityEntity` adds matching columns. `ActivityJpaAdapter.save` upsert path by `externalStravaId`. `TrainingLoadCalculator` null-HR guard. |
| Step 11 — Unit tests | yes | Four new test classes, all four expected behaviour groups covered. |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| 6, 7, 8, 9, 10 | Added `@Profile("jpa")` to all Strava `@Service` beans and the controller | **acceptable** — preserves the existing default-profile context-load test, consistent with the plan's stated convention ("Strava OAuth requires persistence, so all new adapters will be `@Profile("jpa")` too"). |
| 6, 9, 10 | Annotated production constructors with `@Autowired` to disambiguate the test-only `Clock` constructor | **acceptable** — standard Spring requirement, no AC impact. The test-only ctor is a clean DI seam for fake clocks. |
| 8 | Added `StravaNotLinkedException` → HTTP 409 mapping in `StravaExceptionHandler` | **acceptable** — net-positive, no AC impact. The exception is already required by Step 10; centralizing the mapping keeps controllers thin. |
| 1 | `application-jpa.properties` left unchanged | **acceptable** — the plan said "modify, if needed". No JPA-specific Strava override is needed; env-driven props are shared. |

## Gaps
_none_

All ACs satisfied with concrete evidence. All plan steps implemented. All deviations are minor and intent-preserving.

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** Pass confirmed, proceeding to documentation phase.

## Cancellation
_n/a_
