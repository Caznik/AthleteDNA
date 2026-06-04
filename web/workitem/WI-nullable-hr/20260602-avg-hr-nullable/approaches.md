---
wi: WI-nullable-hr/20260602-avg-hr-nullable
phase: propose
status: confirmed
triggered: no
date: 2026-06-02
---

## Propose — not triggered

A separate propose phase was not run because the meaningful trade-offs were
already decided during analyze, leaving one obvious implementation direction:

- **DB migration mechanism** — resolved in analyze: hand-written SQL script +
  run instructions (no migration tool introduced).
- **Scope** — resolved in analyze: relax only `avg_hr`; audit showed the other
  Strava-mapped columns are always populated or already nullable.

### Single selected approach
1. Remove `@Column(nullable = false)` from `ActivityEntity.avgHr` so JPA treats
   it as nullable.
2. Add a committed SQL script that runs
   `ALTER TABLE activities ALTER COLUMN avg_hr DROP NOT NULL` against the live DB,
   since `ddl-auto=update` will not drop the existing constraint.
3. Add an automated test proving a null-HR Activity persists, and verify the
   end-to-end sync path for an HR-less Strava payload.

No competing approaches with material trade-offs remain.
