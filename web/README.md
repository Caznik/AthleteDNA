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
# 1. Postgres
cd backend/athletedna && docker compose up -d postgres
# 2. Backend (jpa = Postgres adapter, local = real Strava creds)
./mvnw spring-boot:run -Dspring-boot.run.profiles=jpa,local   # http://localhost:8080
# 3. Frontend
cd ../../frontend && npm install && cp .env.local.example .env.local && npm run dev  # http://localhost:3000
```

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
| `PUT` | `api/auth/me/theme` | `UserResponse` | Set the current user's UI theme. Body `{ theme }` must be `light`/`dark`/`system` (else `400`). |

`UserResponse = { id, email, username, photoUpdatedAt, themePreference }`. `photoUpdatedAt`
is epoch millis of the last photo upload, or `null` when no photo is set — the frontend uses
it both to decide whether to render an avatar image and as a `?v=` cache-buster on the photo
URL. `themePreference` is always a concrete `"light"`/`"dark"`/`"system"`: it is stored in the
nullable `users.theme_preference` column and an unset (null) value is coerced to `"system"` at
the response boundary, so the client never sees null. It is carried on `me` **and** the
login/register `AuthResponse` so the stored theme applies on login. Photo bytes are stored
inline on the `users` table (`photo bytea`) alongside `photo_content_type`; these endpoints
require a valid session (`401` otherwise).

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

The theme-preference column (`users.theme_preference varchar(16)`, nullable) is likewise added
automatically by `ddl-auto=update`; existing rows stay valid (null is read as `"system"`), so
no manual script or backfill is needed.

### Backend configuration

| Property | Env | Default | Purpose |
|---|---|---|---|
| `app.frontend-url` | `FRONTEND_URL` | `http://localhost:3000` | Target the OAuth callback 302-redirects to. |
| `strava.redirect-uri` | `STRAVA_REDIRECT_URI` | `http://localhost:8080/api/strava/callback` | Where Strava sends the user back. |
| `strava.client-id` / `strava.client-secret` | `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | — | OAuth app credentials (in `application-local.properties` for dev). |
