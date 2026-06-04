---
wi: WI-strava-oauth/20260601-strava-oauth-integration
phase: implementation
status: completed
date: 2026-06-01
---

## Architecture Notes

**Hex layering observed (confirms plan):**
- `domain/{model,port,service}`: pure Java, no Spring. `Activity` is a Lombok `@Getter/@Setter` POJO (not a record) — `StravaAccount` will follow the same shape for consistency, while pure value DTOs (`StravaTokens`, `StravaActivitySummary`) can be `record`s.
- `application/{port/in,usecases}`: port interfaces + `@Service` use cases. Use cases use `@Transactional`.
- `infrastructure/{persistence,web}`: JPA adapters annotated `@Repository @Profile("jpa")`, in-memory adapters `@Profile("!jpa")`. Persistence mappers are static utility classes (`*Mapper`).
- `config/`: Spring `@Configuration` for wiring pure-domain services and Spring beans.
- `endpoints/`: holds public-facing URL constants (e.g. `ACTIVITIES_ENDPOINT = "activities"` — note **no leading slash**).

**Conventions to honor:**
- Tabs used as indentation (verified in every existing `.java`).
- Constructor-based DI (no `@Autowired` on fields).
- Mapper class signature: static `toDomain` + `toEntity` / `toDTO`.
- Entities: `@Entity @Table @NoArgsConstructor` + `@Column` on each field with explicit `length` for strings, plus Lombok `@Getter/@Setter` on the field.
- Property file split: `application.properties` excludes JPA autoconfig; `application-jpa.properties` re-enables it. **Strava properties live in `application.properties`** so they are present in both profiles; the values are env-driven.
- Tests: JUnit 5 + Mockito + AssertJ. Mock the port (e.g. `ActivityRepository`), wire the use case directly.

**Architectural decisions for this WI:**
- `StravaController` will use `Endpoints.STRAVA_ENDPOINT = "api/strava"`. The path **does not** include a leading `/` to follow the existing `ACTIVITIES_ENDPOINT = "activities"` pattern. `redirect_uri` in env should match (e.g. `http://localhost:8080/api/strava/callback`).
- `RestClient` bean is built in `StravaConfig`. The adapter calls absolute URLs via the configured base — token endpoint and authorize URL live under `authBaseUrl`, activity endpoints under `apiBaseUrl`. We use a single `RestClient` with no fixed `baseUrl` to keep both reachable, and inject the URLs from `StravaProperties` per request.
- `ActivityJpaAdapter.save` upsert: since `Activity` has a UUID PK assigned by `ActivitiesSyncUseCase`, dedupe by `externalStravaId` must happen **inside the adapter** — when an existing row with the same `externalStravaId` is found, copy its UUID into the incoming entity before `save()` so JPA performs an update. This preserves the existing port contract (`void save(Activity)`).
- `TrainingLoadCalculator` null-guard: avgHr null treated as 0 (per plan, pre-approved). Activities with null HR coming from Strava will be filtered out by the existing `> 0` gate — consistent with existing behavior. Tests pre-existing in `ActivitiesSyncUseCaseTest` continue to pass.
- `CurrentUserProvider` is in `application/` (per plan) but is an interface; its impl `StubCurrentUserProvider` is also in `application/` (no auth concerns belong in infrastructure yet). Lives `@Service` annotated; future replacement just defines a competing `@Primary` bean.
- `StubUserSeeder`: `CommandLineRunner` under `@Profile("jpa")` so it only runs against a real DB.
- All test files live under `athletedna/src/test/java/com/caznik/athletedna/...` mirroring main package layout (verified from existing tests).

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 6, 7, 8, 9, 10 | Strava `@Service` beans had no profile qualifier | Added `@Profile("jpa")` to `OAuthStateService`, `StravaTokenService`, `InitiateStravaAuthService`, `CompleteStravaAuthService`, `SyncStravaActivitiesService`, and `StravaController` | They depend transitively on `UserRepository` / `StravaAccountRepository`, which the plan declared `@Profile("jpa")` only. Pre-existing `AthletednaApplicationTests.contextLoads` runs under the default (non-jpa) profile and would fail bean-wiring without this. Consistent with plan note: "Strava OAuth requires persistence, so all new adapters will be `@Profile("jpa")` too". |
| 6, 9, 10 | Two public constructors on services taking an optional `Clock` | Annotated the production (no-Clock) constructor with `@Autowired` | Spring 4 / Boot 4 requires an unambiguous autowire candidate when multiple public constructors exist; without `@Autowired` it falls back to the missing default constructor. |
| 8 | Exception handler maps `StravaNotLinkedException` was not in plan | Added handler entry mapping it to HTTP 409 | The exception was already required by Step 10's sync use case; centralizing the mapping next to the other Strava handlers keeps controller code clean. |
| 1 | `application-jpa.properties` (modify, if needed) | Left unchanged | Strava props are env-driven and live in `application.properties` only — no jpa-specific overrides needed. |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `domain/model/User.java`, `infrastructure/persistence/entities/UserEntity.java` (table `users`, unique `email`), `config/StubUserSeeder.java` idempotently inserts UUID `00000000-0000-0000-0000-000000000001`, `application/StubCurrentUserProvider.java` returns it as the current user. | COVERED |
| AC-2 | `domain/model/StravaAccount.java` (all required fields), `infrastructure/persistence/entities/StravaAccountEntity.java` table `strava_accounts` with `uk_strava_accounts_user_id` unique constraint on `user_id`; upsert path in `StravaAccountJpaAdapter.save`. | COVERED |
| AC-3 | `StravaController.connect` (`GET /api/strava/connect`) -> `InitiateStravaAuthService` -> `StravaRestClientAdapter.buildAuthorizationUrl` builds URL with `client_id`, `redirect_uri`, `response_type=code`, `scope=activity:read_all`, `state`. | COVERED |
| AC-4 | `StravaController.callback` (`GET /api/strava/callback`) -> `CompleteStravaAuthService.complete` validates state, exchanges code, upserts `StravaAccount`. Test: `CompleteStravaAuthServiceTest.complete_validState_exchangesCodeAndPersistsAccount`. | COVERED |
| AC-5 | `CompleteStravaAuthService` throws `InvalidOAuthStateException` when state missing/invalid; handler maps to HTTP 400 (`StravaExceptionHandler`). Test: `CompleteStravaAuthServiceTest.complete_invalidState_throwsAndNeverPersists`. | COVERED |
| AC-6 | `StravaTokenService.accessTokenFor` checks expiry with 60s skew, calls `refreshToken`, persists, returns new token. Tests: `StravaTokenServiceTest.accessTokenFor_expired_callsRefreshAndPersists`, `accessTokenFor_withinSkewWindow_refreshes`, `accessTokenFor_notExpired_returnsExistingTokenWithoutRefresh`. | COVERED |
| AC-7 | `SyncStravaActivitiesService.syncForCurrentUser` computes `after = max(lastSyncedAt, now - 7d)`, paginates via `StravaClient.fetchActivities`, hands list to `SyncActivitiesUseCase`. Tests: `SyncStravaActivitiesServiceTest.sync_lastSyncedAt30DaysAgo_capsAtSevenDays`, `sync_lastSyncedAtNull_usesSevenDaysAgo`, `sync_lastSyncedAt2DaysAgo_usesThatTimestamp`, `sync_paginates_untilShortPage`, `sync_passesActivitiesToSyncUseCase`. | COVERED |
| AC-8 | `SyncStravaActivitiesService` sets `account.lastSyncedAt = now` and persists. Test: `SyncStravaActivitiesServiceTest.sync_updatesLastSyncedAtToNow`. | COVERED |
| AC-9 | `application.properties` reads `strava.client-id=${STRAVA_CLIENT_ID:}` / `strava.client-secret=${STRAVA_CLIENT_SECRET:}`; `.env.example` documents keys; `.env` added to `.gitignore`; no real secrets committed. | COVERED |
| AC-10 | 22 new unit tests added covering OAuth callback, token refresh, 7-day sync cap, state CSRF. `StravaClient` and repository ports are mocked with Mockito. Final test run: `Tests run: 27, Failures: 0, Errors: 0`. | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1..AC-10 | AC-1..AC-9 pass via direct code/file evidence; AC-10 fails on first `mvn test` run with `AthletednaApplicationTests.contextLoads` error: `No qualifying bean of type StravaAccountRepository` under default profile. | Gated all Strava `@Service` beans + `StravaController` with `@Profile("jpa")` to match the JPA-only dependencies. Also added `@Autowired` to production constructors to resolve Spring's multi-constructor ambiguity. |
| 2 | AC-10 (re-run) | `Tests run: 27, Failures: 0, Errors: 0, Skipped: 0`. All 22 new tests + 4 existing use-case tests + 1 contextLoads test green. | None — all ACs now COVERED. |

## Regression
**Test suite run:** yes (`./mvnw.cmd test` with `JAVA_HOME=/c/lab/eclipse/plugins/org.eclipse.justj.openjdk.hotspot.jre.full.win32.x86_64_21.0.9.v20251105-0741/jre`)
**Result:** pass — `Tests run: 27, Failures: 0, Errors: 0, Skipped: 0` — `BUILD SUCCESS`.
**Failures:** none.
**Notes:**
- The system `JAVA_HOME` resolved only to a JRE 1.8 (no `javac`); the Eclipse-bundled JDK 21 was used to run Maven. This is local-environment-only and does not affect the source tree.
- Pre-existing tests (`ActivitiesSyncUseCaseTest`, `ActivitiesSearchUseCaseTest`, `AthletednaApplicationTests`) continue to pass after the `Activity` model extension and `TrainingLoadCalculator` null-guard changes.
- No live Strava integration tests were added (per plan risk: out of scope).
