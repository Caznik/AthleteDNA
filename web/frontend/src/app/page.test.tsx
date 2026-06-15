import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";
import type { Activity, TrainingInsights } from "@/lib/types";

const useStravaStatus = vi.fn();
const useActivities = vi.fn();
const useTrainingInsights = vi.fn();

vi.mock("@/lib/queries", () => ({
  useStravaStatus: () => useStravaStatus(),
  useActivities: () => useActivities(),
  useTrainingInsights: () => useTrainingInsights(),
  // ConnectStravaButton renders on the not-linked branch and pulls its mutation
  // from this module. Syncing/importing now live on the Activities page.
  useConnect: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Chart stand-ins so the number of points each receives is observable under
// jsdom (where recharts paints no SVG); the page wiring (range filters) is what
// we assert, not chart internals.
vi.mock("@/components/pmc-chart", () => ({
  PmcChart: ({ series }: { series: unknown[] }) => (
    <div data-testid="pmc-series-count">{series.length}</div>
  ),
}));
vi.mock("@/components/weekly-load-chart", () => ({
  WeeklyLoadChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="weekly-load-count">{data.length}</div>
  ),
}));

function activity(partial: Partial<Activity> = {}): Activity {
  return {
    id: crypto.randomUUID(),
    type: "Run",
    distance: 8000,
    duration: 3000,
    avgHr: 150,
    externalStravaId: 1,
    startDate: new Date().toISOString(),
    trainingLoad: 80,
    ...partial,
  };
}

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

function mockInsights(over: Record<string, unknown>) {
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
  // Defaults: connected, one recent activity, insights resolved.
  useStravaStatus.mockReturnValue({ data: { linked: true }, isLoading: false });
  useActivities.mockReturnValue({
    data: [activity()],
    isLoading: false,
    isError: false,
  });
  mockInsights({ data: payload() });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage (merged)", () => {
  it("shows a skeleton while status/activities load", () => {
    useStravaStatus.mockReturnValue({ data: undefined, isLoading: true });
    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard-skeleton")).toBeInTheDocument();
  });

  it("guides the user to connect when Strava is not linked", () => {
    useStravaStatus.mockReturnValue({
      data: { linked: false },
      isLoading: false,
    });
    render(<DashboardPage />);
    expect(
      screen.getByText(/connect your strava account/i),
    ).toBeInTheDocument();
  });

  it("shows an error state when activities fail to load", () => {
    useActivities.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<DashboardPage />);
    expect(screen.getByText(/couldn't load your activities/i)).toBeInTheDocument();
  });

  it("shows an empty state pointing to Activities when there are none", () => {
    useActivities.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<DashboardPage />);
    expect(screen.getByText(/no activities yet/i)).toBeInTheDocument();
  });

  it("renders all sections when activities and insights are present", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("training-status-card")).toBeInTheDocument();
    expect(screen.getByTestId("current-form-cards")).toBeInTheDocument();
    expect(screen.getByTestId("training-summary-cards")).toBeInTheDocument();
    expect(screen.getByTestId("pmc-series-count")).toBeInTheDocument();
    expect(screen.getByTestId("weekly-load-count")).toBeInTheDocument();
    expect(screen.getByTestId("activity-type-chart")).toBeInTheDocument();
    expect(screen.getByTestId("distance-zone-chart")).toBeInTheDocument();
    expect(screen.getByTestId("personal-records-table")).toBeInTheDocument();
  });

  it("shows the total-load summary card with its info tooltip", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/total load/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about total load/i }),
    ).toBeInTheDocument();
  });

  it("renders the trends readout from the insights payload", () => {
    render(<DashboardPage />);
    const trends = screen.getByTestId("trends-readout");
    expect(trends).toHaveTextContent("-2.5/wk");
    expect(trends).toHaveTextContent("falling");
  });

  it("degrades gracefully when the engine is unavailable (503)", () => {
    mockInsights({
      isError: true,
      error: new Error("Request to /api/insights/training failed (503)"),
    });
    render(<DashboardPage />);

    // Inline banner replaces the engine hero, but activity-only sections survive.
    expect(screen.getByTestId("insights-banner")).toBeInTheDocument();
    expect(
      screen.getByText(/insights temporarily unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("training-summary-cards")).toBeInTheDocument();
    expect(screen.getByTestId("activity-type-chart")).toBeInTheDocument();
    expect(screen.getByTestId("distance-zone-chart")).toBeInTheDocument();

    // Engine-only sections are absent.
    expect(screen.queryByTestId("pmc-series-count")).not.toBeInTheDocument();
    expect(screen.queryByTestId("personal-records-table")).not.toBeInTheDocument();
  });

  it("shows a generic engine error banner on a non-503 failure", () => {
    mockInsights({
      isError: true,
      error: new Error("Request to /api/insights/training failed (502)"),
    });
    render(<DashboardPage />);
    expect(screen.getByText(/couldn't load your insights/i)).toBeInTheDocument();
  });

  it("keeps activity sections up while insights are still loading", () => {
    mockInsights({ isLoading: true });
    render(<DashboardPage />);
    expect(screen.getByTestId("training-summary-cards")).toBeInTheDocument();
    expect(screen.getByTestId("activity-type-chart")).toBeInTheDocument();
    // No engine charts yet, and no error banner while merely loading.
    expect(screen.queryByTestId("pmc-series-count")).not.toBeInTheDocument();
    expect(screen.queryByTestId("insights-banner")).not.toBeInTheDocument();
  });

  it("PMC chart defaults to 30d (5 points) and narrows + persists on 7d", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("5");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /performance management time range/i }),
      "7d",
    );
    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("3");
    expect(localStorage.getItem("insights.pmcRange")).toBe(JSON.stringify("7d"));
  });

  it("weekly range is independent of the PMC range", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(screen.getByTestId("pmc-series-count")).toHaveTextContent("5");
    expect(screen.getByTestId("weekly-load-count")).toHaveTextContent("3");

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
});
