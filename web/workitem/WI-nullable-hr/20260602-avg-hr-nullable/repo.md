---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: repo
status: skipped
date: 2026-06-02
---

## Repo phase — skipped

The working directory is not a git repository (`git rev-parse` → fatal: not a
git repository). No branch, commit, or push operations were possible or run.
User chose to skip the repo phase.

### Suggested commit message (for whenever the project is versioned)
```
fix(WI-nullable-hr): make activity avg_hr nullable for HR-less Strava syncs

Strava omits average_heartrate unless the athlete grants HR access, so
syncing such activities violated the activities.avg_hr NOT NULL constraint
and aborted the sync. Drop nullable=false on ActivityEntity.avgHr and add a
hand-applied SQL migration to relax the live column; HR-less activities now
store avg_hr = NULL (training load 0).

Workitem: WI-nullable-hr/20260602-avg-hr-nullable
```

### Files in scope
- `backend/athletedna/src/main/java/.../entities/ActivityEntity.java`
- `backend/athletedna/db/migrations/2026-06-02_avg_hr_nullable.sql`
- `backend/athletedna/pom.xml`
- `backend/athletedna/src/test/resources/application-test.properties`
- `backend/athletedna/src/test/java/.../persistence/ActivityEntityPersistenceTest.java`
- `backend/athletedna/src/test/java/.../strava/StravaRestClientAdapterTest.java`
- `backend/athletedna/src/test/java/.../web/mappers/ActivityWebMapperTest.java`
- `README.md`
