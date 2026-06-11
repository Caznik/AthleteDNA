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
});
