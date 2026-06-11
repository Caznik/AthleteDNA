import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PmcChart } from "./pmc-chart";
import type { InsightSeriesPoint } from "@/lib/types";

function point(date: string, ctl: number): InsightSeriesPoint {
  return { date, load: 100, ctl, atl: ctl - 5, tsb: 5 };
}

describe("PmcChart", () => {
  const series = [point("2026-05-30", 50), point("2026-05-31", 52)];

  it("renders the chart wrapper and the three series legend labels", () => {
    render(<PmcChart series={series} />);

    expect(screen.getByTestId("pmc-chart")).toBeInTheDocument();
    expect(screen.getByText("CTL (Fitness)")).toBeInTheDocument();
    expect(screen.getByText("ATL (Fatigue)")).toBeInTheDocument();
    expect(screen.getByText("TSB (Form)")).toBeInTheDocument();
  });

  it("renders an info-tooltip button for each series (AC-5)", () => {
    render(<PmcChart series={series} />);

    expect(
      screen.getByRole("button", { name: /about fitness \(ctl\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about fatigue \(atl\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about form \(tsb\)/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("metric-info")).toHaveLength(3);
  });
});
