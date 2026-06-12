import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionToken } from "@/lib/auth";
import { backendFetch, BackendError } from "@/lib/backend";
import type { AuthUser } from "@/lib/types";

// Relays the backend's stable error CODE (carried in its `error` field) as the
// `error` field the client mutations read, so the client can localize it.
function backendCode(error: BackendError, fallback: string): string {
  const body = error.body as { error?: string } | undefined;
  return body?.error ?? fallback;
}

// Returns the current user, or 401 when there is no valid session. The browser
// uses this to decide whether to show the logged-in state.
export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const user = await backendFetch<AuthUser>("api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(user);
  } catch (error) {
    // Token rejected by the backend (expired/invalid) → drop the stale cookie.
    if (error instanceof BackendError && error.status === 401) {
      await clearSessionCookie();
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Auth check failed" }, { status: 502 });
  }
}

// Updates the current user's username. Proxies to the backend with the session
// JWT and relays validation/conflict errors so the client can surface them.
export async function PATCH(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = (await request.json()) as { username?: string };
  } catch {
    return NextResponse.json({ error: "invalid_username" }, { status: 400 });
  }

  try {
    const user = await backendFetch<AuthUser>("api/auth/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: body.username }),
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof BackendError) {
      // 400 (invalid username) and 409 (taken) pass through with their code.
      if (error.status === 400 || error.status === 409) {
        return NextResponse.json(
          { error: backendCode(error, "invalid_username") },
          { status: error.status },
        );
      }
      if (error.status === 401) {
        await clearSessionCookie();
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "generic" }, { status: 502 });
  }
}
