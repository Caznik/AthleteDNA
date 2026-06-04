import { NextResponse } from "next/server";

import { establishSession } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { RegisterCredentials } from "@/lib/types";

export async function POST(request: Request) {
  let credentials: RegisterCredentials;
  try {
    credentials = (await request.json()) as RegisterCredentials;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const user = await establishSession("api/auth/register", credentials);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      const body = error.body as { message?: string } | undefined;
      return NextResponse.json(
        { error: body?.message ?? "Registration failed" },
        // 400/409 from the backend pass through; anything else is a gateway error.
        { status: error.status === 409 || error.status === 400 ? error.status : 502 },
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 502 });
  }
}
