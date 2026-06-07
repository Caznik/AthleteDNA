---
wi: WI-dark-theme/20260603-dark-theme-toggle
phase: documentation
status: confirmed
date: 2026-06-05
project-docs-found: yes
---

## Project Documentation Updated
| File | Section | Change |
|---|---|---|
| `README.md` | Backend HTTP API | Added the `PUT api/auth/me/theme` row (`{ theme }` must be `light`/`dark`/`system`, else `400`); extended the `UserResponse` shape to `{ …, themePreference }` and documented the null→`"system"` coercion at the response boundary + that it's carried on login/register. |
| `README.md` | Database migrations | Noted the `users.theme_preference varchar(16)` nullable column is auto-added by `ddl-auto=update`; null read as `"system"`, so no manual script/backfill. |
| `frontend/README.md` | Architecture | Documented the theme stack: `next-themes` `ThemeProvider` in `providers.tsx`, the `Appearance` control (`profile-theme-form.tsx` from `buttonVariants`), the `useUpdateTheme` mutation + `me/theme` BFF route, and the app-wide `theme-sync.tsx` that restores the backend preference on login/fresh device. |

## Workitem Documentation

### What was built
Users can now choose how AthleteDNA looks — **Light**, **Dark**, or **System** (follow the OS) —
from a new **Appearance** card on the Profile page. The choice applies instantly across the whole
app (background, cards, text, charts) with no reload, and is **persisted to the user's account**,
so it follows them across browsers and devices and is restored on the next login.

### How it works
- **Storage (Postgres).** A nullable `theme_preference varchar(16)` column was added to the
  `users` table (auto-created by `ddl-auto=update`; the project has no Flyway/Liquibase). A null
  value means "never chosen" and is read as `"system"`, so existing rows need no backfill.
- **Backend (hexagonal).** Domain `User` + `UserEntity` carry `themePreference`, mapped both ways
  by `UserPersistenceMapper`. A new `UpdateThemeUseCase` port + `UpdateThemeService`
  (`@Service @Profile("jpa")`) validate the value is one of `light`/`dark`/`system` (else
  `InvalidThemeException` → `400`) and persist it (no-op when unchanged). `AuthController` exposes
  `PUT /api/auth/me/theme` and includes `themePreference` on `GET /me` and the login/register
  `AuthResponse`. The value is **always concrete on the wire**: null is coerced to `"system"` at
  the controller boundary, so the client never handles null. Unauthenticated calls return `401`
  via the existing `currentUserProvider.current()` seam.
- **Frontend (`next-themes` + React Query).** `next-themes`' `ThemeProvider`
  (`attribute="class"`, `defaultTheme="system"`, `enableSystem`) is wired in
  `src/app/providers.tsx`; it toggles the `.dark` class on `<html>` (which carries
  `suppressHydrationWarning`), and its injected blocking script reads the stored choice before
  first paint so there is no flash of the wrong theme. The **Appearance** control
  (`src/components/profile-theme-form.tsx`) is a segmented group built from `buttonVariants`; it
  gates on a `mounted` flag, shows the active option using the next-themes *setting* (`theme`, not
  `resolvedTheme`, so "System" can show as selected), and on click both calls `setTheme()` for the
  instant local switch and fires the `useUpdateTheme` mutation to persist.
- **App-wide restore.** `src/components/theme-sync.tsx` — a render-null component rendered inside
  `ThemeProvider` in `Providers` — reads `useCurrentUser` and pushes the backend
  `themePreference` into `setTheme`. Because it lives at the app root (not in the Profile page),
  the stored theme is restored on **every** page on login and on a fresh device, not only after
  visiting Profile. It is keyed only on the stored value, so it runs on load and idempotently
  after a save, never clobbering an in-session switch.
- **Persistence channel.** `useUpdateTheme` (`src/lib/auth-queries.ts`) sends
  `PUT /api/auth/me/theme` through a BFF route (`src/app/api/auth/me/theme/route.ts`) that
  attaches the session JWT and relays the backend's `400`/`401`. On success it updates the
  React Query cache; on failure it shows a non-blocking toast without reverting the local switch.

### Usage
1. Sign in and open **Profile**.
2. In the **Appearance** card, click **Light**, **Dark**, or **System**. The whole app switches
   theme immediately.
3. The choice is saved to your account — reload, sign in from another browser, or use a new
   device and the same theme is applied automatically. **System** tracks your OS light/dark
   setting.

Backend (direct API): `PUT /api/auth/me/theme` with `{ "theme": "light" | "dark" | "system" }`
and a valid session; the value is echoed back on `UserResponse.themePreference` and on
`me`/login/register.

### Known limitations
None blocking (review verdict: **pass**). By design and recorded out-of-scope: one global
preference only (no per-page/per-component overrides); only Light/Dark/System (no custom accent
colors, no time-scheduled switching); the toggle lives only on the Profile page (not the site
header); the `.dark` color tokens in `globals.css` were used as-is. Approach-A trade-off: on a
brand-new device the first paint shows the local/default theme for a sub-second before
`<ThemeSync/>` snaps it to the account's stored value once `/me` resolves.

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-05; user proceeded to repo then archive.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** documentation
**Reason:**
