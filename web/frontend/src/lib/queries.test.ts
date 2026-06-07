import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTrainingInsights } from "./queries";
import type { TrainingInsights } from "./types";

const payload: TrainingInsights = {
  pmc: {
    series: [{ date: "2026-06-01", load: 100, ctl: 50, atl: 40, tsb: 10 }],
    current: { ctl: 50, atl: 40, tsb: 10, formLabel: "neutral" },
  },
  weeklyLoad: [{ weekStart: "2026-06-01", load: 700 }],
  trends: { ctlRampPerWeek: 1.2, tsbDirection: "rising" },
  prs: [],
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTrainingInsights", () => {
  it("fetches /api/insights/training and returns the parsed payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTrainingInsights(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/insights/training",
      undefined,
    );
    expect(result.current.data).toEqual(payload);
  });

  it("surfaces an error (not a thrown render) on a 503", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: "Insights temporarily unavailable" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTrainingInsights(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toContain("503");
  });
});
