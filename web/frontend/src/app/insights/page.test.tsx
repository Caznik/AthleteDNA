import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import InsightsPage from "./page";
import type { TrainingInsights } from "@/lib/types";

const useTrainingInsights = vi.fn();

vi.mock("@/lib/queries", () => ({
  useTrainingInsights: () => useTrainingInsights(),
}));

// Stand-in for the chart so the number of points it receives is observable under
// jsdom (where recharts paints no SVG); the page wiring (range filter) is what we
// assert here, not chart internals.
vi.mock("@/components/pmc-chart", () => ({
  PmcChart: ({ series }: { series: unknown[] }) => (
    <div data-testid="pmc-series-count">{series.length}</div>
  ),
}));

// Same stand-in trick for the weekly chart so each chart's independent range
// selector is observable by the number of points it receives.
vi.mock("@/components/weekly-load-chart", () => ({
  WeeklyLoadChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="weekly-load-count">{data.length}</div>
  ),
}));

// Build a "YYYY-MM-DD" UTC date `n` days before now.
function daysAgo(n: number): string {
  const d = new Date();
  const utc = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  utc.setUTCDate(utc.getUTCDate() - n);
  return utc.toISOString().slice(0, 10);
}

function payload(overrides: Partial<TrainingInsights> = {}): TrainingInsights {
  return {
    pmc: {
      series: [0, 2, 5, 15, 25].map((n) => ({
        date: daysAgo(n),
        load: 100,
        ctl: 50,
        atl: 45,
        tsb: 5,
      })),
      current: { ctl: 62, atl: 48, tsb: 14, formLabel: "fresh" },
    },
    weeklyLoad: [0, 8, 20, 40].map((n) => ({
      weekStart: daysAgo(n),
      load: 700,
      recommendedLoad: 650,
    })),
    trends: { ctlRampPerWeek: -2.5, tsbDirection: "falling" },
    prs: [
      { type: "Run", maxDistance: 21097, maxDuration: 7200, bestPaceSecPerKm: 300 },
    ],
    ...overrides,
  };
}

function mockQuery(over: Record<string, unknown>) {
  useTrainingInsights.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    ...over,
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("InsightsPage", () => {
  it("shows a skeleton while loading (AC-8)", () => {
    mockQuery({ isLoading: true });
    render(<InsightsPage />);
    expect(screen.getByTestId("insights-skeleton")).toBeInTheDocument();
  });

  it("shows an empty state guiding the user to sync when the series is empty (AC-8)", () => {
    mockQuery({
      data: payload({
        pmc: {
          series: [],
          current: { ctl: 0, atl: 0, tsb: 0, formLabel: "neutral" },
        },
      }),
    });
    render(<InsightsPage />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/sync your training data/i)).toBeInTheDocument();
  });

  it("shows the temporarily-unavailable state on a 503 (AC-8)", () => {
    mockQuery({
      isError: true,
      error: new Error("Request to /api/insights/training failed (503)"),
    });
    render(<InsightsPage />);
    expect(
      screen.getByText(/insights temporarily unavailable/i),
    ).toBeInTheDocument();
  });

  it("shows a generic error state on a non-503 failure (AC-8)", () => {
    mockQuery({
      isError: true,
      error: new Error("Request to /api/insights/training failed (502)"),
    });
    render(<InsightsPage />);
    expect(screen.getByText(/couldn't load your insights/i)).toBeInTheDocument();
  });

  it("renders the dashboard sections and the trends readout (AC-6)", () => {
    mockQuery({ data: payload() });
    render(<InsightsPage />);
    expect(screen.getByTestId("current-form-cards")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-load-count")).toBeInTheDocument();
    expect(screen.getByTestId("personal-records-table")).toBeInTheDocument();
    const trends = screen.getByTestId("trends-readout");
    expect(trends).toHaveTextContent("-2.5/wk");
    expect(trends).toHaveTextContent("falling");
  });

  it("PMC chart: defaults to 30d (5 points) and narrows + persists on 7d (AC-10)", async () => {
    const user = userEvent.setup();
    mockQuery({ data: payload() });
    render(<InsightsPage />);

    // Default 30d window keeps all five points (0..25 days ago).
    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("5");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /performance management time range/i }),
      "7d",
    );

    // Trailing 7 days keeps only the 0/2/5-day-ago points.
    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("3");
    expect(localStorage.getItem("insights.pmcRange")).toBe(
      JSON.stringify("7d"),
    );
  });

  it("each chart's range filter is independent (AC-10)", async () => {
    const user = userEvent.setup();
    mockQuery({ data: payload() });
    render(<InsightsPage />);

    // Defaults: PMC 30d → 5 points; weekly 1m (30d) → 3 weeks (0/8/20 days ago).
    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("5");
    expect(screen.getByTestId("weekly-load-count")).toHaveTextContent("3");

    // Widening the weekly range to 2m (60d) picks up the 40-day-ago week and
    // leaves the PMC chart untouched.
    await user.selectOptions(
      screen.getByRole("combobox", { name: /weekly training load time range/i }),
      "2m",
    );

    expect(screen.getByTestId("weekly-load-count")).toHaveTextContent("4");
    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("5");
    expect(localStorage.getItem("insights.weeklyRange")).toBe(
      JSON.stringify("2m"),
    );
  });

  it("clicking Refresh triggers a refetch (AC-11)", async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockQuery({ data: payload(), refetch });
    render(<InsightsPage />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("disables Refresh and shows a busy label while fetching (AC-11)", () => {
    mockQuery({ data: payload(), isFetching: true });
    render(<InsightsPage />);
    const button = screen.getByRole("button", { name: /refreshing/i });
    expect(button).toBeDisabled();
  });
});
