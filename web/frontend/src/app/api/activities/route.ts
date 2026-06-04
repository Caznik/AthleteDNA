import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { Activity } from "@/lib/types";

export async function GET() {
  try {
    const data = await authedBackendFetch<Activity[]>("activities/getAll");
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
