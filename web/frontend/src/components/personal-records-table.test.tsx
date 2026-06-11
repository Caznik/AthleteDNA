import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PersonalRecordsTable } from "./personal-records-table";
import type { PersonalRecord } from "@/lib/types";

describe("PersonalRecordsTable", () => {
  it("formats the PR row columns and renders a dash for null pace", () => {
    const records: PersonalRecord[] = [
      {
        type: "Run",
        maxDistance: 21097,
        maxDuration: 7200,
        bestPaceSecPerKm: 300,
      },
      {
        type: "WeightTraining",
        maxDistance: 0,
        maxDuration: 3600,
        bestPaceSecPerKm: null,
      },
    ];

    render(<PersonalRecordsTable records={records} />);

    const runRow = screen.getByText("Run").closest("tr")!;
    expect(within(runRow).getByText("21.10 km")).toBeInTheDocument();
    expect(within(runRow).getByText("2h 0m")).toBeInTheDocument();
    expect(within(runRow).getByText("5:00/km")).toBeInTheDocument();

    const weightRow = screen.getByText("WeightTraining").closest("tr")!;
    expect(within(weightRow).getByText("—")).toBeInTheDocument();
  });

  it("renders an info-tooltip button in each metric header, none for Type (AC-9)", () => {
    render(<PersonalRecordsTable records={[]} />);

    expect(
      screen.getByRole("button", { name: /about max distance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about max duration/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /about best pace/i }),
    ).toBeInTheDocument();

    // Three metric columns carry an icon; the Type header carries none.
    expect(screen.getAllByTestId("metric-info")).toHaveLength(3);
    const typeHeader = screen.getByText("Type").closest("th")!;
    expect(within(typeHeader).queryByTestId("metric-info")).toBeNull();
  });
});
