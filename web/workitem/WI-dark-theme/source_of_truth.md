---
wi: WI-dark-theme
created: 2026-06-03
updated: 2026-06-03
status: active
last_phase: propose
---

# WI-dark-theme — Source of Truth

## Current State
- **Phase:** plan (drafted — awaiting user sign-off)
- **Blocked:** no
- **Resume here:** `plan.md` is written with `status: pending`. Two open questions for the user before sign-off: (1) null→`system` coercion at DTO boundary vs literal null on the wire; (2) building the Appearance control from `buttonVariants` rather than a new shared UI primitive. On sign-off → set plan.md `status: confirmed`, update this file, then run `/wi-implement`.

## Sub-features
| Sub-feature | Status |
|---|---|
| 20260603-dark-theme-toggle | in-progress |

## Active Blockers
_None._

## Key Decisions Log
- **2026-06-03** — Theme options: Light / Dark / System. Persistence: backend user profile (cross-device). Control: segmented-buttons "Appearance" Card on Profile page.
- **2026-06-03** — Frontend strategy: **Approach A** — `next-themes` engine + react-query backend sync. Chosen for lowest effort, built-in System detection + anti-flash script, and reuse of the existing optimistic-mutation pattern.

## Parking / Cancellation
_None._
