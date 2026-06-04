---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: implementation
status: completed
date: 2026-06-02
---

## Architecture Notes
- **Entity is the single source of NOT NULL truth here.** `ActivityEntity.avgHr`
  (`entities/ActivityEntity.java:32-33`) is the only place avg_hr is declared
  non-null in code; Hibernate derives the column constraint from it under
  `ddl-auto=update`. The domain `Activity` (`domain/model/Activity.java:14`),
  `ActivityPersistenceMapper.toEntity` (`mappers/ActivityPersistenceMapper.java:26`),
  and `StravaRestClientAdapter.toSummary` (`StravaRestClientAdapter.java:123`)
  all already pass avgHr/avgHeartRate through as a plain `Integer`, accepting
  null. So Step 1 is the only production code edit required. Confirmed.
- **ddl-auto=update never drops an existing NOT NULL** (`application-jpa.properties:8`),
  so the live Postgres column must be altered by hand — hence the committed SQL
  script (Step 2). H2 in the test, by contrast, regenerates schema from the
  entity each run, so the @DataJpaTest is a genuine guard for the annotation.
- **@DataJpaTest needs JPA autoconfig that the base profile disables.** The base
  `application.properties:5` excludes DataSource/Hibernate/DataJpaRepositories
  autoconfiguration (default profile = in-memory adapter, no DB). `application-jpa.properties:2`
  re-enables them for Postgres. A @DataJpaTest replaces the datasource with H2 but
  still inherits the base exclusion, which would break it. I add
  `src/test/resources/application-test.properties` that clears the exclusion and
  pins H2 (`ddl-auto=create-drop`), activated via `@ActiveProfiles("test")` — the
  minimal way to give the slice a working JPA context without touching prod config.
- **Repository is package-private** (`ActivityJpaRepository.java:10`, no public
  modifier). The persistence test lives in the same package
  (`infrastructure.persistence`) so it can inject the repository directly — matching
  the package layout already used for production classes.
- **Test conventions:** JUnit 5 + AssertJ + Mockito, package-mirrored test tree,
  `@Test`-per-behavior naming `method_condition_outcome` (see
  `SyncStravaActivitiesServiceTest`). New tests follow this.

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 3 | `import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest` (the classic Boot location) | Imported `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest` and added `@AutoConfigureTestDatabase(replace = Replace.NONE)` from `org.springframework.boot.jdbc.test.autoconfigure` | Spring Boot 4.0.6 relocated the JPA test slice annotation; the classic package does not exist on this classpath. `Replace.NONE` makes the test use the H2 datasource defined in application-test.properties instead of an auto-substituted one. No scope change. |
| 1 | "leaving a plain `@Column private Integer avgHr;`" | Wrote `@Column` on its own line above the field (kept existing field-line formatting) | Cosmetic; matches surrounding style. |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|
| 1 | `source_of_truth.md` not present in the workitem folder (only intake/approaches/analyze/plan/implementation). | Plan + analyze were fully supplied in the dispatch and were sufficient; proceeded without it. Main owns that file. | Resolved (non-blocking) |

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `entities/ActivityEntity.java:32` — `@Column private Integer avgHr;` (no `nullable=false`). Guarded by `ActivityEntityPersistenceTest.save_activityWithNullAvgHr_persistsAndReReadsWithNullHr` (fails on H2 with the old annotation, passes now). | COVERED |
| AC-2 | `backend/athletedna/db/migrations/2026-06-02_avg_hr_nullable.sql` — `ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL;` with header explaining ddl-auto=update limitation + psql run command. | COVERED |
| AC-3 | `infrastructure/persistence/ActivityEntityPersistenceTest.java::save_activityWithNullAvgHr_persistsAndReReadsWithNullHr` — saves entity with `avgHr=null` via JPA repo, re-reads null, no NOT NULL violation. | COVERED |
| AC-4 | `infrastructure/strava/StravaRestClientAdapterTest.java::fetchActivities_payloadWithoutHeartRate_mapsToNullAvgHr` (missing `average_heartrate` -> null summary) + existing `ActivitiesSyncUseCaseTest.sync_savesActivityWithNullHeartRate` (use case accepts null-HR activity). Combined with AC-3 = HR-less sync stores avg_hr=NULL end-to-end. Live re-run of `/sync` after migration noted for review-phase manual verification. | COVERED |
| AC-5 | `infrastructure/web/mappers/ActivityWebMapperTest.java::toDTO_nullAvgHr_yieldsZeroTrainingLoad` (null HR -> training load 0 via TrainingLoadCalculator). Full suite (entity/mapper/web) green: 70 tests, 0 failures. | COVERED |
| AC-6 | Column audit table preserved in `analyze.md` ("Audit of Strava-mapped columns"); to be carried into `documentation.md` in the document phase (no code). | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1, AC-3 | Red confirmed | Wrote `ActivityEntityPersistenceTest` (+ `application-test.properties`, H2 dep). Ran with old `nullable=false` entity: null-HR save FAILED with H2 `NULL not allowed for column "AVG_HR"`, non-null save passed — proving the test is a real guard. |
| 2 | AC-1, AC-3 | Pass | Applied entity change (`@Column private Integer avgHr;`). Re-ran `ActivityEntityPersistenceTest`: 2/2 pass. |
| 3 | AC-4 | Pass | Wrote `StravaRestClientAdapterTest`: missing `average_heartrate` -> null avgHr; present HR rounds to 150. 2/2 pass. |
| 4 | AC-2 | Pass | Verified SQL migration script content + run instructions committed. |
| 5 | AC-5, AC-6 | Pass | Confirmed `ActivityWebMapperTest.toDTO_nullAvgHr_yieldsZeroTrainingLoad` covers null-HR -> training load 0. AC-6 audit table preserved in analyze.md for the document phase. Full regression run: 70/70 pass. |

## Regression
**Test suite run:** yes — `./mvnw.cmd test` (JAVA_HOME=C:\Program Files\Java\jdk-21.0.11)
**Result:** pass — Tests run: 70, Failures: 0, Errors: 0, Skipped: 0; BUILD SUCCESS
**Failures:** none. No pre-existing failures observed.
**Note (live DB):** The SQL migration (AC-2) alters the live Postgres column and is
not exercised by the suite (H2 regenerates schema from the entity). Applying the
migration and re-running `/sync` against Postgres is a manual check for the review phase.
