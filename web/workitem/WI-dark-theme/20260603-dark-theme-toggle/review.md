---
wi: WI-dark-theme/20260603-dark-theme-toggle
phase: review
status: confirmed
date: 2026-06-05
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | Appearance Card with Light/Dark/System segmented control; active option shown selected | yes | `profile-theme-form.tsx` renders three `buttonVariants` buttons (`default`=active via `aria-pressed`) inside a `Card`, added to `profile/page.tsx`. `profile-theme-form.test.tsx` asserts the active option is pressed. |
| AC-2 | Selecting applies the theme immediately (`.dark` toggles), no reload | yes | `handleSelect` calls `setTheme(value)`; `ThemeProvider attribute="class"` toggles `.dark` on `<html>`. Test asserts `setTheme("dark")` on click. |
| AC-3 | Preference persisted to backend; restored on reload / another browser | yes | `useUpdateTheme` → `PUT /api/auth/me/theme` → `UpdateThemeService.save`. `themePreference` on `me`+`AuthResponse`. **`<ThemeSync/>` (app-level) applies the stored value on every page** — the review fix that closed the original Profile-only gap. `theme-sync.test.tsx` covers it. |
| AC-4 | No flash of wrong theme; no `<html>` hydration warning | yes | next-themes blocking script (reads storage before paint) + `suppressHydrationWarning` on `<html>` + `mounted` guard before reading `theme`. |
| AC-5 | `me`/login/register include `themePreference`; null treated as system | yes | Added to `UserResponse` + `AuthResponse`; `AuthController.themePreference(user)` coerces null→`"system"`. `AuthControllerTest::me_coercesUnsetThemeToSystem`. |
| AC-6 | Invalid value → 400; unauthenticated → 401 | yes | `UpdateThemeService` validates against `{light,dark,system}` → `InvalidThemeException` → 400 via `AuthExceptionHandler`; `currentUserProvider.current()` → 401. Tests: `updateTheme_rejectsUnknownValue/_rejectsBlank/_rejectsNull`, `updateTheme_unauthenticatedThrows`. |
| AC-7 | Persistence failure → non-blocking toast; other sections unaffected | yes | `useUpdateTheme.onError` toasts; the local `setTheme` switch is not reverted (UI not stuck). Only auth types/queries touched — photo/username/password/Strava untouched. |
| AC-8 | Backend + frontend tests; all existing pass | yes | Backend 117/117 (incl. `UpdateThemeServiceTest` + 4 new `AuthControllerTest` cases); frontend 78/78 (incl. `profile-theme-form.test.tsx`, `theme-sync.test.tsx`); `tsc` + `next lint` clean. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — domain/entity/mapper field | yes | `User.themePreference`, `UserEntity` `theme_preference varchar(16)`, mapper both ways. |
| Step 2 — use case + validation | yes | `UpdateThemeUseCase`/`Service` + `InvalidThemeException`; no-op on unchanged value added in review. |
| Step 3 — endpoint + DTOs | yes | `PUT /api/auth/me/theme`; `themePreference` on `UserResponse`/`AuthResponse`; null→"system" coercion. |
| Step 4 — backend tests | yes | `UpdateThemeServiceTest` + expanded `AuthControllerTest` (mock added so existing tests construct the controller). |
| Step 5 — FE type, BFF route, mutation | yes | `ThemePreference` type, `me/theme` route, `useUpdateTheme`. |
| Step 6 — provider wiring + anti-flash | yes | `ThemeProvider` in `Providers`; `suppressHydrationWarning` on `<html>`. |
| Step 7 — Appearance card + backend↔engine sync | yes | Control in `profile-theme-form.tsx`; **sync lifted to `<ThemeSync/>`** (deviation, see below). |
| Step 8 — frontend test | yes | `profile-theme-form.test.tsx`; `theme-sync.test.tsx` added for the lifted sync. |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| 7 | Sync moved from `ProfileThemeForm` → app-level `<ThemeSync/>` | **improvement** — the in-component sync applied the stored theme only on `/profile`, leaving AC-3 (login / fresh-device restore) unmet elsewhere. App-level placement satisfies AC-3 fully. Covered by `theme-sync.test.tsx`. |
| 7 | Dropped redundant `cn(buttonVariants(...))` wrapper | acceptable — pure cleanup, no behavioural change. |
| 2 | Added no-op short-circuit on unchanged value | acceptable — efficiency, mirrors `UpdateUsernameService`; covered by `updateTheme_unchangedValueIsNoOp`. |

## Findings (high-effort review)
1. **[fixed] AC-3 gap** — backend→next-themes sync lived only in `ProfileThemeForm`, so a user signing in on a new device saw their stored theme only after navigating to Profile. Fixed by lifting to `<ThemeSync/>` in `Providers`.
2. **[fixed] redundant `cn()`** in the control — removed.
3. **[fixed] redundant UPDATE** on re-selecting the current theme — `UpdateThemeService` now no-ops.

## Gaps
None. All 8 ACs satisfied with code-level evidence; all 8 plan steps implemented; the one
material deviation (app-level sync) strengthens AC-3. Test counts (backend 117/117, frontend
78/78) confirmed by the user's `./mvnw test` run and the local `vitest` run.

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** Review fixes (#1 app-level sync, #2 cn cleanup, #3 no-op) approved and applied 2026-06-05; backend re-run 117/117 green.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** review
**Reason:**
