---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: analyze
status: confirmed
date: 2026-06-02
---

## Requirements
1. Strava activities without heart-rate data (the athlete did not grant HR
   permission, or the activity has no HR stream) must sync and persist
   successfully, storing `avg_hr` as NULL.
2. The `avg_hr` column on `activities` must drop its NOT NULL constraint in the
   live Postgres database. Because `ddl-auto=update` will not remove an existing
   NOT NULL constraint, this is applied via a hand-written SQL migration script
   plus run instructions (no migration tool is being introduced).
3. The JPA entity must no longer declare `avgHr` as `@Column(nullable = false)`.
4. An audit of the other Strava-mapped, currently NOT NULL columns must be
   recorded with a keep/relax decision and rationale.
5. Downstream null handling (TrainingLoadCalculator, web mapper, frontend) must
   remain correct — a null-HR activity yields training load 0 and is excluded
   from HR aggregates.

## Audit of Strava-mapped columns (NOT NULL today)
| Column | Strava source | Adapter behaviour | Decision |
|---|---|---|---|
| `avg_hr` | `average_heartrate` | passed through as null when absent | **Relax → nullable** |
| `type` | `type` | defaulted to `""` when null | Keep NOT NULL (always populated) |
| `distance` | `distance` | defaulted to `0.0` when null | Keep NOT NULL (always populated) |
| `duration_seconds` | `moving_time` | defaulted to `0L` when null | Keep NOT NULL (always populated) |
| `external_strava_id` | `id` | — | Already nullable |
| `start_date` | `start_date` | — | Already nullable |

## Out of Scope
- Introducing Flyway/Liquibase or any migration framework.
- Revisiting the adapter's coercion of missing `type`/`distance`/`moving_time`
  to default values (existing behaviour, not causing the failure).
- Backfilling or repairing any partially-synced rows from the failed run.
- Any change to HR permission scope handling on the OAuth side.

## Open Questions
_None._

## Acceptance Criteria
- [ ] **AC-1** — `ActivityEntity.avgHr` no longer carries `@Column(nullable = false)`; it is persistable as null.
- [ ] **AC-2** — A SQL migration script (`ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL`) is committed to the repo with documented run instructions (psql command).
- [ ] **AC-3** — Saving an Activity with `avgHeartRate == null` through `ActivityJpaAdapter.save` persists successfully and does not raise a NOT NULL `PSQLException` (covered by an automated test).
- [ ] **AC-4** — Syncing a Strava activity payload lacking `average_heartrate` completes the sync use case without error and stores the row with `avg_hr = NULL`.
- [ ] **AC-5** — Regression: `TrainingLoadCalculator.calculate` returns 0 for a null-HR activity, and existing entity/mapper/web tests still pass.
- [ ] **AC-6** — The column audit (above) is preserved in the workitem documentation as the rationale for relaxing only `avg_hr`.

## Interview Notes
- User chose **SQL script + run instructions** for the DB change (no migration
  tool), fitting the current `ddl-auto=update` setup.
- User asked to **audit all Strava-optional columns**, not just `avg_hr`. Audit
  result: only `avg_hr` genuinely needs relaxing — the adapter already defaults
  `type`/`distance`/`moving_time`, and `external_strava_id`/`start_date` are
  already nullable.
- Key finding from code review: the Strava adapter (line 123), TrainingLoad
  calculator, web mapper and the entire frontend already handle null HR. The
  NOT NULL constraint at the entity + DB layer is the sole cause of the failure.

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-02
