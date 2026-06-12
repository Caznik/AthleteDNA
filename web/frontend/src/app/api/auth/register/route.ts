import { NextResponse } from "next/server";

import { establishSession } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { RegisterCredentials } from "@/lib/types";

export async function POST(request: Request) {
  let credentials: RegisterCredentials;
  try {
    credentials = (await request.json()) as RegisterCredentials;
  } catch {
    return NextResponse.json({ error: "invalid_registration" }, { status: 400 });
  }

  try {
    const user = await establishSession("api/auth/register", credentials);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      // Relay the backend's stable error CODE so the client can localize it.
      const body = error.body as { error?: string } | undefined;
      const passthrough = error.status === 409 || error.status === 400;
      return NextResponse.json(
        { error: passthrough ? (body?.error ?? "invalid_registration") : "generic" },
        { status: passthrough ? error.status : 502 },
      );
    }
    return NextResponse.json({ error: "generic" }, { status: 502 });
  }
}
