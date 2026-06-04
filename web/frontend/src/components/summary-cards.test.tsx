import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SummaryCards } from "./summary-cards";
import type { Activity } from "@/lib/types";

function activity(partial: Partial<Activity>): Activity {
  return {
    id: "1",
    type: "Running",
    distance: 10000,
    duration: 3600,
    avgHr: 150,
    externalStravaId: 1,
    startDate: "2026-05-25T08:00:00Z",
    trainingLoad: 540000,
    ...partial,
  };
}

describe("SummaryCards", () => {
  it("renders four cards with metric-formatted totals", () => {
    render(
      <SummaryCards
        activities={[
          activity({ distance: 10000, duration: 3600, avgHr: 150 }),
          activity({ distance: 5000, duration: 1800, avgHr: 130 }),
        ]}
      />,
    );

    expect(screen.getAllByTestId("summary-card")).toHaveLength(4);
    expect(screen.getByText("2")).toBeInTheDocument(); // total activities
    expect(screen.getByText("15.00 km")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
    expect(screen.getByText("140 bpm")).toBeInTheDocument();
  });

  it("renders dashes for missing HR", () => {
    render(<SummaryCards activities={[activity({ avgHr: null })]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders zeros and a dash for an empty (filtered-out) period", () => {
    render(<SummaryCards activities={[]} />);
    expect(screen.getAllByTestId("summary-card")).toHaveLength(4);
    expect(screen.getByText("0")).toBeInTheDocument(); // total activities
    expect(screen.getByText("0.00 km")).toBeInTheDocument();
    expect(screen.getByText("0h 0m")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument(); // average HR
  });
});
