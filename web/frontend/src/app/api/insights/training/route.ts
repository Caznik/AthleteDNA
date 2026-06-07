import { NextResponse } from "next/server";

import { authedBackendFetch } from "@/lib/auth";
import { BackendError } from "@/lib/backend";
import type { TrainingInsights } from "@/lib/types";

export async function GET() {
  try {
    const data = await authedBackendFetch<TrainingInsights>(
      "api/insights/training",
    );
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof BackendError) {
      // 401 (not authenticated) and 503 (engine unavailable) are meaningful to
      // the client; pass them through. Everything else is an upstream failure.
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 },
        );
      }
      if (error.status === 503) {
        return NextResponse.json(
          { error: "Insights temporarily unavailable" },
          { status: 503 },
        );
      }
    }
    return NextResponse.json(
      { error: "Failed to load training insights" },
      { status: 502 },
    );
  }
}
