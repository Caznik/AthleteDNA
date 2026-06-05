---
wi: WI-dark-theme/20260603-dark-theme-toggle
phase: implementation
status: completed
date: 2026-06-05
---

## Architecture Notes
- **Persistence vertical slice mirrors username-update exactly.** Domain `User` gains a
  nullable `String themePreference`; `UserEntity` a `@Column(name="theme_preference", length=16)`
  (created automatically by `ddl-auto=update`, nullable so existing rows stay valid);
  `UserPersistenceMapper` maps it both directions. New inbound port `UpdateThemeUseCase` +
  `UpdateThemeService` (`@Service @Profile("jpa")`) holds validation; `AuthController` is the
  only web touchpoint. Same `orElseThrow(UnauthenticatedException::new)` + `@Profile("jpa")`
  guard as `UpdateUsernameService`.
- **Validation + 400 seam.** `UpdateThemeService` trims the input and checks it against
  `Set.of("light","dark","system")`, else throws `InvalidThemeException`; a new
  `@ExceptionHandler(InvalidThemeException.class)` in `AuthExceptionHandler` maps it to `400
  {error:"invalid_theme", message}`. The `401`-when-unauthenticated path is free via the
  existing `currentUserProvider.current()` seam (no Spring Security chain).
- **Null→"system" coerced at the DTO boundary (user decision).** `themePreference` is added to
  both `UserResponse` and `AuthResponse`; `AuthController.themePreference(user)` returns
  `"system"` when the stored value is null, so the wire contract is always one of the three
  concrete values and the client never branches on null. Carried on `me` AND login/register so
  the theme applies on login without a `/me` refetch.
- **No-op on unchanged value.** `UpdateThemeService` short-circuits (returns the user without
  saving) when the submitted theme equals the stored one — mirrors `UpdateUsernameService`,
  avoids a redundant UPDATE on re-selection.
- **Frontend: Approach A — `next-themes` engine + react-query sync.** `next-themes@0.4.4` was
  already a dependency but unwired. `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`,
  `enableSystem`, `disableTransitionOnChange`) is added to `Providers`; `<html>` gets
  `suppressHydrationWarning`. Its injected blocking script + the mounted guard satisfy AC-4
  (no flash, no hydration warning).
- **App-wide backend→engine sync lives in `<ThemeSync/>`, not the Profile control.** A
  render-null `theme-sync.tsx` (rendered inside `ThemeProvider` in `Providers`) reads
  `useCurrentUser` and pushes `themePreference` into `setTheme`, keyed only on the stored value
  (idempotent after a save; no feedback-loop clobber). This was moved out of `ProfileThemeForm`
  during review so the stored theme restores app-wide on login / on a fresh device, not only on
  `/profile` (see Plan Deviations).
- **Appearance control built from `buttonVariants` (user decision), no new UI primitive.**
  `profile-theme-form.tsx` renders three segmented buttons (`default`=active / `outline`=inactive),
  gates on a `mounted` flag, and reads the next-themes **setting** `theme` (not `resolvedTheme`,
  or System could never show as selected). On click: `setTheme(value)` (instant, AC-2) +
  `useUpdateTheme.mutate(value)` (persist, AC-3; `onError` toast, AC-7).
- **BFF route mirrors the username route.** `src/app/api/auth/me/theme/route.ts` (`PUT`) attaches
  the session JWT, forwards to backend `api/auth/me/theme`, and relays `400` (with the backend
  message) / `401` exactly like the username `PATCH` route. `AuthUser`/`BackendAuthResponse` gain
  `themePreference`, mapped in `lib/auth.ts establishSession`.

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 7 | Backend→next-themes sync effect lives **in `ProfileThemeForm`** (runs on Profile mount) | Lifted into an app-level `<ThemeSync/>` rendered in `Providers` | Review finding: in `ProfileThemeForm` the stored theme was applied only after visiting `/profile`, so login / fresh-device restore (AC-3) failed on every other page. Moving it app-wide closes the gap; the control keeps only `setTheme` + mutate. |
| 7 | Active indicator wrapped with `cn(buttonVariants(...))` | Dropped the redundant `cn()` wrapper (and its import) | Review cleanup: `cn` over a single class string is a no-op. |
| 2 | Plan didn't specify a no-op guard | `UpdateThemeService` returns early when the value is unchanged | Review efficiency: avoids a redundant UPDATE; matches `UpdateUsernameService`. |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|
| - | No JDK in the implementation environment | Backend compiled + tested by the user (`./mvnw test`): 116/116, then 117/117 after the no-op tweak + test | Resolved |

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `profile-theme-form.test.tsx::renders the three options with the active one pressed`; `Appearance` Card on `profile/page.tsx` | COVERED |
| AC-2 | `profile-theme-form.test.tsx::applies and persists the chosen theme on click` (asserts `setTheme("dark")`); `ThemeProvider attribute="class"` toggles `.dark` | COVERED |
| AC-3 | `theme-sync.test.tsx::applies the signed-in user's stored preference`; `UpdateThemeServiceTest` (persists each value); `themePreference` on `me`+`AuthResponse`; `<ThemeSync/>` applies it app-wide | COVERED |
| AC-4 | `mounted` guard in `profile-theme-form.tsx`; `suppressHydrationWarning` on `<html>`; next-themes blocking script | COVERED |
| AC-5 | `AuthControllerTest::me_coercesUnsetThemeToSystem`; `themePreference(user)` null→"system" coercion | COVERED |
| AC-6 | `UpdateThemeServiceTest::updateTheme_rejectsUnknownValue/_rejectsBlank/_rejectsNull` → `InvalidThemeException`→400; 401 via `currentUserProvider` seam (`updateTheme_unauthenticatedThrows`) | COVERED |
| AC-7 | `useUpdateTheme.onError` toast (auth-queries.ts); local `setTheme` not reverted on failure | COVERED |
| AC-8 | Backend 117/117 (incl. `UpdateThemeServiceTest`, expanded `AuthControllerTest`); frontend 78/78 (incl. `profile-theme-form.test.tsx`, `theme-sync.test.tsx`); `tsc`+`next lint` clean | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1..8 (frontend) | PASS — `tsc` clean, vitest 76/76, `next lint` clean | Implemented all 8 steps; added `themePreference` to test fixtures that build `AuthUser`/`BackendAuthResponse` |
| 2 | AC-5,6,8 (backend) | PASS — `./mvnw test` 116/116 (run by user) | Confirmed `UpdateThemeServiceTest` + expanded `AuthControllerTest` green |
| 3 | AC-3 (review fix) | PASS — vitest 78/78 after lifting sync to `<ThemeSync/>` | Added `theme-sync.test.tsx`; removed sync effect from `ProfileThemeForm` |
| 4 | AC-8 regression (both) | PASS — backend 117/117, frontend 78/78 | Re-ran both suites after the no-op tweak + `updateTheme_unchangedValueIsNoOp` test |

## Regression
**Test suite run:** yes (both)
**Result:** pass
**Failures:** none. Backend `./mvnw test`: `Tests run: 117, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS`. Frontend `vitest run`: `Test Files 12 passed, Tests 78 passed`. `tsc --noEmit` exit 0. `next lint`: no warnings or errors.
