import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DistanceZoneChart } from "./distance-zone-chart";
import type { Activity } from "@/lib/types";

function activity(partial: Partial<Activity>): Activity {
  return {
    id: crypto.randomUUID(),
    type: "Run",
    distance: 8000,
    duration: 3600,
    avgHr: 150,
    externalStravaId: 1,
    startDate: "2026-05-28T08:00:00Z",
    trainingLoad: 80,
    ...partial,
  };
}

describe("DistanceZoneChart", () => {
  it("renders the chart wrapper when some activity has distance", () => {
    render(
      <DistanceZoneChart
        activities={[activity({ distance: 3000 }), activity({ distance: 12000 })]}
      />,
    );
    expect(screen.getByTestId("distance-zone-chart")).toBeInTheDocument();
    expect(
      screen.queryByTestId("distance-zone-empty"),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when no activity carries a positive distance", () => {
    render(
      <DistanceZoneChart
        activities={[activity({ distance: null }), activity({ distance: 0 })]}
      />,
    );
    expect(screen.getByTestId("distance-zone-empty")).toBeInTheDocument();
    expect(
      screen.queryByTestId("distance-zone-chart"),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state for an empty list", () => {
    render(<DistanceZoneChart activities={[]} />);
    expect(screen.getByTestId("distance-zone-empty")).toBeInTheDocument();
  });
});
