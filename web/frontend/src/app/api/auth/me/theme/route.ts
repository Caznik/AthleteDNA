import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionToken } from "@/lib/auth";
import { backendFetch, BackendError } from "@/lib/backend";
import type { AuthUser } from "@/lib/types";

// Relays the backend's human-readable message (carried in its `message` field)
// as the `error` field the client mutations read. Mirrors the username route.
function backendMessage(error: BackendError, fallback: string): string {
  const body = error.body as { message?: string } | undefined;
  return body?.message ?? fallback;
}

// Updates the current user's theme preference. Proxies to the backend with the
// session JWT and relays the 400 (invalid value) so the client can surface it.
export async function PUT(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { theme?: string };
  try {
    body = (await request.json()) as { theme?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const user = await backendFetch<AuthUser>("api/auth/me/theme", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ theme: body.theme }),
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof BackendError) {
      // 400 (invalid theme) passes through with its message.
      if (error.status === 400) {
        return NextResponse.json(
          { error: backendMessage(error, "Could not update theme") },
          { status: error.status },
        );
      }
      if (error.status === 401) {
        await clearSessionCookie();
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "Could not update theme" }, { status: 502 });
  }
}
