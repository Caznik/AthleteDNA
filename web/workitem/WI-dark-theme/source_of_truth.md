---
wi: WI-dark-theme
created: 2026-06-03
updated: 2026-06-05
status: completed
last_phase: archive
---

# WI-dark-theme — Source of Truth

## Current State
- **Phase:** archive (complete)
- **Blocked:** no
- **Outstanding manual step (carried over from repo):** the commit exists locally on branch
  `feat/dark-theme` (`6cc8ff3`) but was **not pushed** — the agent env had no GitHub
  credentials / no `gh`. To publish: `git push -u origin feat/dark-theme`, then open the PR at
  https://github.com/Caznik/AthleteDNA/compare/main...feat/dark-theme?expand=1 (see `repo.md`).
  The unrelated `docker-compose.yml` working-tree change was deliberately left uncommitted.

## Sub-features
| Sub-feature | Status |
|---|---|
| 20260603-dark-theme-toggle | completed (phases: all; push/PR is a manual follow-up) |

## Active Blockers
_None._

## Key Decisions Log
- **2026-06-03** — Theme options: Light / Dark / System. Persistence: backend user profile (cross-device). Control: segmented-buttons "Appearance" Card on Profile page.
- **2026-06-03** — Frontend strategy: **Approach A** — `next-themes` engine + react-query backend sync. Chosen for lowest effort, built-in System detection + anti-flash script, and reuse of the existing optimistic-mutation pattern.
- **2026-06-05** — Open questions resolved at plan sign-off: (1) API coerces null→`"system"` at the DTO boundary (concrete wire value, never literal null); (2) Appearance control built inline from `buttonVariants`, no new shared UI primitive.
- **2026-06-05** — Review (high effort) verdict **pass** (8/8 ACs); top finding fixed by lifting the backend→next-themes sync out of `ProfileThemeForm` into app-level `<ThemeSync/>` (closed the AC-3 login/fresh-device gap). Final tests: backend 117/117, frontend 78/78.
- **2026-06-05** — Archived at user request. Code complete and verified; the only open item is the manual `git push` + PR (agent env lacked credentials).

## Parking / Cancellation
_None._
