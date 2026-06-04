---
wi: WI-profile-photo/20260602-profile-photo-upload
phase: propose
status: confirmed
date: 2026-06-02
triggered: yes
---

The functional shape is fixed by analyze (upload / replace / remove; show photo else
initials; Postgres `bytea`; JPEG/PNG/WebP ≤ 2 MB; hexagonal + BFF). The open design
decision is **how the stored image reaches the browser**, which also dictates the upload
transport. Two viable directions:

## Approach A — Dedicated binary photo endpoint
**Summary:**
- Backend: new `bytea` + content-type columns on `users`. Endpoints:
  - `PUT /api/auth/me/photo` — `multipart/form-data` upload (validates type + 2 MB size).
  - `DELETE /api/auth/me/photo` — clears the photo.
  - `GET /api/auth/me/photo` — streams the bytes with the stored `Content-Type` (404 when none).
  - `UserResponse` / `AuthUser` gains a `photoUpdatedAt` (epoch millis, null when no photo).
- Frontend: `<AvatarImage src="/api/auth/me/photo?v={photoUpdatedAt}">`; the `?v=` token
  busts the browser cache on change/remove. BFF adds a binary-relay route for the GET
  (cannot reuse `backendFetch`, which forces JSON) plus multipart proxy routes for PUT/DELETE.

**Pros:**
- `GET /api/auth/me` payload stays tiny — no base64 blob on every page load / auth check.
- Browser caches the image normally; `?v=` gives precise invalidation on replace/remove.
- Clean REST separation of identity JSON vs. binary resource; standard multipart upload.

**Cons:**
- More moving parts: 3 backend endpoints + a binary-relay BFF route that bypasses the
  existing `backendFetch` helper (manual stream/Content-Type handling).
- Two round trips to render a logged-in view with a photo (me JSON, then image).

**Effort:** medium

## Approach B — Inline base64 data URI in the user response
**Summary:**
- Backend: same `bytea` + content-type columns. Upload/remove ride the existing
  `PATCH /api/auth/me` JSON contract (or a sibling), carrying the image as a base64 data
  URI string. `UserResponse` / `AuthUser` gains a `photo` field = data URI (null when none).
- Frontend: `<AvatarImage src={user.photo}>` straight from the React Query `AuthUser`;
  remove = send null. No separate image fetch, no cache-busting token, no binary BFF route —
  reuses the existing `sendJson` / `backendFetch` JSON plumbing throughout.

**Pros:**
- Fewest new endpoints and routes; reuses existing JSON proxy helpers end to end.
- Cache invalidation is automatic — the photo lives in the `AuthUser` object React Query
  already manages, so replace/remove just update the cache.
- Single round trip: the `me` response already carries the renderable image.

**Cons:**
- Every `GET /api/auth/me` (runs on each page load / 60 s stale time) ships up to ~2.7 MB of
  base64 — heavier auth checks and no browser image caching.
- Base64 inflates payload ~33 %; JSON-encoding/decoding a 2 MB blob on each call.
- Mixing a large binary blob into the identity JSON is a less clean contract.

**Effort:** low–medium

## Selected Approach
**Choice:** Approach A — Dedicated binary photo endpoint
**Rationale:** Keep the frequently-called `GET /api/auth/me` endpoint lean — no base64 blob
on every page load / auth check — and let the browser cache the image, with a
`photoUpdatedAt` `?v=` token for precise invalidation on replace/remove. Worth the extra
plumbing (binary-relay BFF route + multipart endpoints).

## Confirmation
**Confirmed by user:** yes
**Notes:** User explicitly chose A to keep the me endpoint lean.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** propose
**Reason:**
