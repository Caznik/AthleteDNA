---
wi: WI-nullable-hr
created: 2026-06-02
updated: 2026-06-02
status: completed
last_phase: archive
---

# WI-nullable-hr — Make heart-rate fields nullable

## Current State
- **Phase:** archive (complete)
- **Blocked:** no

## Sub-features
| Sub-feature | Status |
|---|---|
| 20260602-avg-hr-nullable | completed (phases: all) |

## Active Blockers
_None._

## Key Decisions Log
| Date | Decision | Reason |
|---|---|---|
| 2026-06-02 | wi-implement dispatch #1 for 20260602-avg-hr-nullable | initial |
| 2026-06-02 | Applied SQL migration to live Docker Postgres (athletedna-postgres) during review; avg_hr now is_nullable=YES; previously-failing NULL insert verified (rolled back) | review-phase live verification |

## Parking / Cancellation
_None._
