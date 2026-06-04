---
wi: WI-profile-photo
created: 2026-06-02
updated: 2026-06-02
status: completed
---

# WI-profile-photo — Profile Photo Upload

## Current State
- phase: archive
- blocked: no

## Sub-features
| Sub-feature | Status | Phases completed |
|---|---|---|
| 20260602-profile-photo-upload | completed | all (repo skipped at user request) |

## Active Blockers
_None._

## Key Decisions Log
- 2026-06-02 — Storage: photo bytes stored in Postgres `bytea` column on `users` (not filesystem/S3).
- 2026-06-02 — Constraints: accept JPEG/PNG/WebP, max 2 MB.
- 2026-06-02 — Remove action included; photo shown in profile header + top nav, initials as fallback.
- 2026-06-02 — Serving (Approach A): dedicated binary endpoint `PUT/DELETE/GET /api/auth/me/photo`; `me` JSON carries only `photoUpdatedAt` used as a `?v=` cache-buster. Keeps the me endpoint lean.
- 2026-06-02 | wi-implement dispatch #1 for 20260602-profile-photo-upload | initial
- 2026-06-02 — Review verdict: pass (all 11 ACs verified against source; no gaps).
- 2026-06-02 — Repo phase skipped at user request (no commit performed).

## Parking / Cancellation
_N/A._
