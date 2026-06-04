import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";

// Distinct activity types present in the backend, for the table's filter buttons.
export async function GET() {
  try {
    const data = await authedBackendFetch<string[]>("activities/types");
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendError && error.status === 401) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load activity types" },
      { status: 502 },
    );
  }
}
