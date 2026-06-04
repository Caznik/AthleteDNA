---
wi: WI-strava-oauth/20260601-strava-oauth-integration
phase: documentation
status: confirmed
date: 2026-06-01
project-docs-found: no
---

## Project Documentation Updated
_No existing project README or `docs/` folder found. Only `athletedna/HELP.md` exists (Spring Initializr boilerplate, not a substantive project doc) — not updated._

## Workitem Documentation

### What was built
A Strava OAuth 2.0 integration that lets a backend user link their Strava account and on-demand sync their activities into the AthleteDNA `activities` table.

Three new HTTP endpoints under `/api/strava`:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/strava/connect` | Returns a Strava authorization URL for the current user to visit. |
| `GET` | `/api/strava/callback` | Strava redirects here with `code` and `state`. Validates state, exchanges the code for tokens, persists the link. |
| `POST` | `/api/strava/sync` | Pulls activities since the last sync (capped to 7 days) into `activities`. |

A new `User` table backs a seeded stub user (`dev@athletedna.local`, fixed UUID `00000000-…-0001`) standing in for real auth until that workitem lands. A new `strava_accounts` table holds the per-user access token, refresh token, expiry, athlete ID, scope, and last-sync cursor.

The `Activity` model was extended with two nullable columns (`external_strava_id`, `start_date`) to dedupe Strava-sourced activities across re-syncs and to support incremental sync windowing.

### How it works

**OAuth flow**
1. Client calls `GET /api/strava/connect`. `InitiateStravaAuthService` asks `OAuthStateService` to issue a one-time CSRF state token (random, in-memory, 10-min TTL, bound to the current user's UUID). It then asks the `StravaClient` port to build the authorization URL — including `client_id`, `redirect_uri`, `response_type=code`, `scope=activity:read_all`, `approval_prompt=auto`, and the issued `state`.
2. The user authorizes on Strava. Strava redirects to `/api/strava/callback?code=…&state=…`.
3. `CompleteStravaAuthService` consumes the state (single-use; expired/missing → `InvalidOAuthStateException` → HTTP 400). On success it calls `StravaClient.exchangeCode`, builds a `StravaAccount` domain object, and upserts via `StravaAccountRepository.save` (unique on `user_id`, so re-linking overwrites).

**Token refresh**
- `StravaTokenService.accessTokenFor(account)` is the single chokepoint for getting a usable access token.
- It treats a token as "needs refresh" if `expiresAt - now < 60s` (skew window guards against the token expiring mid-flight).
- On refresh it calls `StravaClient.refreshToken`, copies the new tokens onto the account, persists, and returns the new access token.

**On-demand sync**
- `SyncStravaActivitiesService.syncForCurrentUser()` looks up the current user's `StravaAccount` (missing → `StravaNotLinkedException` → HTTP 409).
- It computes `after = max(lastSyncedAt, now - 7 days)`. The 7-day cap prevents bulk backfills on first sync.
- It fetches a fresh access token, then paginates `GET /api/v3/athlete/activities` 200 at a time until a short page is returned.
- Each summary is mapped to an `Activity` (with `externalStravaId` set) and handed to the existing `ActivitiesSyncUseCase`. `ActivityJpaAdapter.save` upserts by `externalStravaId` to avoid duplicating activities seen in a prior sync.
- On success the service stamps `account.lastSyncedAt = now` and persists.

**`TrainingLoadCalculator` null-HR**
Strava can return activities with no heart-rate data. The calculator now treats `null` avgHr as `0`, which causes those activities to be filtered out by the existing `load > 0` gate in `ActivitiesSyncUseCase` (rather than NPEing).

**Profile gating**
All Strava beans (`@Service` use cases, the `@RestController`, and the JPA adapters) are annotated `@Profile("jpa")`. The default Spring profile excludes the datasource and is used by `AthletednaApplicationTests.contextLoads`. To exercise Strava features the application must be run with `--spring.profiles.active=jpa`.

**State storage**
The OAuth `state` map lives in process memory (`ConcurrentHashMap`) with a 10-minute TTL. An app restart between `/connect` and `/callback` invalidates the in-flight state. Acceptable for v1 / single-instance dev.

### Usage

**1. Register a Strava API app**
At https://www.strava.com/settings/api, fill in the form (Authorization Callback Domain `localhost` for dev). Strava issues a numeric `Client ID` and a `Client Secret`.

**2. Configure environment**
Copy `athletedna/.env.example` to `athletedna/.env` and fill in:
```
STRAVA_CLIENT_ID=<numeric id>
STRAVA_CLIENT_SECRET=<secret>
STRAVA_REDIRECT_URI=http://localhost:8080/api/strava/callback
```
`.env` is gitignored.

**3. Start PostgreSQL**
```
docker compose -f athletedna/docker-compose.yml up -d
```

**4. Run the backend with the JPA profile**
```
./mvnw spring-boot:run -Dspring-boot.run.profiles=jpa
```
The `StubUserSeeder` inserts the dev user on first boot.

**5. Link Strava (interactive)**
- `GET http://localhost:8080/api/strava/connect` → response contains `authorizationUrl`.
- Open the URL in a browser, log in to Strava, approve the requested scope.
- Strava redirects to `/api/strava/callback?code=…&state=…`. The backend persists the `StravaAccount`.

**6. Sync activities**
```
POST http://localhost:8080/api/strava/sync
```
Returns the count of activities synced. Subsequent calls sync only what's new since `lastSyncedAt` (capped to 7 days).

### Known limitations

- **OAuth state survives only the JVM lifetime.** Restarting the backend between `/connect` and `/callback` invalidates the state. Acceptable for single-instance v1; a DB- or Redis-backed store will be needed for horizontal scaling.
- **Tokens stored as plaintext.** `access_token` / `refresh_token` are stored without encryption. Production deployment will require encryption at rest (separate workitem).
- **Strava rate limits not handled.** Strava's 100-req/15-min and 1000-req/day caps are not explicitly rate-limited in the backend. With the 7-day sync cap and 200-per-page fetches, a normal user is well inside limits.
- **No live integration test.** Tests stop at the `StravaClient` port boundary. End-to-end smoke-testing against the real Strava API is a manual step once `.env` is configured.
- **Stub user only.** A single seeded dev user is the implicit "current user" for all endpoints. Real auth (email/password + Google SSO) is a separate planned workitem.
- **No frontend.** The OAuth flow currently requires a developer to open the `authorizationUrl` manually. A frontend "Connect with Strava" button is a future workitem.
- **No webhooks / scheduled sync.** Activities update only when the user calls `POST /api/strava/sync` themselves.

## Confirmation
**Confirmed by user:** yes
**Notes:** Documentation confirmed. Repo phase skipped — no git repository initialized in this project yet.

## Cancellation
_n/a_
