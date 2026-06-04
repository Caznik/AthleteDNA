---
wi: WI-strava-oauth/20260601-strava-oauth-integration
phase: plan
status: confirmed
date: 2026-06-01
approach: Approach A — Custom OAuth with RestClient + JPA adapter
---

## Context
**Selected approach:** Custom OAuth flow with `RestClient` + hex adapter, tokens persisted in JPA.
**AC coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10.

**Codebase patterns to respect:**
- Layering: `domain/{model,port,service}` → `application/{port/in,usecases}` → `infrastructure/{persistence,web}` → `config` + `endpoints` constants.
- JPA adapters live behind `@Profile("jpa")`. Strava OAuth requires persistence, so all new adapters will be `@Profile("jpa")` too — running the app for Strava work uses `--spring.profiles.active=jpa`.
- Mappers are static utility classes (`*Mapper`), DTOs are `record` types, entities use Lombok `@Getter/@Setter`.
- Wiring of pure-domain services lives in `config/DomainConfig.java`. Spring beans (`@Service`, `@Repository`, `@RestController`) are auto-wired.

## Implementation Sequence

### Step 1 — Strava configuration properties + env wiring
**Satisfies:** AC-9
**Files (new/modified):**
- `src/main/resources/application.properties` (modify) — add Strava property keys with `${ENV_VAR}` placeholders.
- `src/main/resources/application-jpa.properties` (modify, if needed) — same keys can stay shared in `application.properties`.
- `src/main/java/com/caznik/athletedna/config/StravaProperties.java` (new) — `@ConfigurationProperties("strava")` record with `clientId`, `clientSecret`, `redirectUri`, `authBaseUrl`, `apiBaseUrl`.
- `src/main/java/com/caznik/athletedna/config/StravaConfig.java` (new) — `@Configuration` enabling `StravaProperties` and exposing a `RestClient` bean for Strava (with default headers / base URL).
- `athletedna/.env.example` (new) — documents `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`.
- `athletedna/.gitignore` (modify) — ensure `.env` is excluded (verify current state first).
**Description:** Centralize Strava config in a typed properties class so adapters never read env vars directly. Provider URLs (`authBaseUrl=https://www.strava.com/oauth`, `apiBaseUrl=https://www.strava.com/api/v3`) are configurable for testability. `.env` is gitignored; `.env.example` documents the required keys.

### Step 2 — Minimal User stub (domain + JPA + seeding)
**Satisfies:** AC-1
**Files (new):**
- `domain/model/User.java` — `{ UUID id, String email }`.
- `domain/port/UserRepository.java` — `findById`, `findByEmail`, `save`.
- `infrastructure/persistence/UserJpaAdapter.java` — `@Profile("jpa")`.
- `infrastructure/persistence/UserJpaRepository.java` — Spring Data interface.
- `infrastructure/persistence/entities/UserEntity.java` — table `users`, columns `id (UUID, PK)`, `email (unique)`.
- `infrastructure/persistence/mappers/UserPersistenceMapper.java` — static `toDomain`/`toEntity`.
- `config/StubUserSeeder.java` (new) — `@Profile("jpa")` `CommandLineRunner` that inserts (idempotently) a single seeded user with a **hardcoded UUID** (e.g. `00000000-0000-0000-0000-000000000001`) and email `dev@athletedna.local`.
- `application/CurrentUserProvider.java` (new) — interface returning the current `User`; the stub implementation returns the seeded UUID. This is the seam that the future real auth workitem will replace.
**Description:** Provides the "logged in user" simulation. All controllers/use cases consume `CurrentUserProvider`, so the future real-auth workitem only swaps the bean.

### Step 3 — StravaAccount domain + JPA persistence
**Satisfies:** AC-2
**Files (new):**
- `domain/model/StravaAccount.java` — `{ UUID id, UUID userId, Long stravaAthleteId, String accessToken, String refreshToken, Instant expiresAt, String scope, Instant lastSyncedAt }`.
- `domain/port/StravaAccountRepository.java` — `findByUserId`, `save` (upsert by `userId`).
- `infrastructure/persistence/StravaAccountJpaAdapter.java` — `@Profile("jpa")`.
- `infrastructure/persistence/StravaAccountJpaRepository.java`.
- `infrastructure/persistence/entities/StravaAccountEntity.java` — table `strava_accounts`. Unique constraint on `user_id`. Columns sized for token strings (`length = 255`) and `scope` (`length = 255`). `last_synced_at` nullable. `access_token` and `refresh_token` stored as plaintext in this v1 — encryption at rest is **out of scope** (deferred, called out as risk).
- `infrastructure/persistence/mappers/StravaAccountPersistenceMapper.java`.
**Description:** The link entity between the local user and their Strava credentials. Single row per user (unique constraint).

### Step 4 — Strava outbound port + DTOs
**Satisfies:** AC-3, AC-4, AC-6, AC-7 (foundation)
**Files (new):**
- `domain/port/StravaClient.java` — interface with methods:
  - `String buildAuthorizationUrl(String state)`
  - `StravaTokens exchangeCode(String code)`
  - `StravaTokens refreshToken(String refreshToken)`
  - `List<StravaActivitySummary> fetchActivities(String accessToken, Instant after, int page, int perPage)`
- `domain/model/StravaTokens.java` — record `{ Long athleteId, String accessToken, String refreshToken, Instant expiresAt, String scope }`.
- `domain/model/StravaActivitySummary.java` — record holding fields needed to build an `Activity`: `{ long id, String type, double distance, long movingTimeSeconds, Integer averageHeartrate, Instant startDate }`.
**Description:** Outbound port lives in `domain/port` per existing convention. The port speaks domain types only — HTTP / JSON is the adapter's concern.

### Step 5 — Strava client adapter using `RestClient`
**Satisfies:** AC-3, AC-4, AC-6, AC-7
**Files (new):**
- `infrastructure/strava/StravaRestClientAdapter.java` — `@Component`, implements `StravaClient`, uses the shared `RestClient` bean. Implements:
  - `buildAuthorizationUrl`: builds `https://www.strava.com/oauth/authorize?...&scope=activity:read_all&approval_prompt=auto&state=...`.
  - `exchangeCode`: POSTs to `/oauth/token` with `grant_type=authorization_code`.
  - `refreshToken`: POSTs to `/oauth/token` with `grant_type=refresh_token`.
  - `fetchActivities`: GET `/api/v3/athlete/activities?after=...&page=...&per_page=...` with bearer token.
- `infrastructure/strava/dto/StravaTokenResponse.java`, `StravaActivityResponse.java` — Jackson records mapping raw Strava JSON (snake_case → camelCase via `@JsonProperty`). Adapter maps these to the domain records.
**Description:** Pure HTTP/JSON concerns isolated here. Failures bubble up as `StravaApiException` (new runtime exception) so use cases / controllers can translate to 4xx/5xx responses.

### Step 6 — OAuth state service (CSRF)
**Satisfies:** AC-3, AC-5
**Files (new):**
- `application/strava/OAuthStateService.java` (new) — `@Service` that:
  - `issueState(UUID userId)` → generates a cryptographically random token, stores `{state → userId, issuedAt}` in an in-memory `ConcurrentHashMap` with a short TTL (e.g. 10 min), returns the state.
  - `consumeState(String state)` → returns the bound `userId` if present and not expired, otherwise empty; removes the entry (single use).
**Description:** Stateful CSRF protection. In-memory is acceptable for v1 (single-user dev / single instance); a DB-backed implementation can come later. Documented in plan as risk.

### Step 7 — Initiate auth use case + controller
**Satisfies:** AC-3
**Files (new):**
- `application/port/in/InitiateStravaAuthUseCase.java` — interface returning the auth URL for the current user.
- `application/usecases/InitiateStravaAuthService.java` — depends on `CurrentUserProvider`, `OAuthStateService`, `StravaClient`. Builds the URL.
- `infrastructure/web/controllers/StravaController.java` (new) — `GET /api/strava/connect` calls the use case, returns `{ authorizationUrl }`.
- `endpoints/Endpoints.java` (modify) — add `STRAVA_ENDPOINT = "api/strava"`.
**Description:** Entry point of the OAuth flow.

### Step 8 — Callback use case + controller
**Satisfies:** AC-4, AC-5
**Files (new/modified):**
- `application/port/in/CompleteStravaAuthUseCase.java` — interface `complete(String code, String state)`.
- `application/usecases/CompleteStravaAuthService.java` — implementation:
  1. `OAuthStateService.consumeState(state)` → if missing/expired, throw `InvalidOAuthStateException`.
  2. `StravaClient.exchangeCode(code)` → tokens.
  3. Build `StravaAccount` and `stravaAccountRepository.save(...)` (upsert by `userId`).
- `StravaController` (modify) — `GET /api/strava/callback` reads `code` + `state` query params, delegates to the use case. Returns 200 success body on success.
- `infrastructure/web/exceptions/StravaExceptionHandler.java` (new) — `@RestControllerAdvice` mapping `InvalidOAuthStateException` → 400, `StravaApiException` → 502.
**Description:** Closes the OAuth loop. Idempotent on re-link (overwrites tokens for the same user).

### Step 9 — Token freshness / refresh service
**Satisfies:** AC-6
**Files (new):**
- `application/strava/StravaTokenService.java` (new) — `@Service` exposing `String accessTokenFor(StravaAccount account)`. Logic:
  1. If `account.expiresAt` is in the future minus a 60-second skew → return existing token.
  2. Else call `StravaClient.refreshToken(account.refreshToken)`, update the account fields, persist via `StravaAccountRepository.save`, return new access token.
**Description:** Single chokepoint for fresh-token lookups; any future caller (sync, future endpoints) reuses it. Skew window guards against TOCTOU expiry.

### Step 10 — Sync activities use case + controller
**Satisfies:** AC-7, AC-8
**Files (new/modified):**
- `application/port/in/SyncStravaActivitiesUseCase.java` — interface `syncForCurrentUser()`.
- `application/usecases/SyncStravaActivitiesService.java` — implementation:
  1. Resolve current `User` → `StravaAccount`. Missing account → throw `StravaNotLinkedException`.
  2. Compute `after = max(lastSyncedAt ?? EPOCH, now - 7 days)`. (Per AC-7: cap to last 7 days when gap larger.)
  3. Get access token from `StravaTokenService`.
  4. Loop paginated `StravaClient.fetchActivities(token, after, page, 200)` until a page returns < 200 items.
  5. Map summaries to domain `Activity` (the existing `Activity` model has no startDate/externalId; see Risks — Step will add minimal needed fields).
  6. Call `SyncActivitiesUseCase.sync(activities)`.
  7. Update `account.lastSyncedAt = now` and persist.
- `StravaController` (modify) — `POST /api/strava/sync` → `syncForCurrentUserUseCase.syncForCurrentUser()`. Returns count synced.
- `domain/model/Activity.java` (modify) — add `Long externalStravaId` and `Instant startDate`. Update constructor.
- `infrastructure/persistence/entities/ActivityEntity.java` (modify) — add columns `external_strava_id (unique, nullable)` and `start_date (nullable)`.
- `infrastructure/persistence/mappers/ActivityPersistenceMapper.java` (modify) — map new fields.
- `infrastructure/web/dtos/ActivityDTO.java` (modify) — expose new fields.
- `infrastructure/web/mappers/ActivityWebMapper.java` (modify) — map new fields.
- `ActivityJpaRepository.java` (modify) — add `Optional<ActivityEntity> findByExternalStravaId(Long id)` for upsert/dedupe.
- `ActivityJpaAdapter.save` (modify) — if `externalStravaId` is present and a row exists, update it instead of inserting (dedupe re-syncs).
- `TrainingLoadCalculator.java` (modify) — guard against `null` avgHr (Strava activities can lack HR data): treat null as 0, so such activities are filtered out by the existing `> 0` gate in `ActivitiesSyncUseCase`. **Pre-Check** this with the user before changing — see Risks.
**Description:** Pulls activities since the last sync (capped to 7 days), feeds the existing sync use case, then advances the last-synced cursor.

### Step 11 — Unit tests
**Satisfies:** AC-10
**Files (new):**
- `test/.../usecases/CompleteStravaAuthServiceTest.java` — state valid → tokens persisted; state invalid → exception, no persistence.
- `test/.../usecases/SyncStravaActivitiesServiceTest.java` — `lastSyncedAt = null` → uses `now - 7d`; `lastSyncedAt = now - 30d` → uses `now - 7d` (cap); `lastSyncedAt = now - 2d` → uses that timestamp; pagination loop until short page; updates `lastSyncedAt`.
- `test/.../strava/StravaTokenServiceTest.java` — not-yet-expired → no refresh call; expired → calls refresh, persists, returns new token.
- `test/.../strava/OAuthStateServiceTest.java` — issue/consume roundtrip; double-consume returns empty; expired entry returns empty.
- Mocks: `StravaClient` and repositories mocked with Mockito (already on the test classpath via `spring-boot-starter-webmvc-test`).
**Description:** Covers the testable behaviour required by AC-10 without standing up a real HTTP layer.

## Risks / Known Unknowns
- **Activity model needs extension** (`externalStravaId`, `startDate`). This affects the existing `ActivityEntity` table and `TrainingLoadCalculator` (null heart rate). Schema is currently `ddl-auto=update`, so additive nullable columns are safe — but the implementer should confirm during AC Pre-Check.
- **`TrainingLoadCalculator` & null HR.** Strava returns activities without heart-rate data (rides/runs without an HR sensor). Current calculator NPEs on null. The plan opts to make those activities filter out (`load=0`), but the user may prefer storing them anyway with a placeholder load. **Pre-Check before implementing Step 10.**
- **OAuth state storage is in-memory.** Survives only for the lifetime of the JVM. Acceptable for dev / single-instance v1; not horizontally scalable. Flag as known limitation.
- **Token encryption.** Strava tokens are stored as plaintext in PostgreSQL. Acceptable for dev; production hardening (encryption at rest, KMS) is a separate workitem.
- **Sync idempotency / duplicate prevention.** Relying on `external_strava_id` uniqueness — needs the upsert path in `ActivityJpaAdapter.save`. Implementer to confirm no other writers to `activities`.
- **Strava rate limits** (100 req / 15 min, 1000 / day) are not handled explicitly. With the 7-day cap and `per_page=200`, a normal user is fine; bulk users could hit the limit. Out of scope for v1.
- **No integration test against real Strava.** Tests stop at the `StravaClient` port boundary. Manual smoke-test against live Strava is the implementer's responsibility once `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` are in `.env`.
- **Default Spring profile excludes the DataSource.** Strava work assumes the `jpa` profile is active; the implementer should document the run command (`./mvnw spring-boot:run -Dspring-boot.run.profiles=jpa`) in their notes.

## Confirmation
**Confirmed by user:** yes
**Notes:** User accepted the three flagged decisions: filter null-HR activities, extend Activity model with externalStravaId/startDate, OAuth state in-memory for v1.

## Cancellation
_n/a_
