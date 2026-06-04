---
wi: WI-strava-oauth/20260601-strava-oauth-integration
phase: analyze
status: confirmed
date: 2026-06-01
---

## Requirements

### Functional
- The backend exposes endpoints to initiate and complete the Strava OAuth 2.0 authorization-code flow.
- A minimal `User` entity stub exists in PostgreSQL with seeded test credentials so the rest of the flow can simulate "logged in".
- A `StravaAccount` (or equivalent) entity links a `User` to their Strava tokens (`access_token`, `refresh_token`, `expires_at`, `athlete_id`, `scope`).
- The OAuth request uses scope `activity:read_all`.
- After a successful token exchange, the link between the local user and the Strava account is persisted.
- The backend can refresh the Strava access token automatically when it is expired (or about to expire) before making API calls.
- A "Sync with Strava now" endpoint, called on demand, fetches the user's activities from Strava since their last sync.
- If too many activities exist since the last sync, sync is capped to the last 7 days.
- Fetched activities are stored via the existing `ActivitiesSyncUseCase` / `ActivityRepository` port.

### Non-functional
- Strava client ID and client secret are configured via environment variables — never committed.
- Token storage columns are sized correctly for Strava token formats.
- The OAuth flow validates the `state` parameter to prevent CSRF.
- Use `RestClient` (Spring Boot 4) as the HTTP client to call Strava.
- Adapter pattern: a `StravaClient` outbound port + infrastructure adapter, keeping the OAuth/HTTP concerns out of the domain.

## Out of Scope
- Full user registration / login system (email-password, Google SSO) — only a minimal stub user is created.
- Frontend or mobile app — backend endpoints only, tested via curl / Postman.
- Storing Strava athlete profile fields (name, weight, FTP, profile picture) — only tokens for now.
- Webhook / push subscriptions from Strava — sync is on-demand only.
- Automatic / scheduled sync — only manual trigger.
- Multi-user concurrency or rate-limit handling beyond Strava's defaults.

## Open Questions
- Exact shape of the "minimal stub user" — assumed to be a single seeded `User` row with a fixed UUID used as the implicit "current user" in controllers until real auth lands.

## Strava App Credentials (env-var values, not committed)
- `STRAVA_CLIENT_ID = 254241` (provided by user — public)
- `STRAVA_CLIENT_SECRET` — provided privately in chat; goes in `.env` only (not committed). User to rotate after the implementation lands.

## Acceptance Criteria
- [ ] **AC-1** — A `User` entity and table exist with a seeded test user (fixed UUID) used as the current user across endpoints in lieu of real auth.
- [ ] **AC-2** — A `StravaAccount` entity persists `userId`, `stravaAthleteId`, `accessToken`, `refreshToken`, `expiresAt`, and `scope`, with a unique link per user.
- [ ] **AC-3** — `GET /api/strava/connect` returns a Strava authorization URL with `client_id`, `redirect_uri`, `response_type=code`, `scope=activity:read_all`, and a generated `state` value.
- [ ] **AC-4** — `GET /api/strava/callback?code=...&state=...` validates `state`, exchanges the code with Strava for tokens, persists the `StravaAccount` tied to the current stub user, and returns success.
- [ ] **AC-5** — `state` mismatch or missing causes the callback to return 400 and no tokens to be persisted.
- [ ] **AC-6** — When an outgoing Strava API call is made and the stored access token is expired (or within a small skew window), the backend transparently calls Strava's refresh-token endpoint, updates the persisted tokens, and retries.
- [ ] **AC-7** — `POST /api/strava/sync` fetches activities from Strava `/athlete/activities` paginated, starting `after = max(lastSyncedAt, now - 7 days)`, and stores them via `ActivitiesSyncUseCase`.
- [ ] **AC-8** — After a successful sync, `lastSyncedAt` is updated on the `StravaAccount`.
- [ ] **AC-9** — Strava `client_id` and `client_secret` are read from environment variables (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`). `.env` is gitignored. No real secrets are committed.
- [ ] **AC-10** — Unit tests cover the OAuth callback, the token-refresh-on-expiry logic, and the 7-day sync cap; the Strava HTTP client is mocked.

## Interview Notes
- User confirmed real user auth (email/password + Google SSO) is a *separate, later* workitem — for now a seeded stub user simulates a logged-in session.
- Sync is **on-demand only** (manual user action), not scheduled or push-based.
- Scope `activity:read_all` chosen explicitly to include private activities.
- Athlete profile fields deferred — keep storage minimal in v1; can extend later without breaking the schema.
- Refresh-on-expiry is required behavior (Strava access tokens are valid 6h).
- Sync window: incremental from last sync, but capped to last 7 days when the gap is larger — agreed to avoid huge backfills on first sync.
- User indicated they do not yet have a Strava API app — guidance on registering one was provided; implementation can proceed with env-var placeholders.

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-01
