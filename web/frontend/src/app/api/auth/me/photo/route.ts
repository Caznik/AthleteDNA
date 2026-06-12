import { NextResponse } from "next/server";

import { authedBackendFetch, clearSessionCookie, getSessionToken } from "@/lib/auth";
import { backendBaseUrl, BackendError } from "@/lib/backend";
import type { AuthUser } from "@/lib/types";

// Relays the backend's stable error CODE (carried in its `error` field) so the
// client can localize it.
function backendCode(error: BackendError, fallback: string): string {
  const body = error.body as { error?: string } | undefined;
  return body?.error ?? fallback;
}

// Uploads (or replaces) the current user's profile photo. Forwards the incoming
// multipart body to the backend with the session JWT; relays the updated user and
// the 400 (invalid type/size) / 401 errors.
export async function PUT(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  try {
    // No explicit Content-Type: fetch sets the multipart boundary from the body.
    const user = await authedBackendFetch<AuthUser>("api/auth/me/photo", {
      method: "PUT",
      body: formData,
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 400) {
        return NextResponse.json(
          { error: backendCode(error, "invalid_photo") },
          { status: 400 },
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

// Removes the current user's photo, reverting to the initials avatar.
export async function DELETE() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const user = await authedBackendFetch<AuthUser>("api/auth/me/photo", {
      method: "DELETE",
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      await clearSessionCookie();
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "generic" }, { status: 502 });
  }
}

// Streams the current user's photo bytes back to the browser <img>. Hand-rolled
// (not backendFetch) because that wrapper forces Accept: application/json and
// JSON.parse, which would corrupt binary. The browser hits this same-origin route
// directly, so the session cookie authenticates it.
export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const upstream = await fetch(`${backendBaseUrl()}/api/auth/me/photo`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (upstream.status === 401) {
    await clearSessionCookie();
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (upstream.status === 404) {
    return NextResponse.json({ error: "No photo" }, { status: 404 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not load photo" }, { status: 502 });
  }

  const bytes = await upstream.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
