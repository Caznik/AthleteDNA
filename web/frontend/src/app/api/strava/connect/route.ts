import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { ConnectResponse } from "@/lib/types";

export async function GET() {
  try {
    const data = await authedBackendFetch<ConnectResponse>("api/strava/connect");
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to obtain authorization URL" },
      { status: 502 },
    );
  }
}
