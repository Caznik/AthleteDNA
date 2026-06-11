import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WeeklyLoadChart } from "./weekly-load-chart";
import type { WeeklyLoadPoint } from "@/lib/types";

describe("WeeklyLoadChart", () => {
  const data: WeeklyLoadPoint[] = [
    { weekStart: "2026-05-18", load: 600, recommendedLoad: 560 },
    { weekStart: "2026-05-25", load: 720, recommendedLoad: 590 },
    { weekStart: "2026-06-01", load: 540, recommendedLoad: 620 },
  ];

  it("renders the chart wrapper and reports the week count for M points", () => {
    render(<WeeklyLoadChart data={data} />);
    const chart = screen.getByTestId("weekly-load-chart");
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute(
      "aria-label",
      "Weekly training load, 3 weeks",
    );
  });

  it("renders a custom legend with an info-tooltip button per series (AC-8)", () => {
    render(<WeeklyLoadChart data={data} />);

    expect(screen.getByTestId("weekly-load-legend")).toBeInTheDocument();
    expect(screen.getByText("Weekly load")).toBeInTheDocument();
    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about weekly training load/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about recommended load/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("metric-info")).toHaveLength(2);
  });
});
