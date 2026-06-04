---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: documentation
status: confirmed
date: 2026-06-02
project-docs-found: yes
---

## Project Documentation Updated
| File | Section | Change |
|---|---|---|
| `README.md` | Backend HTTP API (ActivityDTO note) | Added a note that `avgHr` is nullable — Strava omits `average_heartrate` without HR access; such activities store `avg_hr = NULL` and compute training load 0. |
| `README.md` | New "Database migrations" subsection | Documented the hand-applied `db/migrations/` convention (why: `ddl-auto=update` never drops constraints), naming pattern, and the psql run command. |

## Workitem Documentation

### What was built
Strava activity sync was failing for any athlete whose activities lacked
heart-rate data: the `activities.avg_hr` column was `NOT NULL`, so persisting an
activity with no HR threw `PSQLException: null value in column "avg_hr" ...
violates not-null constraint` and aborted the whole sync. Strava only returns
`average_heartrate` when the athlete has granted HR access and the activity has an
HR stream, so HR must be optional. This workitem makes `avg_hr` nullable end to
end so HR-less activities sync and store `avg_hr = NULL`.

### How it works
- **Entity (the only production code change):** `ActivityEntity.avgHr` dropped its
  `@Column(nullable = false)` and is now a plain `@Column private Integer avgHr;`.
  Everything downstream already tolerated null — the domain `Activity`, the Strava
  adapter (`StravaRestClientAdapter.toSummary` maps a missing `average_heartrate`
  to `null`), `TrainingLoadCalculator` (treats null HR as 0), the web mapper, and
  the frontend (`avgHr: number | null`).
- **Live schema:** Hibernate runs with `ddl-auto=update`, which never drops an
  existing NOT NULL constraint — so changing the annotation alone does not fix a
  database that already has the column. A hand-written script,
  `backend/athletedna/db/migrations/2026-06-02_avg_hr_nullable.sql`
  (`ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL`), is applied once per
  environment. It was applied to the local Docker Postgres during review.
- **Audit:** of the four NOT NULL Strava-mapped columns, only `avg_hr` needed
  relaxing. `type`/`distance`/`duration_seconds` are always populated (the adapter
  defaults missing values to `""`/`0.0`/`0L`), and `external_strava_id`/`start_date`
  were already nullable.

| Column | Strava source | Adapter behaviour | Decision |
|---|---|---|---|
| `avg_hr` | `average_heartrate` | passed through as null when absent | **Relaxed → nullable** |
| `type` | `type` | defaulted to `""` when null | Keep NOT NULL |
| `distance` | `distance` | defaulted to `0.0` when null | Keep NOT NULL |
| `duration_seconds` | `moving_time` | defaulted to `0L` when null | Keep NOT NULL |
| `external_strava_id` | `id` | — | Already nullable |
| `start_date` | `start_date` | — | Already nullable |

- **Test guard:** `ActivityEntityPersistenceTest` is an H2-backed `@DataJpaTest`.
  H2 regenerates its schema from the entity annotations each run, so it fails if
  `nullable = false` ever returns and passes with a null `avg_hr` insert — a real
  regression guard. `StravaRestClientAdapterTest` covers the HR-less payload →
  null mapping. (Boot 4.x note: `@DataJpaTest` now lives in
  `org.springframework.boot.data.jpa.test.autoconfigure`, paired with
  `@AutoConfigureTestDatabase(replace = NONE)` to use the H2 profile in
  `src/test/resources/application-test.properties`.)

### Usage
Applying the schema change to a new/existing environment:

```
psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-02_avg_hr_nullable.sql
```

(For the project's Docker Postgres: `docker exec athletedna-postgres psql -U
athletedna -d athletedna -f /path/in/container.sql`, or run the single `ALTER`
statement directly.) After that, `POST api/strava/sync` succeeds for athletes
without HR data; those activities appear with a null `avgHr` and training load 0.

### Known limitations
None — review verdict was `pass` with no accepted gaps. The fix was verified
live (migration applied; the previously-failing NULL-`avg_hr` insert confirmed
succeeding, then rolled back). A full HTTP `/sync` round-trip against a live
Strava-linked account was not run in-session (it requires a running backend +
linked athlete + JWT); the rolled-back insert exercises the exact DB operation
that previously failed.

## Confirmation
**Confirmed by user:** yes
**Notes:** Approved via "move next".

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** documentation
**Reason:**
