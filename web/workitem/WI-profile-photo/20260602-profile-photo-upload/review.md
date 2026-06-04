---
wi: WI-profile-photo/20260602-profile-photo-upload
phase: review
status: confirmed
date: 2026-06-02
verdict: pass
---

## AC Verification
| AC | Description | Satisfied | Evidence / Notes |
|---|---|---|---|
| AC-1 | Upload JPEG/PNG/WebP ≤2 MB; photo replaces initials in profile header | yes | `UpdateProfilePhotoService.updatePhoto` stores bytes/type/timestamp; `AuthController.uploadPhoto` (PUT multipart) returns `photoUpdatedAt`; `profile/page.tsx:45` renders `<AvatarImage src={photoSrc(user)}>` over `<AvatarFallback>`. Verified in code. |
| AC-2 | Photo updates in top nav without reload | yes | `useUploadPhoto.onSuccess` (auth-queries.ts:142-145) `setQueryData` + `invalidateQueries(authUserKey)`; `auth-nav.tsx:56,66` renders `<AvatarImage src={photoSrc(user)}>`. Cache invalidation overrides the 60 s staleTime. |
| AC-3 | Replace existing photo updates display | yes | `updatePhoto` overwrites the three fields + new `Instant.now()`; `photoSrc` `?v=` token changes → fresh fetch. Button label flips to "Replace" when `hasPhoto` (profile-photo-form.tsx:124). |
| AC-4 | Remove reverts to initials in both places | yes | `removePhoto` nulls all three fields; `AuthController.removePhoto` returns null `photoUpdatedAt`; `photoSrc` returns null → `<AvatarFallback>` initials shown. Remove button gated on `hasPhoto`. |
| AC-5 | No-photo user sees initials in both locations | yes | `photoSrc` returns null when `photoUpdatedAt == null`, so no `<AvatarImage>` is rendered (profile/page.tsx:45, auth-nav.tsx:66) — existing behaviour preserved. |
| AC-6 | Unsupported type rejected with clear error, no change | yes | `updatePhoto` allowlist `{image/jpeg,png,webp}` → `InvalidPhotoException("Unsupported image type...")`; `AuthExceptionHandler` → 400 `{error,message}`; BFF relays message; client pre-check mirrors it. Store untouched (validation precedes save). |
| AC-7 | >2 MB rejected with clear error, no change | yes | `updatePhoto` `MAX_PHOTO_BYTES` check → `InvalidPhotoException("...Maximum size is 2 MB")`; multipart limit set to 3 MB so the app returns the clean 400; `MaxUploadSizeExceededException` handler as fallback. Client pre-check mirrors. |
| AC-8 | Photo persists across sessions/reload | yes | `UserPersistenceMapper` maps photo/contentType/updatedAt both directions through unchanged `findById`/`save`; `UserEntity` columns persisted to Postgres. `me` + `AuthResponse` both carry `photoUpdatedAt` so it survives login/reload. |
| AC-9 | Bytea column(s) + migration script | yes | `UserEntity` `@Column(columnDefinition="bytea")` (no `@Lob`) + `photo_content_type` + `photo_updated_at`; migration `db/migrations/2026-06-02_user_profile_photo.sql` follows the avg_hr header/run-command convention. Implementer confirmed generated DDL is `photo bytea`. |
| AC-10 | Auth enforced; unauthenticated → 401, no read/write | yes | All three endpoints call `currentUserProvider.current()` (→ `UnauthenticatedException` → 401); BFF route returns 401 when no session cookie before any backend call. Controller tests assert 401 on all three. |
| AC-11 | Hexagonal + BFF respected; tests pass incl. new | yes | Domain→port→use-case→controller layering preserved (mirrors UpdateUsername); browser→BFF→backend only. Reported regression: backend 90/90 (20 new), frontend 54/54 (7 new), tsc + lint clean. |

## Plan Coverage
| Step | Implemented | Notes |
|---|---|---|
| Step 1 — schema + migration | yes | UserEntity columns + migration script created (with `IF NOT EXISTS`). |
| Step 2 — domain + mapper | yes | `User` photo fields + `UserPersistenceMapper` both-direction mapping. |
| Step 3 — use case + validation | yes | `UpdateProfilePhotoUseCase`/`Service` + `InvalidPhotoException`. |
| Step 4 — controller + DTOs + config | yes | 3 endpoints; `UserResponse`/`AuthResponse` gain `photoUpdatedAt`; handler(s) registered; multipart limit 3 MB. |
| Step 5 — backend tests | yes | Service + controller tests (11 + 9 new). |
| Step 6 — FE types + session mapping | yes | `AuthUser`/`BackendAuthResponse` + `establishSession` carry `photoUpdatedAt`. |
| Step 7 — BFF route | yes | PUT/DELETE via `authedBackendFetch`; GET hand-rolled binary relay. |
| Step 8 — mutations | yes | `useUploadPhoto`/`useRemovePhoto` with setQueryData + invalidate. |
| Step 9 — UI | yes | `profile-photo-form.tsx` (preview, pre-check, upload/replace/remove) added to profile page. |
| Step 10 — render in header + nav | yes | Conditional `<AvatarImage>` over `<AvatarFallback>` via `photoSrc` in both. |

## Deviations Review
| Step | Deviation | Assessment |
|---|---|---|
| 1 | Migration `ADD COLUMN IF NOT EXISTS` | acceptable — safer re-run after `ddl-auto`; intent preserved, no AC impact |
| 4 | Added `MaxUploadSizeExceededException` → 400 handler | acceptable — explicitly anticipated in plan Risk #2; strengthens AC-7 |
| 7 | `authedBackendFetch` from `@/lib/auth`, `backendBaseUrl`/`BackendError` from `@/lib/backend` | acceptable — factual module-boundary correction, no behavioural change |
| 5 (FE test) | Reject test uses `fireEvent.change` not `user.upload` | acceptable — `user.upload` honors the `accept=` filter and drops the file before onChange; fireEvent correctly exercises the validation branch |

## Gaps
None. All 11 ACs satisfied with code-level evidence; all 10 plan steps implemented; all 4 deviations acceptable (intent preserved, no AC impact).

Note: test pass counts (backend 90/90, frontend 54/54) are as reported by the implementer's
regression run; AC satisfaction was verified independently against the source in this review.

## Verdict
**Result:** pass
**Accepted gaps:** none

## Confirmation
**Confirmed by user:** yes
**Notes:** Pass verdict confirmed 2026-06-02.

## Cancellation
*(Fill only if status: cancelled)*
**Cancelled at phase:** review
**Reason:**
