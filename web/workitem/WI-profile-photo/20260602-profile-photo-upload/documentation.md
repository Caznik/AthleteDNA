---
wi: WI-profile-photo/20260602-profile-photo-upload
phase: documentation
status: confirmed
date: 2026-06-02
project-docs-found: yes
---

## Project Documentation Updated
| File | Section | Change |
|---|---|---|
| `README.md` | Backend HTTP API | Added `PUT`/`DELETE`/`GET api/auth/me/photo` rows + a `UserResponse`/`photoUpdatedAt` note (epoch-millis, null when no photo; doubles as `?v=` cache-buster; auth required). |
| `README.md` | Database migrations | Noted the `2026-06-02_user_profile_photo.sql` script (nullable columns auto-added by `ddl-auto`, safe to re-run via `IF NOT EXISTS`). |
| `frontend/README.md` | Architecture | Documented the `me/photo` BFF route (JSON `PUT`/`DELETE` vs. hand-rolled binary `GET` relay), `src/lib/photo.ts` (`photoSrc`), and the `useUploadPhoto`/`useRemovePhoto` mutations + cache invalidation. |

## Workitem Documentation

### What was built
Users can now upload a profile photo. The photo is shown wherever the avatar appears — the
Profile page header and the top-right navigation avatar/dropdown — and replaces the previous
initials-only avatar. If no photo is set (or after it is removed), the initials avatar is
shown as before. Users can upload, replace, or remove their photo from a new "Profile photo"
card on the Profile page. Accepted formats are JPEG, PNG, and WebP, up to 2 MB.

### How it works
- **Storage (Postgres `bytea`).** Three nullable columns were added to the `users` table:
  `photo` (raw bytes, mapped with `@Column(columnDefinition = "bytea")` and deliberately
  **no `@Lob`** — `@Lob` on Postgres would create an `oid` large object instead of a true
  `bytea`), `photo_content_type`, and `photo_updated_at`. Added via the entity plus a
  hand-written script `db/migrations/2026-06-02_user_profile_photo.sql` (the project has no
  Flyway/Liquibase; `ddl-auto=update` adds the nullable columns automatically, the script
  documents it).
- **Backend (hexagonal).** A new `UpdateProfilePhotoUseCase` port + `UpdateProfilePhotoService`
  hold the validation (content-type allowlist + 2 MB cap → `InvalidPhotoException`) and set
  `photoUpdatedAt = Instant.now()` on upload, or null all three fields on remove. Three
  endpoints on `AuthController`: `PUT /api/auth/me/photo` (multipart upload), `DELETE` (remove),
  `GET` (streams bytes with the stored content type, 404 when none). All resolve the caller via
  `currentUserProvider.current()` → 401 when unauthenticated. `MaxUploadSizeExceededException`
  is mapped to a clean 400 as a fallback for the container size guard (multipart limit is set
  to 3 MB so the app's own 2 MB rule produces the user-facing message).
- **The `me` endpoint stays lean.** `GET /api/auth/me` (and the login/register `AuthResponse`)
  carry only a small `photoUpdatedAt` field (epoch millis, null when no photo) — never the
  image bytes. The browser fetches the actual image separately from `GET /api/auth/me/photo`.
- **Frontend (BFF + React Query).** A new BFF route `src/app/api/auth/me/photo/route.ts`
  proxies `PUT`/`DELETE` as JSON (`authedBackendFetch`) and hand-rolls the binary `GET` relay
  (the shared `backendFetch` forces JSON and would corrupt bytes). `photoSrc(user)` builds
  `/api/auth/me/photo?v=<photoUpdatedAt>`; the `?v=` token changes whenever the photo does, so
  the browser fetches the fresh image instead of a cached one. `useUploadPhoto`/`useRemovePhoto`
  both `setQueryData` and `invalidateQueries(authUserKey)`, so the nav avatar updates without a
  page reload. The avatar renders `<AvatarImage src={photoSrc(user)}>` over the initials
  `<AvatarFallback>` — Radix shows the fallback while loading, on error, or when there is no
  photo.

### Usage
1. Sign in and open **Profile**.
2. In the **Profile photo** card, choose a JPEG/PNG/WebP image (≤ 2 MB). A live preview shows
   the selected file; oversize or unsupported files are rejected inline before upload.
3. Click **Upload** (or **Replace** if you already have a photo). The avatar updates in the
   header and the top nav immediately.
4. Click **Remove** to delete the photo and revert to the initials avatar.

Backend (direct API): `PUT /api/auth/me/photo` with `multipart/form-data` field `file` and a
valid session; `DELETE` to remove; `GET` to fetch the bytes.

### Known limitations
None blocking (review verdict: **pass**). By design and recorded out-of-scope: no cropping /
resizing / compression; no Gravatar/Strava photo import; GIF and SVG are not accepted; storage
is Postgres `bytea` (no external object storage/CDN); the photo is shown only in the profile
header and top nav. Upload validation trusts the declared content type (no magic-byte sniffing);
a spoofed non-image would render broken and fall back to initials.

## Confirmation
**Confirmed by user:** yes
**Notes:** Confirmed 2026-06-02. User opted to skip the repo phase and proceed to archive.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** documentation
**Reason:**
