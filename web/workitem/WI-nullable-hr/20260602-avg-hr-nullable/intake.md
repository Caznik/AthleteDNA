---
wi: WI-nullable-hr
sub_feature: 20260602-avg-hr-nullable
phase: intake
status: confirmed
date: 2026-06-02
---

# Intake — 20260602-avg-hr-nullable

## Request
Sync functionality is failing with:

```
org.postgresql.util.PSQLException: ERROR: null value in column "avg_hr" of relation "activities" violates not-null constraint
```

Strava activities may not have heart-rate data because the athlete must grant
permission for it. We cannot keep `avg_hr` (and likely other HR-derived fields)
as mandatory. The failure occurs in `ActivityJpaAdapter.save` →
`findByExternalStravaId` autoflush during `ActivitiesSyncUseCase.sync`.

## Classification
- **Type:** Bugfix (significant — behavioural + schema change)
- **Scope:** Persistence layer (JPA entity + DB schema/migration), domain model, mappers, sync use case.

## Routing Decision
- **Flow:** Full workflow
- **Rationale:** Touches DB schema (NOT NULL → nullable, migration required), JPA
  entity, domain model and mappers; changes a behavioural contract ("HR is no
  longer mandatory"). Full flow allows checking sibling fields for the same issue.
- **Phases:** analyze → propose → plan → implement → review → document → repo → archive

## Confirmation
- Confirmed by user: yes

## Cancellation
_None._
