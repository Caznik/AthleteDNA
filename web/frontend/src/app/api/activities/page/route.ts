import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { ActivityPage } from "@/lib/types";

// Paged slice of activities for the Activities table. Forwards page/size/type to
// the backend's `GET activities` endpoint; the backend clamps the values.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["page", "size", "type"] as const) {
    const value = params.get(key);
    if (value !== null && value !== "") query.set(key, value);
  }

  try {
    const data = await authedBackendFetch<ActivityPage>(
      `activities?${query.toString()}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load activities" },
      { status: 502 },
    );
  }
}
