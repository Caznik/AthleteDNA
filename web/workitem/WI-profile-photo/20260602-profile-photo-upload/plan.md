---
wi: WI-profile-photo/20260602-profile-photo-upload
phase: plan
status: confirmed
date: 2026-06-02
approach: Approach A — Dedicated binary photo endpoint
---

## Context
**Selected approach:** Approach A — store photo bytes in a Postgres `bytea` column on
`users`; serve via `PUT/DELETE/GET /api/auth/me/photo`; `GET /api/auth/me` carries only a
small `photoUpdatedAt` (epoch millis, null when no photo) used as a `?v=` cache-buster on
`<AvatarImage>`.

**AC coverage:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
(every AC mapped below).

**Architecture notes grounding the plan:**
- Auth has no Spring Security chain. `JwtAuthenticationFilter` (lenient) stashes the user id;
  protected endpoints call `currentUserProvider.current()`, which throws
  `UnauthenticatedException` → 401. New photo endpoints use the same pattern.
- Hexagonal layering: domain `User` ← `UserRepository` port ← `UserJpaAdapter` +
  `UserPersistenceMapper`; application use case + `port/in` interface; web controller in
  `AuthController` (or a sibling) under `@Profile("jpa")`.
- Frontend BFF: route handlers proxy with the JWT. JSON proxies use `backendFetch`/
  `authedBackendFetch`; the **binary GET relay cannot** (those force `Accept: application/json`
  and `JSON.parse`) — it hand-rolls `fetch(backendBaseUrl()/...)` + streams the bytes back.
- React Query `useCurrentUser` has `staleTime: 60_000`; mutations must invalidate
  `authUserKey` so the nav re-reads the new `photoUpdatedAt`.

## Implementation Sequence

### Step 1 — DB schema: photo columns + migration script
**Satisfies:** AC-9, AC-7 (storage substrate)
**Files:**
- `backend/athletedna/src/main/java/.../persistence/entities/UserEntity.java` (modify)
- `backend/athletedna/db/migrations/2026-06-02_user_profile_photo.sql` (create)
**Description:** Add three nullable columns to `UserEntity`: `photo` (`byte[]`, mapped to true
Postgres `bytea` via `@Column(name = "photo", columnDefinition = "bytea")` — **no `@Lob`**, which
on Postgres would create an `oid` large object instead), `photo_content_type` (`String`,
length 64), `photo_updated_at` (`Instant`). Write the hand-written migration script
(`ALTER TABLE users ADD COLUMN photo bytea, ADD COLUMN photo_content_type varchar(64),
ADD COLUMN photo_updated_at timestamptz`) mirroring the `2026-06-02_avg_hr_nullable.sql`
header/run-command convention. `ddl-auto=update` adds the nullable columns automatically; the
script documents the change explicitly per project convention.

### Step 2 — Domain model + persistence mapper carry the photo
**Satisfies:** AC-8, AC-9 (foundation)
**Files:**
- `backend/.../domain/model/User.java` (modify)
- `backend/.../persistence/mappers/UserPersistenceMapper.java` (modify)
**Description:** Add `photo` (`byte[]`), `photoContentType` (`String`), `photoUpdatedAt`
(`Instant`) getters/setters to `User`. Keep existing constructors (photo fields default null).
Map the three fields both directions in `UserPersistenceMapper`. This makes the photo persist
across sessions (AC-8) and travel through the existing `findById`/`save` port methods.

### Step 3 — Application use case + validation
**Satisfies:** AC-1, AC-3, AC-4, AC-6, AC-7
**Files:**
- `backend/.../application/port/in/UpdateProfilePhotoUseCase.java` (create)
- `backend/.../application/usecases/UpdateProfilePhotoService.java` (create)
- `backend/.../application/auth/InvalidPhotoException.java` (create)
**Description:** Port exposes `updatePhoto(UUID userId, byte[] bytes, String contentType)` and
`removePhoto(UUID userId)`, both returning the updated `User`. Service (`@Service @Profile("jpa")`):
validates the content type against the allowlist (`image/jpeg`, `image/png`, `image/webp`) and
size (≤ 2 MB = 2*1024*1024), throwing `InvalidPhotoException` (carries a human message) on
violation — covers AC-6/AC-7. On success sets photo + contentType + `photoUpdatedAt = Instant.now()`
and saves (AC-1 upload, AC-3 replace). `removePhoto` nulls all three and saves (AC-4). Loads the
user via `UserRepository.findById(...).orElseThrow(UnauthenticatedException::new)`.

### Step 4 — Web controller endpoints + response DTOs + multipart config
**Satisfies:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-10
**Files:**
- `backend/.../web/controllers/AuthController.java` (modify)
- `backend/.../web/dtos/UserResponse.java` (modify)
- `backend/.../web/dtos/AuthResponse.java` (modify)
- `backend/.../web/exceptions/AuthExceptionHandler.java` (modify)
- `backend/athletedna/src/main/resources/application-jpa.properties` (modify)
**Description:**
- Add `PUT api/auth/me/photo` consuming `multipart/form-data` (`@RequestParam("file") MultipartFile`):
  resolve `currentUserProvider.current()` (401 when absent → AC-10), call
  `updateProfilePhotoUseCase.updatePhoto(id, file.getBytes(), file.getContentType())`, return the
  updated `UserResponse`.
- Add `DELETE api/auth/me/photo`: `removePhoto(id)`, return `UserResponse` (AC-4).
- Add `GET api/auth/me/photo`: load current user; if no photo → 404; else stream bytes with
  `Content-Type` = stored `photoContentType` and a `Cache-Control` allowing the `?v=` token to do
  invalidation.
- Extend `UserResponse` to `(id, email, username, Long photoUpdatedAt)` (epoch millis, null when no
  photo) and update the three places that build it (`me`, `updateUsername`, and the new endpoints).
  Frontend uses this to decide whether/what to render (AC-2, AC-5).
- Extend `AuthResponse` + `toAuthResponse` with `photoUpdatedAt` so the photo shows immediately
  after login without waiting for a `me` refetch.
- Register `InvalidPhotoException` in `AuthExceptionHandler` → 400 with `{error, message}` (AC-6/AC-7).
- Set `spring.servlet.multipart.max-file-size=3MB` / `max-request-size=3MB` (above our 2 MB rule so
  the app returns its own clean 400 rather than the container rejecting first).

### Step 5 — Backend tests
**Satisfies:** AC-11 (and verifies AC-1/3/4/6/7/10)
**Files:**
- `backend/.../application/usecases/UpdateProfilePhotoServiceTest.java` (create)
- `backend/.../web/controllers/AuthControllerTest.java` (create or extend if present)
**Description:** Unit-test the service: valid upload sets bytes+type+timestamp; replace overwrites;
remove clears; unsupported type and oversize throw `InvalidPhotoException`; unknown user →
`UnauthenticatedException`. Controller/slice test: PUT multipart happy path returns `photoUpdatedAt`;
GET streams bytes with the stored content type and 404s when none; unauthenticated PUT/DELETE/GET →
401. Confirm the existing suite still passes (AC-11).

### Step 6 — Frontend types + auth session mapping
**Satisfies:** AC-2, AC-8
**Files:**
- `frontend/src/lib/types.ts` (modify)
- `frontend/src/lib/auth.ts` (modify)
**Description:** Add `photoUpdatedAt: number | null` to `AuthUser` and `BackendAuthResponse`; map it
in `establishSession` so login/register seed the avatar immediately. Keeps the client contract in
sync with the backend DTOs.

### Step 7 — BFF photo route (multipart proxy + binary relay)
**Satisfies:** AC-1, AC-3, AC-4, AC-10
**Files:**
- `frontend/src/app/api/auth/me/photo/route.ts` (create)
**Description:**
- `PUT`: read the incoming `FormData`, forward it to `api/auth/me/photo` with the Bearer token via
  `authedBackendFetch` (multipart body, no JSON `Content-Type`), relay the `UserResponse` and the
  400 (invalid)/401 errors like the existing `me` route.
- `DELETE`: proxy to the backend, relay `UserResponse`/errors.
- `GET`: hand-rolled `fetch(`${backendBaseUrl()}/api/auth/me/photo`, { Authorization })` (cannot use
  `backendFetch` — it forces JSON); on 200 return a `NextResponse` with the `arrayBuffer` and the
  upstream `Content-Type`; pass through 404/401. The browser hits this same-origin route directly
  from `<img>`, so the session cookie authenticates it (AC-10).

### Step 8 — React Query mutations
**Satisfies:** AC-1, AC-2, AC-3, AC-4
**Files:**
- `frontend/src/lib/auth-queries.ts` (modify)
**Description:** Add `useUploadPhoto` (sends a `FormData` with the file to `PUT /api/auth/me/photo`)
and `useRemovePhoto` (`DELETE`). Both `onSuccess` write the returned `AuthUser` into `authUserKey`
**and** `invalidateQueries({ queryKey: authUserKey })` so the nav re-reads the new `photoUpdatedAt`
without a reload (AC-2). Toast success/error mirroring the username/password mutations.

### Step 9 — Profile photo UI
**Satisfies:** AC-1, AC-4, AC-6, AC-7
**Files:**
- `frontend/src/components/profile-photo-form.tsx` (create)
- `frontend/src/app/profile/page.tsx` (modify)
**Description:** New card with a file input (accept `image/jpeg,image/png,image/webp`), a live preview,
an Upload/Replace button, and a Remove button (shown only when a photo exists). Client-side pre-check
of type + 2 MB size with an inline error before sending (fast feedback for AC-6/AC-7; the backend
remains the source of truth). Wire to the Step 8 mutations. Add the card to the profile page.

### Step 10 — Render the photo in profile header + nav (with initials fallback)
**Satisfies:** AC-1, AC-2, AC-4, AC-5
**Files:**
- `frontend/src/app/profile/page.tsx` (modify)
- `frontend/src/components/auth-nav.tsx` (modify)
- `frontend/src/lib/` small helper (e.g. `photoSrc(user)` — create or inline)
**Description:** When `user.photoUpdatedAt` is non-null, render `<AvatarImage src={`/api/auth/me/photo?v=${photoUpdatedAt}`} />`
inside the existing `<Avatar>`, keeping `<AvatarFallback>{initials}</AvatarFallback>` underneath.
Radix shows the fallback automatically while loading or on error, so no-photo users keep the initials
avatar (AC-5) and the `?v=` token forces a fresh fetch on replace/remove (AC-1/AC-2/AC-4).

## Risks / Known Unknowns
- **`byte[]` → Postgres type:** must produce a real `bytea`, not an `oid` large object. Plan uses
  `@Column(columnDefinition = "bytea")` **without `@Lob`**; verify the generated/declared column
  matches the migration script during implementation.
- **Multipart size vs. app rule:** the container limit is set above 2 MB so our use case returns the
  clean 400; confirm an oversize upload surfaces our message, not a raw Spring `MaxUploadSizeExceeded`
  (may need a handler for `MaxUploadSizeExceededException` as a fallback).
- **Binary relay through the BFF:** streaming `arrayBuffer` works but is buffered, not piped; fine for
  ≤ 2 MB avatars.
- **Content-type trust:** validation uses the declared multipart content type (no magic-byte sniffing),
  acceptable for this scope; a spoofed type that isn't a real image would still render as a broken
  image and fall back to initials.
- **Frontend tests:** no existing component-test harness was confirmed; AC-11's test focus is the
  backend use case. A light mutation/component test will be added only if the frontend test setup
  supports it without new infra.

## Confirmation
**Confirmed by user:** yes
**Notes:** Signed off 2026-06-02; proceed to implementation.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** plan
**Reason:**
