import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityTypeChart } from "./activity-type-chart";
import type { Activity } from "@/lib/types";

function activity(partial: Partial<Activity>): Activity {
  return {
    id: crypto.randomUUID(),
    type: "Run",
    distance: 10000,
    duration: 3600,
    avgHr: 150,
    externalStravaId: 1,
    startDate: "2026-05-28T08:00:00Z",
    trainingLoad: 540000,
    ...partial,
  };
}

describe("ActivityTypeChart", () => {
  it("renders the chart wrapper when activities are present", () => {
    render(
      <ActivityTypeChart
        activities={[
          activity({ type: "Run" }),
          activity({ type: "Ride" }),
        ]}
      />,
    );
    expect(screen.getByTestId("activity-type-chart")).toBeInTheDocument();
    expect(
      screen.queryByTestId("activity-type-empty"),
    ).not.toBeInTheDocument();
  });

  it("renders the empty-state message when the (filtered) list is empty", () => {
    render(<ActivityTypeChart activities={[]} />);
    expect(screen.getByTestId("activity-type-empty")).toBeInTheDocument();
    expect(
      screen.getByText("No activities in this period"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("activity-type-chart"),
    ).not.toBeInTheDocument();
  });
});
