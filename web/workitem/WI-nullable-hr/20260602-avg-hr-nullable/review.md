---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: review
status: confirmed
date: 2026-06-02
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | `avgHr` no longer `@Column(nullable=false)` | yes | `ActivityEntity.java:32` now `@Column private Integer avgHr;`. Other NOT NULL columns (type/distance/durationSeconds) left intact per audit. Reviewer-confirmed by reading the file. |
| AC-2 | SQL migration committed + run instructions | yes | `backend/athletedna/db/migrations/2026-06-02_avg_hr_nullable.sql:15` = `ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL;`, with header explaining the ddl-auto=update limitation and the exact psql run command (lines 12-13). |
| AC-3 | Null-HR persists via JPA, no NOT NULL violation (automated) | yes | `ActivityEntityPersistenceTest.save_activityWithNullAvgHr_persistsAndReReadsWithNullHr` — @DataJpaTest on H2 (schema generated from entity annotations), saves+rereads null. Sub-agent reported Red on old annotation, Green after. |
| AC-4 | HR-less Strava payload syncs, stores avg_hr=NULL | yes (code/tests) | `StravaRestClientAdapterTest.fetchActivities_payloadWithoutHeartRate_mapsToNullAvgHr` (null average_heartrate → null summary) + existing `ActivitiesSyncUseCaseTest.sync_savesActivityWithNullHeartRate`. Combined with AC-3 = end-to-end null persists. **Live Postgres re-sync is an operational follow-up (see Gaps).** |
| AC-5 | Regression: null-HR → training load 0; suite green | yes | `ActivityWebMapperTest.toDTO_nullAvgHr_yieldsZeroTrainingLoad:42`. Full suite: 70 tests, 0 failures (`./mvnw.cmd test`). |
| AC-6 | Column audit preserved as rationale | yes | Audit table in `analyze.md` ("Audit of Strava-mapped columns"); to be carried into `documentation.md` in the document phase. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — relax entity | yes | `ActivityEntity.java:32`. |
| Step 2 — SQL migration script | yes | `db/migrations/2026-06-02_avg_hr_nullable.sql`. |
| Step 3 — H2 @DataJpaTest | yes | `ActivityEntityPersistenceTest` + `src/test/resources/application-test.properties` + H2 test-scope dep in `pom.xml:106-109`. |
| Step 4 — HR-less payload mapping test | yes | `StravaRestClientAdapterTest`. |
| Step 5 — preserve audit | yes | In analyze.md; document phase will carry it forward. |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| Step 3 | Spring Boot 4.0.6 relocated `@DataJpaTest` to `org.springframework.boot.data.jpa.test.autoconfigure` + added `@AutoConfigureTestDatabase(replace=NONE)` to use the H2 profile datasource | acceptable — verified imports in the test file; required by the Boot 4.x classpath, no scope/AC impact |
| Step 1 | `@Column` written on its own line vs inline | acceptable — cosmetic, matches surrounding style |

## Live Verification (performed during review)
- Postgres runs in Docker container `athletedna-postgres` (postgres:17-alpine, :5432).
- **Before:** `information_schema.columns` showed `avg_hr` `is_nullable = NO` — the
  live root cause.
- **Migration applied:** ran `ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL`
  (the committed script's statement) via `docker exec ... psql`. **After:**
  `avg_hr` `is_nullable = YES`.
- **Reproduced the original failure as a guard:** in a rolled-back transaction,
  inserted a row using the exact values from the production stack trace
  (distance 6062.6, duration_seconds 2694, external_strava_id 18678957729,
  `avg_hr = NULL`). Result: `INSERT 0 1` (succeeds). Pre-migration this is the
  insert that raised the PSQLn NOT NULL violation. Transaction rolled back — no
  test data persisted.
- Full live `/sync` HTTP re-run was not executed (backend not running; would need
  app start + Strava-linked user + JWT). The rolled-back insert exercises the exact
  DB operation `ActivityJpaAdapter.save` performs, which is the failure point in
  the original trace.

## Gaps
- _None remaining._ The live-migration follow-up was performed and verified during
  this review (see Live Verification).

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** User chose to apply the migration and verify live. Migration applied to
the Docker Postgres and the previously-failing NULL-avg_hr insert confirmed
working (rolled back). Verdict pass, no gaps.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** review
**Reason:**
