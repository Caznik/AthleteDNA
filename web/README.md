# AthleteDNA

A training-analytics web app: connect a Strava account, sync activities, and view
training metrics (summary stats + a weekly training-load trend).

## Structure

| Path | What it is |
|---|---|
| `backend/athletedna` | Spring Boot 4 / Java 21 REST API (hexagonal architecture, JPA + Postgres). |
| `frontend` | Next.js (App Router) + TypeScript dashboard. Talks to the backend only through its own Route Handlers (BFF). See `frontend/README.md`. |

Authentication is currently a **stub single-user** seam (`CurrentUserProvider`); a
real auth/session layer is expected to drop into the frontend BFF and backend later
without restructuring.

## Running locally

The full flow needs Postgres + the backend (with real Strava credentials) + the
frontend. See `frontend/README.md` for the step-by-step sequence. In short:

```
# 1. Postgres + the Python insight engine
cd backend/athletedna
export INSIGHT_ENGINE_TOKEN=$(openssl rand -hex 32)   # shared secret for the internal call
docker compose up -d postgres insight-engine          # engine on http://localhost:8000
# 2. Backend (jpa = Postgres adapter, local = real Strava creds). Pass it the same token.
INSIGHT_ENGINE_TOKEN=$INSIGHT_ENGINE_TOKEN ./mvnw spring-boot:run -Dspring-boot.run.profiles=jpa,local   # http://localhost:8080
# 3. Frontend
cd ../../frontend && npm install && cp .env.local.example .env.local && npm run dev  # http://localhost:3000
```

The **insight engine** (`backend/insight-engine`, a stateless FastAPI service) computes the
Performance Management Chart (CTL/ATL/TSB), weekly load, trends, and PRs. Spring is the only
caller — it sends the user's activity series and presents an authenticated endpoint to the
browser; the engine never touches the database and must not be exposed publicly (the
`X-Internal-Token` shared secret is the only trust boundary). It runs alongside Postgres in
`docker compose`; the Spring app reaches it at `http://localhost:8000` by default.

The backend's Strava endpoints are `@Profile("jpa")` — under the default profile
(in-memory) they are inactive. The `local` profile supplies real Strava credentials
from the gitignored `application-local.properties`.

## Backend HTTP API

Interactive docs (springdoc) are served at `http://localhost:8080/swagger-ui.html`.

| Method | Path | Returns | Notes |
|---|---|---|---|
| `GET` | `api/strava/connect` | `{ authorizationUrl }` | Strava OAuth authorize URL for the current user. |
| `GET` | `api/strava/status` | `{ linked: boolean }` | Whether the current user has a linked Strava account. |
| `GET` | `api/strava/callback?code&state` | `302` redirect | On success → `${FRONTEND_URL}/strava/linked`; on invalid state → `…/strava/linked?error=invalid_state`. |
| `POST` | `api/strava/sync` | `{ synced: number }` | Pulls activities from Strava for the current user. |
| `GET` | `activities/getAll` | `ActivityDTO[]` | All stored activities (note: no `api/` prefix). |
| `POST` | `activities/sync` | — | Bulk upsert activities (body: `ActivityDTO[]`). |
| `PUT` | `api/auth/me/photo` | `UserResponse` | Upload/replace the current user's profile photo. `multipart/form-data`, field `file`; JPEG/PNG/WebP, ≤ 2 MB (else `400`). |
| `DELETE` | `api/auth/me/photo` | `UserResponse` | Remove the current user's photo (reverts to the initials avatar). |
| `GET` | `api/auth/me/photo` | image bytes | Streams the stored photo with its content type; `404` when none is set. |
| `GET` | `api/insights/training` | `TrainingInsights` | PMC/weekly-load/trends/PRs for the current user's activities. `401` unauthenticated; `503` (`{error:"insights_unavailable"}`) when the insight engine is unreachable. `@Profile("jpa")`. |

`UserResponse = { id, email, username, photoUpdatedAt }`. `photoUpdatedAt` is epoch
millis of the last photo upload, or `null` when no photo is set — the frontend uses it
both to decide whether to render an avatar image and as a `?v=` cache-buster on the photo
URL. Photo bytes are stored inline on the `users` table (`photo bytea`) alongside
`photo_content_type`; these endpoints require a valid session (`401` otherwise).

`ActivityDTO = { id, type, distance, duration, avgHr, externalStravaId, startDate, trainingLoad }`.
`trainingLoad` is derived server-side (`duration × avgHr`, via `TrainingLoadCalculator`)
and is read-only — it is ignored on the `activities/sync` input.

`avgHr` is **nullable**: Strava only returns `average_heartrate` when the athlete
granted HR access and the activity has an HR stream. Activities without it are
synced and stored with `avg_hr = NULL` (training load then computes to 0).

### Database migrations

Schema is managed by Hibernate `spring.jpa.hibernate.ddl-auto=update`, which adds
new columns/tables but **never drops an existing constraint**. Schema changes that
`update` can't perform (dropping a NOT NULL, renaming, etc.) are hand-written SQL
scripts under `backend/athletedna/db/migrations/`, named `YYYY-MM-DD_<change>.sql`,
applied manually once per environment. No migration framework (Flyway/Liquibase) is
in use. Example:

```
psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-02_avg_hr_nullable.sql
```

The profile-photo columns (`2026-06-02_user_profile_photo.sql`) are added automatically by
`ddl-auto=update` since they are nullable; the script documents the change explicitly and is
safe to re-run (`ADD COLUMN IF NOT EXISTS`).

Activities are owned per-user via `activities.user_id`. `ddl-auto=update` adds the column
(nullable) on its own, but the **backfill + NOT NULL + foreign key** to `users(id)` cannot be
applied to populated rows by `update`, so they live in `2026-06-07_activity_user_id.sql` — run
it once per environment. The backfill assigns all pre-existing activities to the single
existing user (this app has been effectively single-user); edit the script's `UPDATE` if more
than one user exists. After this, reads are scoped to the logged-in user (the dashboard and
activities list show only the caller's activities).

### Backend configuration

| Property | Env | Default | Purpose |
|---|---|---|---|
| `app.frontend-url` | `FRONTEND_URL` | `http://localhost:3000` | Target the OAuth callback 302-redirects to. |
| `strava.redirect-uri` | `STRAVA_REDIRECT_URI` | `http://localhost:8080/api/strava/callback` | Where Strava sends the user back. |
| `strava.client-id` / `strava.client-secret` | `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | — | OAuth app credentials (in `application-local.properties` for dev). |
| `insight-engine.base-url` | `INSIGHT_ENGINE_URL` | `http://localhost:8000` | Base URL of the Python insight engine. |
| `insight-engine.internal-token` | `INSIGHT_ENGINE_TOKEN` | — | Shared secret sent as `X-Internal-Token`; must equal the engine's `INTERNAL_TOKEN`. Empty → the engine rejects every call (fail closed). |
