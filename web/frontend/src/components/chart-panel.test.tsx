import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChartPanel } from "./chart-panel";
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

describe("ChartPanel", () => {
  const data = [activity({ type: "Run" })];

  it("renders the activities-distribution chart titled 'Activities distribution'", () => {
    render(<ChartPanel filtered={data} />);
    expect(screen.getByTestId("activity-type-chart")).toBeInTheDocument();
    expect(
      screen.getByText("Activities distribution", { selector: "div" }),
    ).toBeInTheDocument();
  });

  it("renders no chart selector and no training-load chart", () => {
    render(<ChartPanel filtered={data} />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("training-load-chart"),
    ).not.toBeInTheDocument();
  });

  it("renders the distribution pie from the `filtered` list", () => {
    render(<ChartPanel filtered={[]} />);
    expect(screen.getByTestId("activity-type-empty")).toBeInTheDocument();
    expect(
      screen.queryByTestId("activity-type-chart"),
    ).not.toBeInTheDocument();
  });
});
