---
wi: WI-dark-theme/20260603-dark-theme-toggle
phase: analyze
status: confirmed
date: 2026-06-03
---

## Requirements

### Functional
1. The user can choose a theme on the **Profile page** from three options: **Light**, **Dark**, and **System** (follows the OS `prefers-color-scheme`).
2. The selected theme applies immediately across the whole app (background, cards, text, charts) by toggling the `.dark` class on `<html>` — no page reload required.
3. The chosen preference is **persisted to the backend user profile** so it follows the user across browsers/devices.
4. On login / page load, the app applies the user's stored backend preference. While the session/preference is still loading, the app must not flash the wrong theme on first paint (no hydration mismatch, no "flash of incorrect theme").
5. The control is rendered as a labelled **"Appearance" Card with segmented buttons** (Light / Dark / System), styled consistently with the existing Profile cards (Photo, Username, Password, Strava).
6. The currently-active preference is visually indicated as selected in the segmented control.

### Technical / Architecture
7. **Backend (hexagonal, `jpa` profile):**
   - `User` domain model + `UserEntity` gain a nullable `themePreference` field (string: `light` | `dark` | `system`). `UserPersistenceMapper` maps it both ways.
   - Column is added automatically by Hibernate `ddl-auto=update` (no manual migration); nullable so existing rows stay valid. Null is treated as `system`.
   - New inbound port `UpdateThemeUseCase` + `UpdateThemeService` (`@Profile("jpa")`), mirroring `UpdateUsernameService`: validates the value is one of the three allowed strings (else `400`), loads the user, sets the preference, saves.
   - `AuthController` exposes an authenticated endpoint to update the theme (e.g. `PUT /api/auth/me/theme`).
   - `UserResponse` and `AuthResponse` (login/register/me) include `themePreference` so the client receives it everywhere it already receives identity.
8. **Frontend BFF + client:**
   - `AuthUser` type gains `themePreference`.
   - New BFF route proxies the theme update to the backend with the session JWT, mirroring the username PATCH route (relays 400/401).
   - `next-themes` `ThemeProvider` is wired into `Providers` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`); `<html>` gets `suppressHydrationWarning`.
   - On load, the user's backend `themePreference` is synced into next-themes; on change, the new value is applied via next-themes **and** persisted to the backend (optimistic UI + react-query cache update, mirroring the existing profile mutations).

## Out of Scope
- Per-page or per-component theme overrides — one global preference only.
- Theme options beyond Light / Dark / System (no custom accent colors, no scheduled/auto-by-time switching).
- A theme toggle anywhere other than the Profile page (e.g. site header). Could be added later reusing the same hook/mutation.
- Backfilling/migrating existing rows — null is interpreted as `system` at read time.
- Changing the existing color token values in `globals.css` (the `.dark` palette already exists and is accepted as-is).

## Open Questions
_None — all product decisions confirmed with the user (Light/Dark/System, backend persistence, segmented-buttons Card)._

## Acceptance Criteria
- [ ] **AC-1** — On the Profile page there is an "Appearance" Card with a segmented control offering Light, Dark, and System; the active option is shown as selected.
- [ ] **AC-2** — Selecting an option changes the app's theme immediately (the `.dark` class on `<html>` toggles for Dark, is removed for Light, and follows the OS for System) without a page reload.
- [ ] **AC-3** — The selected preference is sent to the backend and persisted on the user record; reloading the page or signing in from another browser restores the same preference.
- [ ] **AC-4** — On initial load there is no flash of the wrong theme and no React hydration warning for the `<html>` element.
- [ ] **AC-5** — `GET /api/auth/me`, login, and register responses all include `themePreference`; a null/absent stored value is treated as `system`.
- [ ] **AC-6** — The backend theme-update endpoint rejects any value other than `light`/`dark`/`system` with `400`, and rejects an unauthenticated request with `401`.
- [ ] **AC-7** — A persistence failure surfaces a non-blocking error (toast) and does not leave the UI stuck; existing profile sections (photo, username, password, Strava) continue to work unchanged.
- [ ] **AC-8** — Backend unit test(s) cover `UpdateThemeService` (valid values persist; invalid value → `400`); frontend test covers the Appearance control rendering the active option and invoking the update on selection. All existing tests still pass.

## Interview Notes
- Codebase already had most infra: `tailwind.config.ts` has `darkMode: ["class"]`, `globals.css` defines a full `.dark` token palette, and `next-themes@0.4.4` is a dependency — but it is **not** wired into `Providers`. So the bulk of new work is (a) wiring the provider, (b) the Profile control, and (c) backend persistence of the preference.
- **Agent-suggested, user-accepted:** three-option Light/Dark/System (vs two-way toggle); segmented-buttons Card to match existing profile sections.
- **User choice that raised scope:** persistence to the **backend user profile** (cross-device) rather than localStorage-only. This pulls in the full backend layer change (domain → entity → mapper → use case → controller → DTOs) plus a new BFF route, modelled on the existing username-update vertical slice.
- DB: `spring.jpa.hibernate.ddl-auto=update` — the new nullable column is created automatically; no Flyway/Liquibase migration step exists or is needed.

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-03
