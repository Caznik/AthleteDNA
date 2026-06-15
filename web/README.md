# AthleteDNA

A training-analytics web app for endurance athletes. Connect a Strava account (or
upload `.fit` files straight from your watch), sync your activities, and see what your
training is actually doing to you — a dashboard of summary stats and activity
distribution, plus an **Insights** page built around the Performance Management Chart
(fitness / fatigue / form), weekly load, trends, and per-sport personal records.

## Features

- **Strava OAuth** — link your account and sync activities on demand.
- **`.fit` import** — upload files directly from a device/watch (rate-limit-free).
  FIT is the primary source: it enriches matching Strava activities with the richer
  session summary + laps, and FIT data wins on conflicts.
- **Dashboard** — summary stats and activity-type distribution, scoped to you.
- **Insights** — Performance Management Chart (CTL/ATL/TSB = fitness/fatigue/form),
  weekly training load, trends, and personal records per activity type.
- **Accounts** — real JWT auth (register/login), profile photo, and per-user UI
  preferences (theme: light/dark/system; language: English/Spanish) persisted in the DB.

## Architecture

Three services. The browser only ever talks to the Next.js app; everything else is
internal.

```
Browser
  │  (cookies, /api/* only)
  ▼
Next.js frontend  ── BFF Route Handlers ──►  Spring Boot backend  ──►  Postgres
  (App Router)                                (REST API, JPA)
                                                   │  X-Internal-Token
                                                   ▼
                                          Python insight engine (FastAPI)
                                          CTL/ATL/TSB, weekly load, trends, PRs
```

- The **frontend** is a Backend-for-Frontend: the browser calls its own `/api/*`
  Route Handlers, which proxy to Spring server-side. The backend needs no CORS, and
  `BACKEND_URL` is never exposed to the browser.
- The **backend** owns all persistence and is the only caller of the insight engine.
- The **insight engine** is stateless — it never touches the database. Spring sends it
  the user's activity series and presents an authenticated endpoint to the browser. It
  must not be exposed publicly; the `X-Internal-Token` shared secret is the only trust
  boundary (empty token → it rejects every call).

| Path | What it is |
|---|---|
| `backend/athletedna` | Spring Boot 4 / Java 21 REST API — hexagonal architecture, JPA + Postgres. |
| `backend/insight-engine` | Stateless FastAPI service computing the PMC, weekly load, trends, and PRs. See `backend/insight-engine/README.md`. |
| `frontend` | Next.js 15 (App Router) + TypeScript dashboard + BFF. See `frontend/README.md`. |

## Tech stack

- **Backend:** Java 21, Spring Boot 4, Spring Data JPA, JWT (BCrypt-hashed passwords),
  springdoc/Swagger, PostgreSQL.
- **Insight engine:** Python, FastAPI.
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS +
  shadcn/ui, TanStack Query, Recharts, react-i18next, Vitest.

### Authentication

Auth is a real **JWT** layer under the `jpa` profile: register/login issue a JWT that
the frontend BFF stores in an httpOnly cookie and forwards as a Bearer token; the
backend resolves the caller through the `CurrentUserProvider` seam
(`JwtCurrentUserProvider`, with BCrypt-hashed passwords). Under the default in-memory
profile a `StubCurrentUserProvider` (`@Profile("!jpa")`) returns a single hardcoded
user, so the app still runs without credentials for local/test.

The backend's Strava endpoints are `@Profile("jpa")` — under the default (in-memory)
profile they are inactive. The `local` profile supplies real Strava credentials from
the gitignored `application-local.properties`.

## Running locally

The full flow needs Postgres + the insight engine + the backend (with real Strava
credentials) + the frontend. See `frontend/README.md` for the step-by-step sequence.
In short:

```bash
# 1. Postgres + the Python insight engine
cd backend/athletedna
export INSIGHT_ENGINE_TOKEN=$(openssl rand -hex 32)   # shared secret for the internal call
docker compose up -d postgres insight-engine          # engine on http://localhost:8000

# 2. Backend (jpa = Postgres adapter, local = real Strava creds). Pass it the same token.
INSIGHT_ENGINE_TOKEN=$INSIGHT_ENGINE_TOKEN ./mvnw spring-boot:run -Dspring-boot.run.profiles=jpa,local   # http://localhost:8080

# 3. Frontend
cd ../../frontend && npm install && cp .env.local.example .env.local && npm run dev   # http://localhost:3000
```

> Without Postgres + the `jpa,local` backend profiles, the Strava endpoints are not
> active. The dashboard and table still render (empty / not-connected states), but a
> real Strava link requires the full stack.

Interactive backend API docs (springdoc) are served at
`http://localhost:8080/swagger-ui.html`.

---

## Backend HTTP API

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
| `PUT` | `api/auth/me/language` | `UserResponse` | Set the current user's UI language. Body `{ language }` must be `en`/`es` (else `400 {error:"invalid_language"}`). |
| `GET` | `api/insights/training` | `TrainingInsights` | PMC/weekly-load/trends/PRs for the current user's activities. `401` unauthenticated; `503` (`{error:"insights_unavailable"}`) when the insight engine is unreachable. `@Profile("jpa")`. |
| `POST` | `api/fit/import` | `FitImportResponse` | Imports one or more `.fit` files for the current user. `multipart/form-data`, repeated field `files`. Parses each file's session summary + laps and persists them; `401` unauthenticated. `@Profile("jpa")`. |

### DTOs

`FitImportResponse = { imported, enriched, duplicates, failed, results: [{ filename, status, activityId?, error? }] }`
where `status ∈ {"imported","enriched","duplicate","failed"}`. Failures are per-file: one
bad/corrupt file in a multi-file upload is reported as `failed` with an `error` and does not
abort the others. `.fit` files are uploaded directly from the device/watch (rate-limit-free,
unlike Strava sync). Each file is identified by the SHA-256 of its bytes (`fit_file_hash`,
unique) so re-uploading the same file is a no-op (`duplicate`). FIT is the **primary source
going forward**: when an uploaded file's `start_time` is within 60s of an existing activity of
the same type, that activity is **enriched** (FIT summary + laps written, FIT values win) with
its `external_strava_id` preserved; a later Strava sync of that activity updates only its base
fields and never overwrites the FIT data (`source` stays `"fit"`). Only the session **summary**
and **laps** are stored — the per-second GPS/HR/power record stream is not (yet).

`UserResponse = { id, email, username, photoUpdatedAt, themePreference, languagePreference }`.
`photoUpdatedAt` is epoch millis of the last photo upload, or `null` when no photo is set — the
frontend uses it both to decide whether to render an avatar image and as a `?v=` cache-buster on
the photo URL. `themePreference` is always a concrete `"light"`/`"dark"`/`"system"`: it is stored
in the nullable `users.theme_preference` column and an unset (null) value is coerced to `"system"`
at the response boundary, so the client never sees null. It is carried on `me` **and** the
login/register `AuthResponse` so the stored theme applies on login. `languagePreference` works
identically: a concrete `"en"`/`"es"`, stored in the nullable `users.language_preference` column,
null coerced to `"en"` at the boundary, and carried on `me` + `AuthResponse` so the stored
language applies on login. Photo bytes are stored inline on the `users` table (`photo bytea`)
alongside `photo_content_type`; these endpoints require a valid session (`401` otherwise).

`ActivityDTO = { id, type, distance, duration, avgHr, externalStravaId, startDate, trainingLoad, source }`.
`trainingLoad` is derived server-side (`duration × avgHr`, via `TrainingLoadCalculator`)
and is read-only — it is ignored on the `activities/sync` input. `source` is `"strava"` or
`"fit"`; it is stored in the nullable `activities.source` column and an unset (null) value is
coerced to `"strava"` at the response boundary (same pattern as `themePreference`), so the
client never sees null and legacy rows need no backfill. The richer FIT session-summary columns
(power, cadence, ascent, running dynamics, etc.) and the `activity_laps` rows are **persisted
but not exposed** on `ActivityDTO` — surfacing them is a separate workitem.

`avgHr` is **nullable**: Strava only returns `average_heartrate` when the athlete
granted HR access and the activity has an HR stream. Activities without it are
synced and stored with `avg_hr = NULL` (training load then computes to 0).

## Database migrations

Schema is managed by Hibernate `spring.jpa.hibernate.ddl-auto=update`, which adds
new columns/tables but **never drops an existing constraint**. Schema changes that
`update` can't perform (dropping a NOT NULL, renaming, etc.) are hand-written SQL
scripts under `backend/athletedna/db/migrations/`, named `YYYY-MM-DD_<change>.sql`,
applied manually once per environment. No migration framework (Flyway/Liquibase) is
in use. Example:

```bash
psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-02_avg_hr_nullable.sql
```

The profile-photo columns (`2026-06-02_user_profile_photo.sql`) are added automatically by
`ddl-auto=update` since they are nullable; the script documents the change explicitly and is
safe to re-run (`ADD COLUMN IF NOT EXISTS`).

The theme-preference column (`users.theme_preference varchar(16)`, nullable) is likewise added
automatically by `ddl-auto=update`; existing rows stay valid (null is read as `"system"`), so
no manual script or backfill is needed.

The language-preference column (`users.language_preference varchar(8)`, nullable) is added the
same way by `ddl-auto=update`; existing rows stay valid (null is read as `"en"`), so no manual
script or backfill is needed.

The FIT-import columns on `activities` (the `source` marker, the unique `fit_file_hash` dedup
key, and the ~24 nullable session-summary columns) and the new `activity_laps` table are added
automatically by `ddl-auto=update` from the entity mappings. The one thing `update` does not do
reliably is the **UNIQUE index on `fit_file_hash`** and the `source` backfill, so those live in
`2026-06-12_fit_import.sql` (also documents the `activity_laps` shape + FK/order index for
direct-SQL environments). The columns being nullable, existing Strava rows stay valid without it;
the script is re-runnable (`IF NOT EXISTS` / idempotent `UPDATE`).

Activities are owned per-user via `activities.user_id`. `ddl-auto=update` adds the column
(nullable) on its own, but the **backfill + NOT NULL + foreign key** to `users(id)` cannot be
applied to populated rows by `update`, so they live in `2026-06-07_activity_user_id.sql` — run
it once per environment. The backfill assigns all pre-existing activities to the single
existing user (this app has been effectively single-user); edit the script's `UPDATE` if more
than one user exists. After this, reads are scoped to the logged-in user (the dashboard and
activities list show only the caller's activities).

## Backend configuration

| Property | Env | Default | Purpose |
|---|---|---|---|
| `app.frontend-url` | `FRONTEND_URL` | `http://localhost:3000` | Target the OAuth callback 302-redirects to. |
| `strava.redirect-uri` | `STRAVA_REDIRECT_URI` | `http://localhost:8080/api/strava/callback` | Where Strava sends the user back. |
| `strava.client-id` / `strava.client-secret` | `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | — | OAuth app credentials (in `application-local.properties` for dev). |
| `insight-engine.base-url` | `INSIGHT_ENGINE_URL` | `http://localhost:8000` | Base URL of the Python insight engine. |
| `insight-engine.internal-token` | `INSIGHT_ENGINE_TOKEN` | — | Shared secret sent as `X-Internal-Token`; must equal the engine's `INTERNAL_TOKEN`. Empty → the engine rejects every call (fail closed). |
