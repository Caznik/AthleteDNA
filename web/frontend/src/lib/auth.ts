import "server-only";

import { cookies } from "next/headers";

import { backendFetch } from "./backend";
import { SESSION_COOKIE } from "./session-constants";
import type {
  AuthUser,
  BackendAuthResponse,
  Credentials,
  RegisterCredentials,
} from "./types";

// Server-only session helpers shared by the /api/auth/* route handlers.
// The JWT lives in an httpOnly cookie so it is never exposed to client JS.

export { SESSION_COOKIE };

// Calls the backend register/login endpoint, stores the returned JWT in the
// session cookie, and returns the public identity. Throws BackendError on a
// non-2xx backend response (caller maps it to a client-facing status).
export async function establishSession(
  path: "api/auth/register" | "api/auth/login",
  credentials: Credentials | RegisterCredentials,
): Promise<AuthUser> {
  const auth = await backendFetch<BackendAuthResponse>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  await setSessionCookie(auth.token, auth.expiresInSeconds);
  return {
    id: auth.id,
    email: auth.email,
    username: auth.username,
    photoUpdatedAt: auth.photoUpdatedAt,
    themePreference: auth.themePreference,
  };
}

export async function setSessionCookie(token: string, maxAgeSeconds: number) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

// backendFetch variant that attaches the caller's JWT as a Bearer credential, so
// the backend resolves the request to the logged-in user. Use it from any route
// handler proxying a per-user backend endpoint.
export async function authedBackendFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getSessionToken();
  return backendFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
