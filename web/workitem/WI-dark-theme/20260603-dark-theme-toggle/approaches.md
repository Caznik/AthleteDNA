---
wi: WI-dark-theme/20260603-dark-theme-toggle
phase: propose
status: confirmed
date: 2026-06-03
triggered: yes
---

The product decisions are settled (Light/Dark/System, backend persistence, segmented "Appearance" Card). The open architectural question is **how the theme engine reconciles with the backend-persisted preference while satisfying AC-4 (no flash of the wrong theme, no hydration warning)**. The backend slice (domain → entity → mapper → `UpdateThemeService` → controller → DTOs → BFF route) is the same in every approach; the approaches differ only in the **frontend theme-application strategy**.

## Approach A — `next-themes` engine + react-query backend sync
**Summary:** Use `next-themes` for the actual class toggling and System (OS) detection. The Appearance control calls `setTheme()` for an instant local switch **and** fires a react-query mutation to persist to the backend (mirroring `useUpdateUsername`). On app load, once `useCurrentUser` resolves, push the backend `themePreference` into `next-themes` via `setTheme()` when it differs. Flash avoidance uses `next-themes`' built-in blocking inline script (reads `localStorage` before paint).
**Pros:**
- Smallest, most idiomatic change; library already installed and handles System detection + the anti-flash script for free.
- Reuses the existing react-query optimistic-mutation pattern verbatim (AC-7 toast-on-failure falls out naturally).
- No server-component/session plumbing changes to `layout.tsx`.
**Cons:**
- `localStorage` and the backend can briefly diverge: on a **brand-new device**, first paint shows the `localStorage`/default value, then snaps to the backend value once `/me` resolves (a one-time, sub-second correction — not a "wrong theme" on subsequent loads).
- Two sources of truth (localStorage + backend), with backend as the authority on load.
**Effort:** low

## Approach B — Server-rendered theme class (no `next-themes`)
**Summary:** Read the preference server-side (the session JWT cookie is available to the Next.js server layer) and set the `.dark` class on `<html>` during SSR, so the correct theme is in the very first byte of HTML. The Appearance control posts to the backend then triggers a refresh / manual class toggle. A small client script handles the System option's `prefers-color-scheme`.
**Pros:**
- Zero flash on every load, including first load on a new device — the server emits the right class.
- Single source of truth (backend); no `localStorage`.
**Cons:**
- Most custom code: must wire the session read into the currently-identity-agnostic `layout.tsx`, hand-roll the class toggle, and **still** add a client media-query script for "System" (the server can't know the OS preference).
- Drops the installed `next-themes` and re-implements what it already does; diverges from the app's client-side/react-query data pattern.
- An extra server round-trip / `router.refresh()` to reflect a change unless also toggled client-side.
**Effort:** high

## Approach C — `next-themes` + cookie-mirrored initial value (hybrid)
**Summary:** Approach A, plus mirror the resolved preference into a cookie so the server component (`layout.tsx`) can read it and seed the initial class / `ThemeProvider` value — closing Approach A's first-load-on-new-device gap while keeping `next-themes` for runtime switching and System detection.
**Pros:**
- Eliminates even the one-time cross-device snap; keeps `next-themes` conveniences.
**Cons:**
- Two persistence channels (backend + cookie) to keep in sync — more moving parts and edge cases for a sub-second cosmetic gap.
- Adds server-session plumbing to `layout.tsx` that Approach A avoids.
**Effort:** medium

## Selected Approach
**Choice:** Approach A — `next-themes` engine + react-query backend sync
**Rationale:** Lowest-effort, most idiomatic fit: `next-themes` is already installed and provides System detection plus the anti-flash blocking script for free, and the persistence reuses the existing optimistic react-query mutation pattern (so AC-7's toast-on-failure falls out naturally) with no `layout.tsx` session plumbing. The only trade-off — a one-time, sub-second correction on a brand-new device — is acceptable under AC-4.

## Confirmation
**Confirmed by user:** yes
**Notes:** Selected via structured choice. Backend slice (domain → entity → mapper → UpdateThemeService → controller → DTOs → BFF route) is unchanged from analyze.

## Cancellation
_(Fill only if status: cancelled)_
