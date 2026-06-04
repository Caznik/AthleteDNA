import { NextResponse } from "next/server";

import { establishSession } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { Credentials } from "@/lib/types";

export async function POST(request: Request) {
  let credentials: Credentials;
  try {
    credentials = (await request.json()) as Credentials;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const user = await establishSession("api/auth/login", credentials);
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }
    return NextResponse.json({ error: "Login failed" }, { status: 502 });
  }
}
