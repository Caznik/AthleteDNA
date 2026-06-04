import type { AuthUser } from "./types";

// The same-origin BFF URL for the current user's photo, or null when the user has
// no photo. The ?v=<photoUpdatedAt> token changes on every upload/remove, forcing
// the browser (and Radix AvatarImage) to fetch the fresh image instead of a cached one.
export function photoSrc(user: Pick<AuthUser, "photoUpdatedAt"> | null | undefined): string | null {
  if (!user || user.photoUpdatedAt == null) return null;
  return `/api/auth/me/photo?v=${user.photoUpdatedAt}`;
}
