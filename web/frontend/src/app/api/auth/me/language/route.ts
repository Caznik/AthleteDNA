import { NextResponse } from "next/server";

import { clearSessionCookie, getSessionToken } from "@/lib/auth";
import { backendFetch, BackendError } from "@/lib/backend";
import type { AuthUser } from "@/lib/types";

// Relays the backend's stable `error` CODE (e.g. "invalid_language") rather than
// its English `message`, so the client can localize it via i18n (Approach B1).
// Falls back to a generic code the client maps to a translated message.
function backendCode(error: BackendError, fallback: string): string {
  const body = error.body as { error?: string } | undefined;
  return body?.error ?? fallback;
}

// Updates the current user's language preference. Proxies to the backend with the
// session JWT and relays the 400 (invalid value) CODE so the client can localize.
export async function PUT(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { language?: string };
  try {
    body = (await request.json()) as { language?: string };
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const user = await backendFetch<AuthUser>("api/auth/me/language", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ language: body.language }),
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof BackendError) {
      // 400 (invalid language) passes through with its stable code so the client
      // can resolve the localized message.
      if (error.status === 400) {
        return NextResponse.json(
          { error: backendCode(error, "invalid_language") },
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
