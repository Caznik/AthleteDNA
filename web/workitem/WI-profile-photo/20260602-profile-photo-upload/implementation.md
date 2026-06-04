---
wi: WI-profile-photo/20260602-profile-photo-upload
phase: implementation
status: completed
date: 2026-06-02
---

## Architecture Notes
- **Auth seam:** there is no Spring Security chain. Protected endpoints call
  `currentUserProvider.current()` (`JwtCurrentUserProvider`), which throws
  `UnauthenticatedException` → 401 via `AuthExceptionHandler`. The three new photo
  endpoints follow this exact pattern, so AC-10 (401 when unauthenticated) is satisfied
  by the same seam already covering `/me` and `/me/password`. Confirmed by reading
  `JwtCurrentUserProvider.java` and `AuthExceptionHandler.java`.
- **Hexagonal layering honored:** domain `User` carries the new photo fields;
  `UserRepository.findById/save` (unchanged port) persists them through `UserJpaAdapter`
  + `UserPersistenceMapper`; new `UpdateProfilePhotoUseCase` port + `UpdateProfilePhotoService`
  (`@Service @Profile("jpa")`) hold validation; `AuthController` is the only web touchpoint.
  Mirrors `UpdateUsernameUseCase`/`UpdateUsernameService` precisely (same orElseThrow,
  same @Profile guard).
- **bytea, not oid:** `@Column(columnDefinition = "bytea")` with NO `@Lob`. Verified the
  H2 test-schema DDL Hibernate generated: `create table users (... photo bytea, ...)` — a
  true binary column, not an oid large object (Risk #1 resolved).
- **Controllers are unit-tested directly with mocked use cases** (see `StravaControllerTest`),
  not via MockMvc slice tests. `AuthControllerTest` follows that convention and uses
  Spring's `MockMultipartFile` for the upload path.
- **BFF binary relay:** `backendFetch` forces `Accept: application/json` + `JSON.parse`, so it
  cannot relay image bytes. The GET handler hand-rolls `fetch(backendBaseUrl()/api/auth/me/photo)`
  and returns a `NextResponse` wrapping the `arrayBuffer` with the upstream `Content-Type`.
  PUT/DELETE use the existing `authedBackendFetch` (PUT forwards `FormData` with no JSON header).
- **Cache-busting via ?v=:** `useCurrentUser` has `staleTime: 60_000`; mutations both
  `setQueryData` and `invalidateQueries(authUserKey)` so the nav re-reads `photoUpdatedAt`.
  `photoSrc(user)` builds `/api/auth/me/photo?v=<photoUpdatedAt>`; Radix `<AvatarImage>` over
  `<AvatarFallback>` shows initials while loading / on error / when no photo (AC-5).

## Plan Deviations
| Step | Original plan | What actually happened | Reason |
|---|---|---|---|
| 1 | `ALTER TABLE users ADD COLUMN photo bytea, ...` | Added `IF NOT EXISTS` to each `ADD COLUMN` | Safe re-run after `ddl-auto=update` has already added the columns; 1-clause-per-column change, no scope impact |
| 4 | Plan implied only adding `InvalidPhotoException` handler | Also added a `MaxUploadSizeExceededException` handler returning the same 400 | Plan Risk #2 called for this fallback explicitly; minor (one handler method) |
| 7 | `authedBackendFetch` for PUT/DELETE | Imported `authedBackendFetch` from `@/lib/auth` (it lives there, not `backend.ts`) and `backendBaseUrl`/`BackendError` from `@/lib/backend` | Matched actual module boundaries; no behavioral change |
| 5 (FE test) | `user.upload` to test reject paths | Unsupported-type test uses `fireEvent.change` | testing-library `user.upload` honors the input `accept=` filter and drops the gif before onChange; fireEvent bypasses it to exercise the validation branch |

## Blockers
| # | Description | Resolution | Status |
|---|---|---|---|
| - | None | - | - |

## AC Pre-Check
| AC | Test / Evidence | Status |
|---|---|---|
| AC-1 | `UpdateProfilePhotoServiceTest::updatePhoto_storesBytesTypeAndTimestamp`; `AuthControllerTest::uploadPhoto_returnsPhotoUpdatedAt`; `profile-photo-form.test.tsx::uploads a valid selected file`; profile header renders `<AvatarImage src={photoSrc(user)}>` (profile/page.tsx) | COVERED |
| AC-2 | `auth-queries.ts useUploadPhoto.onSuccess` setQueryData + invalidateQueries(authUserKey); nav `<AvatarImage>` driven by `photoSrc(user)` (auth-nav.tsx); `profile-photo-form.test.tsx` verifies mutate fires | COVERED |
| AC-3 | `UpdateProfilePhotoServiceTest::updatePhoto_replaceOverwritesExistingPhoto`; `profile-photo-form.test.tsx::shows Replace and Remove when a photo exists` | COVERED |
| AC-4 | `UpdateProfilePhotoServiceTest::removePhoto_clearsAllThreeFields`; `AuthControllerTest::removePhoto_returnsNullPhotoUpdatedAt`; `profile-photo-form.test.tsx::removes the photo when Remove is clicked`; null photoUpdatedAt → photoSrc returns null → fallback initials | COVERED |
| AC-5 | `AuthControllerTest::me_photoUpdatedAtNullWhenNoPhoto`; `profile-photo-form.test.tsx::hides Remove when the user has no photo`; `photo.ts photoSrc` returns null when photoUpdatedAt==null so `<AvatarFallback>` initials show (auth-nav.tsx, profile/page.tsx) | COVERED |
| AC-6 | `UpdateProfilePhotoServiceTest::updatePhoto_rejectsUnsupportedType` + `_rejectsNullType`; `profile-photo-form.test.tsx::rejects an unsupported type`; `AuthExceptionHandler.handleInvalidPhoto` → 400 `{error,message}` | COVERED |
| AC-7 | `UpdateProfilePhotoServiceTest::updatePhoto_rejectsOversize` + `_acceptsExactlyAtLimit`; `profile-photo-form.test.tsx::rejects an oversize file`; `handleMaxUploadSize` fallback 400 | COVERED |
| AC-8 | `UserPersistenceMapper` maps photo/contentType/updatedAt both directions (toDomain/toEntity); persists via unchanged `findById`/`save`. H2 schema shows `photo bytea` column created. Verified by mapper edit + ActivityEntityPersistenceTest-style DDL log | COVERED |
| AC-9 | `db/migrations/2026-06-02_user_profile_photo.sql` (created, mirrors avg_hr header/run-command convention); `UserEntity` columns `photo bytea` / `photo_content_type varchar(64)` / `photo_updated_at timestamptz`; H2 DDL confirms `users (... photo bytea ...)` | COVERED |
| AC-10 | `AuthControllerTest::uploadPhoto_unauthenticatedThrows`, `removePhoto_unauthenticatedThrows`, `getPhoto_unauthenticatedThrows` (UnauthenticatedException → 401 via handler); BFF route returns 401 when no session token | COVERED |
| AC-11 | Full backend suite green (90/90, incl. 11 service + 9 controller new tests); full frontend suite green (54/54, incl. 7 new); BFF route `/api/auth/me/photo` proxies with JWT, browser never hits backend directly; hexagonal layering preserved (see Architecture Notes) | COVERED |

## QA Log
| Iteration | AC checked | Result | Action taken |
|---|---|---|---|
| 1 | AC-1,3,4,6,7,8,9,10 (backend) | PASS — 90/90 backend tests | Wrote service + controller tests, ran `mvnw test`; all green first run |
| 2 | AC-1..7 (frontend component) | 1 FAIL: unsupported-type test (user.upload dropped gif via accept= filter) | Switched that test to `fireEvent.change` to bypass the accept filter |
| 3 | AC-1,2,3,4,5,6,7 (frontend) + AC-11 regression | PASS — 54/54 frontend tests, tsc clean, eslint clean | Re-ran full frontend suite; all green |
| 4 | AC-11 (regression both suites) | PASS — backend 90/90, frontend 54/54 | Final full-suite runs |

## Regression
**Test suite run:** yes (both)
**Result:** pass
**Failures:** none. Backend `mvnw test`: `Tests run: 90, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS` (20 new). Frontend `vitest run`: `Test Files 10 passed, Tests 54 passed` (7 new). `tsc --noEmit` exit 0. `next lint`: no warnings or errors. No pre-existing failures observed.
