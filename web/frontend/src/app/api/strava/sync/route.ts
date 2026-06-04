import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { SyncResponse } from "@/lib/types";

export async function POST() {
  try {
    const data = await authedBackendFetch<SyncResponse>("api/strava/sync", {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Sync failed" }, { status: 502 });
  }
}
