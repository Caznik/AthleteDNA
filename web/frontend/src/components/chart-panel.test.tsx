import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

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

afterEach(() => {
  localStorage.clear();
});

describe("ChartPanel", () => {
  const data = [activity({ type: "Run", startDate: "2026-05-28T08:00:00Z" })];

  it("defaults to the activities-distribution chart titled 'Activities distribution'", () => {
    render(<ChartPanel filtered={data} all={data} />);
    expect(
      screen.getByRole("combobox", { name: /^chart$/i }),
    ).toHaveValue("distribution");
    expect(screen.getByTestId("activity-type-chart")).toBeInTheDocument();
    expect(
      screen.queryByTestId("training-load-chart"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Activities distribution", { selector: "div" }),
    ).toBeInTheDocument();
  });

  it("offers both chart options", () => {
    render(<ChartPanel filtered={data} all={data} />);
    expect(
      screen.getByRole("option", { name: "Activities distribution" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Training load (last 12 weeks)" }),
    ).toBeInTheDocument();
  });

  it("does not render a per-chart time range selector", () => {
    render(<ChartPanel filtered={data} all={data} />);
    expect(
      screen.queryByRole("combobox", { name: /time range/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the distribution pie from the `filtered` list", () => {
    // `all` is non-empty but `filtered` is empty → pie shows its empty body.
    render(<ChartPanel filtered={[]} all={data} />);
    expect(screen.getByTestId("activity-type-empty")).toBeInTheDocument();
    expect(
      screen.queryByTestId("activity-type-chart"),
    ).not.toBeInTheDocument();
  });

  it("swaps to the training-load chart when selected", async () => {
    const user = userEvent.setup();
    render(<ChartPanel filtered={data} all={data} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /chart/i }),
      "training-load",
    );

    expect(screen.getByTestId("training-load-chart")).toBeInTheDocument();
    expect(
      screen.queryByTestId("activity-type-chart"),
    ).not.toBeInTheDocument();
  });

  it("persists the selection to localStorage", async () => {
    const user = userEvent.setup();
    render(<ChartPanel filtered={data} all={data} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /chart/i }),
      "training-load",
    );

    expect(localStorage.getItem("dashboard.chart")).toBe(
      JSON.stringify("training-load"),
    );
  });

  it("restores the selection from localStorage on mount", async () => {
    localStorage.setItem("dashboard.chart", JSON.stringify("training-load"));
    render(<ChartPanel filtered={data} all={data} />);

    expect(
      await screen.findByTestId("training-load-chart"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /chart/i })).toHaveValue(
      "training-load",
    );
  });
});
