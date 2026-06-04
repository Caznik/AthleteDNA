import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { StatusResponse } from "@/lib/types";

export async function GET() {
  try {
    const data = await authedBackendFetch<StatusResponse>("api/strava/status");
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to read Strava status" },
      { status: 502 },
    );
  }
}
