import { NextResponse } from "next/server";

import { authedBackendFetch, clearSessionCookie, getSessionToken } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { FitImportResponse } from "@/lib/types";

// Forwards a multipart .fit upload to the backend's POST api/fit/import. Mirrors the
// profile-photo BFF route: guards the session (401), relays the incoming multipart body
// untouched (no explicit Content-Type so fetch keeps the boundary), and returns the
// per-file import summary. Per-file failures are encoded in the 200 body by the backend,
// so only auth/transport problems surface as error statuses here.
export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  try {
    const summary = await authedBackendFetch<FitImportResponse>("api/fit/import", {
      method: "POST",
      body: formData,
    });
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      await clearSessionCookie();
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "generic" }, { status: 502 });
  }
}
