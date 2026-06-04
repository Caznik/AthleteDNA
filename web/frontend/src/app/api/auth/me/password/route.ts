import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionToken } from "@/lib/auth";
import { backendFetch, BackendError } from "@/lib/backend";
import type { ChangePasswordPayload } from "@/lib/types";

// Changes the current user's password. The backend verifies the current password
// and enforces the strength rule; a 400 carries the human-readable reason.
export async function PUT(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: ChangePasswordPayload;
  try {
    body = (await request.json()) as ChangePasswordPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await backendFetch<void>("api/auth/me/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 400) {
        const errBody = error.body as { message?: string } | undefined;
        return NextResponse.json(
          { error: errBody?.message ?? "Could not change password" },
          { status: 400 },
        );
      }
      if (error.status === 401) {
        await clearSessionCookie();
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "Could not change password" }, { status: 502 });
  }
}
