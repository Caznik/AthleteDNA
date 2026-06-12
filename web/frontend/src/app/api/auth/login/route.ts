import { NextResponse } from "next/server";

import { establishSession } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { Credentials } from "@/lib/types";

export async function POST(request: Request) {
  let credentials: Credentials;
  try {
    credentials = (await request.json()) as Credentials;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }

  try {
    const user = await establishSession("api/auth/login", credentials);
    return NextResponse.json(user);
  } catch (error) {
    // Relay a stable code the client localizes; 401 = bad email/password.
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "generic" }, { status: 502 });
  }
}
