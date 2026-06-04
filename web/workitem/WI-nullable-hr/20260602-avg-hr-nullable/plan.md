---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: plan
status: confirmed
date: 2026-06-02
approach: Single selected approach (propose not triggered)
---

## Context
**Selected approach:** Relax `avg_hr` at entity + DB, prove with an automated
persistence test, ship a hand-written SQL migration script.
**AC coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6

## Implementation Sequence

### Step 1 — Make avgHr nullable on the JPA entity
**Satisfies:** AC-1
**Files:** `infrastructure/persistence/entities/ActivityEntity.java`
**Description:** Remove `nullable = false` from the `avgHr` `@Column` (lines
32–33), leaving a plain `@Column private Integer avgHr;`. This stops Hibernate
from generating/validating the column as NOT NULL and lets the mapper persist a
null value. Domain model, persistence mapper, and Strava adapter already pass
null through unchanged, so no other production code needs editing.

### Step 2 — Add the SQL migration script + run instructions
**Satisfies:** AC-2
**Files:** `backend/athletedna/db/migrations/2026-06-02_avg_hr_nullable.sql` (new)
**Description:** Create a committed SQL script containing
`ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL;`, with a header
comment explaining why (ddl-auto=update will not drop an existing NOT NULL) and
the exact run command:
`psql -h localhost -U athletedna -d athletedna -f db/migrations/2026-06-02_avg_hr_nullable.sql`.
Place it under a new `db/migrations/` folder to establish a clear home for
hand-applied schema changes. The folder choice is a convention decision (see
Risks).

### Step 3 — Add H2-backed @DataJpaTest proving null avg_hr persists
**Satisfies:** AC-3, AC-5
**Files:**
- `backend/athletedna/pom.xml` (add `com.h2database:h2` test scope)
- `src/test/java/.../infrastructure/persistence/ActivityEntityPersistenceTest.java` (new)
- possibly `src/test/resources/application-test.properties` (H2 datasource + ddl-auto=create-drop)
**Description:** A `@DataJpaTest` persists an `ActivityEntity` with `avgHr = null`
via the JPA repository and asserts it is saved and re-read with null HR. Because
H2's schema is generated from the entity annotations, this test fails while
`nullable = false` is present and passes once Step 1 lands — a real regression
guard for AC-1. Also assert a non-null-HR entity still persists (AC-5 sanity).

### Step 4 — Cover the HR-less Strava payload through the mapping path
**Satisfies:** AC-4
**Files:**
- `src/test/java/.../infrastructure/strava/StravaRestClientAdapterTest.java`
  (new or extend, if one exists) OR extend `SyncStravaActivitiesServiceTest`
**Description:** Verify that a Strava activity payload with no
`average_heartrate` maps to an `Activity` / `StravaActivitySummary` whose avgHr
is null, and that the sync use case accepts it (the use-case null-HR path is
already covered by `ActivitiesSyncUseCaseTest.sync_savesActivityWithNullHeartRate`).
Combined with Step 3, this establishes that an HR-less sync stores `avg_hr = NULL`
end-to-end. A true live end-to-end check is the user re-running `/sync` after
applying the migration (manual verification noted for the review phase).

### Step 5 — Preserve the column audit as documented rationale
**Satisfies:** AC-6
**Files:** workitem `documentation.md` (document phase) — carries the audit table
from `analyze.md`.
**Description:** Ensure the keep/relax audit (only `avg_hr` relaxed; others kept)
is captured in the workitem documentation so the rationale survives. No code.

## Risks / Known Unknowns
- **New test dependency (H2):** Step 3 introduces H2 (test scope) and possibly a
  test profile. If you'd rather avoid any new dependency, the fallback is to drop
  Step 3 to a mapper-level unit test (does NOT catch the DB/entity constraint) and
  rely on the SQL migration + manual re-sync for AC-3. Flag at sign-off.
- **SQL script location convention:** `db/migrations/` is a new folder; if the
  team has a preferred location, adjust.
- **H2 vs Postgres semantics:** H2 validates the NOT NULL inferred from the
  entity annotation, which is exactly what we want to guard. It does not test the
  *live* Postgres column — that is handled by the migration script + manual sync.
- **Existing partially-synced rows:** out of scope; the failed transaction rolled
  back, so no cleanup is expected, but worth a glance during review.

## Confirmation
**Confirmed by user:** yes
**Notes:** User confirmed keeping H2 for the persistence test (Step 3) and the
`db/migrations/` location for the SQL script.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** plan
**Reason:**
