---
wi: WI-dark-theme/20260603-dark-theme-toggle
phase: plan
status: pending
date: 2026-06-03
approach: Approach A — next-themes engine + react-query backend sync
---

## Context
**Selected approach:** Approach A — `next-themes` engine + react-query backend sync.
The work is a backend vertical slice (mirroring the existing **username-update** slice end-to-end) plus a frontend provider-wiring + Profile control. Allowed values: `light` | `dark` | `system`; a null/absent stored value is read as `system`.

**AC coverage map:**
| AC | Covered by |
|---|---|
| AC-1 (Appearance card w/ segmented control) | Step 7, Step 8 |
| AC-2 (instant theme switch, `.dark` toggles) | Step 6, Step 7 |
| AC-3 (persisted + restored cross-device) | Step 1, Step 3, Step 5, Step 7 |
| AC-4 (no flash, no hydration warning) | Step 6, Step 7 |
| AC-5 (me/login/register return themePreference; null→system) | Step 1, Step 3, Step 5 |
| AC-6 (backend rejects invalid→400, unauth→401) | Step 2, Step 3, Step 4 |
| AC-7 (failure toast, other sections unaffected) | Step 5, Step 7 |
| AC-8 (backend + frontend tests; existing pass) | Step 4, Step 8 |

## Implementation Sequence

### Step 1 — Persist `themePreference` through the domain/persistence layers
**Satisfies:** AC-3, AC-5
**Files:**
- `domain/model/User.java` (add `String themePreference` getter/setter, default null)
- `infrastructure/persistence/entities/UserEntity.java` (add `@Column(name = "theme_preference", length = 16)` nullable field — created automatically by `ddl-auto=update`)
- `infrastructure/persistence/mappers/UserPersistenceMapper.java` (map `themePreference` both directions)
**Description:** Add a nullable theme-preference field to the user record so the chosen theme is stored per user and survives across sessions/devices. Nullable keeps existing rows valid; null is interpreted as `system` downstream (read side), so no data backfill is needed.

### Step 2 — `UpdateThemeUseCase` port + service + validation
**Satisfies:** AC-6, AC-3
**Files:**
- `application/port/in/UpdateThemeUseCase.java` (new — `User updateTheme(UUID userId, String theme)`)
- `application/usecases/UpdateThemeService.java` (new — `@Service @Profile("jpa")`, mirrors `UpdateUsernameService`: normalize/validate the value is one of `light|dark|system` else throw, load user via `UserRepository`, set, save)
- `application/auth/InvalidThemeException.java` (new — runtime exception, mirrors `InvalidUsernameException`)
- `infrastructure/web/exceptions/AuthExceptionHandler.java` (add `@ExceptionHandler(InvalidThemeException.class)` → `400` with `{error, message}`)
**Description:** Encapsulate the theme update as an inbound use case with strict server-side validation, reusing the established service/exception pattern so an invalid value cleanly maps to `400`. The `401` for unauthenticated callers already comes for free from `CurrentUserProvider` → `UnauthenticatedException` (handled in `AuthExceptionHandler`).

### Step 3 — Expose the endpoint + carry `themePreference` in responses
**Satisfies:** AC-5, AC-6, AC-3
**Files:**
- `infrastructure/web/dtos/UpdateThemeRequest.java` (new — `record UpdateThemeRequest(String theme)`)
- `infrastructure/web/dtos/UserResponse.java` (add `String themePreference`)
- `infrastructure/web/dtos/AuthResponse.java` (add `String themePreference`)
- `infrastructure/web/controllers/AuthController.java` (inject `UpdateThemeUseCase`; add `PUT /api/auth/me/theme`; thread `themePreference` through `toUserResponse`/`toAuthResponse`, coercing null→`"system"` at the response boundary)
**Description:** Add the authenticated update endpoint and include the preference on `me`, login, and register so the client receives the stored theme everywhere it already receives identity. Coercing null→`system` in the DTO mappers keeps the wire contract a concrete value and satisfies AC-5's "null treated as system".

### Step 4 — Backend tests
**Satisfies:** AC-8, AC-6
**Files:**
- `application/usecases/UpdateThemeServiceTest.java` (new — valid values (`light`/`dark`/`system`) persist via repository; invalid value → `InvalidThemeException`; unknown user → `UnauthenticatedException`)
- `infrastructure/web/controllers/AuthControllerTest.java` (add: `PUT /me/theme` happy path returns updated `themePreference`; register a mock for the new `UpdateThemeUseCase` dependency so existing context/tests still construct the controller)
**Description:** Lock the validation contract and the new endpoint with unit tests, mirroring `UpdateUsernameServiceTest`/`AuthControllerTest`. Adding the mock dependency keeps the existing controller tests green (AC-8 "all existing tests still pass").

### Step 5 — Frontend type, BFF route, and react-query mutation
**Satisfies:** AC-3, AC-5, AC-7
**Files:**
- `frontend/src/lib/types.ts` (`AuthUser` + `BackendAuthResponse` gain `themePreference: "light" | "dark" | "system"`)
- `frontend/src/app/api/auth/me/theme/route.ts` (new — `PUT` BFF proxy: attach session JWT, forward to backend `api/auth/me/theme`, relay `400`/`401` like the username route)
- `frontend/src/lib/auth-queries.ts` (new `useUpdateTheme` mutation via `sendJson("/api/auth/me/theme", "PUT", { theme })`; optimistic `setQueryData` on the `authUserKey` cache; `onError` toast — mirrors `useUpdateUsername`)
**Description:** Wire the persistence channel end-to-end on the client using the existing BFF + optimistic-mutation conventions. The `onError` toast (no UI lock) directly satisfies AC-7; touching only auth types/queries leaves photo/username/password/Strava untouched.

### Step 6 — Wire `next-themes` provider + prevent flash/hydration warning
**Satisfies:** AC-2, AC-4
**Files:**
- `frontend/src/app/providers.tsx` (wrap children in `next-themes` `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`)
- `frontend/src/app/layout.tsx` (add `suppressHydrationWarning` to `<html>`)
**Description:** Activate the theme engine so toggling sets/removes `.dark` on `<html>` app-wide with no reload (AC-2). `next-themes`' injected blocking script plus `suppressHydrationWarning` eliminate the first-paint flash and the `<html>` hydration warning (AC-4).

### Step 7 — Appearance card on the Profile page + backend↔next-themes sync
**Satisfies:** AC-1, AC-2, AC-3, AC-4, AC-7
**Files:**
- `frontend/src/components/profile-theme-form.tsx` (new — "Appearance" `Card` with three segmented buttons Light/Dark/System built from `buttonVariants` (`default` = active, `outline` = inactive); reads current setting from `next-themes` `theme`; a `mounted` guard avoids reading theme before hydration; on click calls `setTheme(value)` for an instant switch **and** fires `useUpdateTheme`; an effect syncs the user's backend `themePreference` into `setTheme` once on load when it differs)
- `frontend/src/app/profile/page.tsx` (render `<ProfileThemeForm user={user} />` among the existing profile cards)
**Description:** Add the user-facing control matching the existing profile-card style, indicating the active option (AC-1) and applying changes instantly (AC-2) while persisting them (AC-3). The mounted guard preserves AC-4. Selection failure surfaces via the mutation toast without blocking the local switch (AC-7).

### Step 8 — Frontend test for the Appearance control
**Satisfies:** AC-8, AC-1
**Files:**
- `frontend/src/components/profile-theme-form.test.tsx` (new — mock `useUpdateTheme` and `next-themes` `useTheme`; assert the three options render with the active one indicated, and that clicking an option calls `setTheme` + the mutation with the chosen value)
**Description:** Cover the control's render + interaction following the `profile-username-form.test.tsx` mocking pattern. Run the full vitest + backend suites to confirm nothing regressed (AC-8).

## Risks / Known Unknowns
- **next-themes hydration:** the control must gate on a `mounted` flag before reading `theme`, and use the **setting** (`theme`: light/dark/system) — not `resolvedTheme` — for the active indicator, or the System option can't be shown as selected. Mitigated in Step 7.
- **Backend→engine sync loop:** the load-time sync effect must key on the user's stored value and not clobber an in-session change; guard so it runs only when the stored value differs from the current setting.
- **AuthControllerTest constructor:** adding `UpdateThemeUseCase` to `AuthController` will break controller-test construction until a mock is added — handled explicitly in Step 4.
- **Null contract choice:** plan coerces null→`system` at the response DTO boundary (concrete wire value) AND defaults `defaultTheme="system"` client-side. If you'd prefer the API to emit literal `null` and only coerce client-side, that's a minor swap — flag now if so.
- **No existing segmented/toggle UI primitive:** building the control from `buttonVariants` rather than adding a new shared component (keeps scope tight; can be promoted to a shared component later).

## Confirmation
**Confirmed by user:** no
**Notes:**

## Cancellation
_(Fill only if status: cancelled)_
