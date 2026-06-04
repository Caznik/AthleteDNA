---
wi: WI-profile-photo/20260602-profile-photo-upload
phase: analyze
status: confirmed
date: 2026-06-02
---

## Requirements

### Context
Today the app has no avatar *image*. The "avatar" is the user's initials rendered in
`AvatarFallback` (see `auth-nav.tsx` and `profile/page.tsx`). This feature adds a real
uploaded profile photo that is shown when present, with the initials avatar as the fallback.

### Functional
1. A signed-in user can upload a profile photo from the Profile page.
2. A user can replace an existing photo with a new one.
3. A user can remove their photo, reverting to the initials avatar.
4. The photo is displayed in place of the initials avatar wherever the avatar appears:
   the Profile page header card and the top-right nav avatar/dropdown.
5. When no photo is set, the initials avatar is shown (current behaviour preserved).
6. The photo persists across sessions/logins (stored server-side, tied to the user).

### Storage & format
7. Photo bytes are stored in Postgres in a new nullable column on the `users` table
   (`bytea`), alongside its content type.
8. Accepted upload formats: JPEG, PNG, WebP. Other types are rejected with a clear error.
9. Maximum upload size: 2 MB. Larger uploads are rejected with a clear error.

### Persistence mechanics
10. The schema change is applied via a hand-written SQL migration script in
    `backend/athletedna/db/migrations/` (project convention — `ddl-auto=update` adds the
    nullable column automatically, but the migration script documents the change explicitly),
    consistent with the existing `2026-06-02_avg_hr_nullable.sql` pattern.

### Architecture / conventions
11. Backend changes follow the existing hexagonal layering (domain model → application
    use case/port → infrastructure web controller + JPA adapter).
12. Frontend changes go through the BFF pattern: a Next.js API route proxies to the backend
    carrying the session JWT; the browser never calls the backend directly.

## Out of Scope
- Client-side or server-side image cropping, resizing, or compression.
- Gravatar / Strava / OAuth-provider photo import.
- Animated images (GIF) and SVG.
- CDN / external object storage (explicitly chose Postgres bytea).
- Showing the photo anywhere beyond the profile header and the top nav (e.g. activity lists).

## Open Questions
_None blocking. The mechanism for serving the stored bytes to the browser (a dedicated
photo endpoint returning the image vs. an inline data URI in the `me` response) plus cache
invalidation on change/remove will be decided in the propose phase._

## Acceptance Criteria
- [ ] **AC-1** — A signed-in user can upload a JPEG/PNG/WebP image (≤ 2 MB) from the Profile page, and on success their photo replaces the initials avatar in the profile header.
- [ ] **AC-2** — After uploading, the photo also replaces the initials avatar in the top-right nav avatar/dropdown (no full page reload required; React Query cache reflects the change).
- [ ] **AC-3** — A user with an existing photo can upload a different image and the displayed photo updates to the new one (replace flow).
- [ ] **AC-4** — A user can remove their photo via a remove action; afterwards the initials avatar is shown again in both the profile header and the nav.
- [ ] **AC-5** — A user with no photo set sees the initials avatar in both locations (existing behaviour unchanged).
- [ ] **AC-6** — Uploading an unsupported type (e.g. GIF, PDF, text) is rejected with a clear, user-visible error and no change to the stored photo.
- [ ] **AC-7** — Uploading a file larger than 2 MB is rejected with a clear, user-visible error and no change to the stored photo.
- [ ] **AC-8** — The uploaded photo persists: after logging out and back in (or reloading), the photo is still shown.
- [ ] **AC-9** — Photo bytes and content type are stored in a new nullable column on the `users` table; a hand-written SQL migration script documenting the column exists under `db/migrations/`.
- [ ] **AC-10** — All photo upload/remove requests are authenticated; an unauthenticated request returns 401 and no photo is read or written.
- [ ] **AC-11** — Backend changes respect the hexagonal layering and the frontend goes through a BFF API route (no direct browser→backend call); existing backend and frontend tests still pass, with new tests covering the upload/remove use case and validation rules.

## Interview Notes
- **No pre-existing avatar image.** Confirmed via code: avatar = initials fallback only.
  The feature introduces the first real image; "avatar" in the request = the initials fallback.
- **Storage** (agent-offered options): user chose **Postgres `bytea` column** over filesystem
  or external object storage — simplest for the local single-DB setup, no new infra.
- **Constraints**: user accepted the suggested default — **JPEG/PNG/WebP, max 2 MB**.
- **Remove action**: user chose **yes**, completing the upload → fallback story (AC-4).
- **Display locations**: user chose **profile page + top nav** (both places the avatar renders).

## Sign-off
**Confirmed by user:** yes
**Date:** 2026-06-02
