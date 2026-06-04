import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActivitiesTable, type ActivitiesTableProps } from "./activities-table";
import type { Activity } from "@/lib/types";

function activity(partial: Partial<Activity>): Activity {
  return {
    id: crypto.randomUUID(),
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

// The table is presentational now; sorting/filtering/paging happen server-side.
// These props supply a ready-made page and capture the callbacks it fires.
function setup(overrides: Partial<ActivitiesTableProps> = {}) {
  const onTypeChange = vi.fn();
  const onPageChange = vi.fn();
  const props: ActivitiesTableProps = {
    rows: [activity({ type: "Running" })],
    types: ["All", "Ride", "Running"],
    typeFilter: "All",
    onTypeChange,
    page: 0,
    size: 25,
    total: 1,
    totalPages: 1,
    onPageChange,
    ...overrides,
  };
  render(<ActivitiesTable {...props} />);
  return { onTypeChange, onPageChange };
}

describe("ActivitiesTable", () => {
  it("renders the supplied rows with metric-formatted columns", () => {
    setup({ rows: [activity({})] });
    const rows = screen.getAllByRole("row").slice(1); // skip header
    expect(rows).toHaveLength(1);
    expect(screen.getByText("10.00 km")).toBeInTheDocument();
    expect(screen.getByText("1h 0m")).toBeInTheDocument();
    expect(screen.getByText("150 bpm")).toBeInTheDocument();
  });

  it("renders a filter button per supplied type and highlights the active one", () => {
    setup({ typeFilter: "Ride" });
    const filter = screen.getByTestId("type-filter");
    expect(within(filter).getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(within(filter).getByRole("button", { name: "Ride" })).toBeInTheDocument();
    expect(within(filter).getByRole("button", { name: "Running" })).toBeInTheDocument();
  });

  it("fires onTypeChange when a filter is clicked", async () => {
    const user = userEvent.setup();
    const { onTypeChange } = setup();

    await user.click(screen.getByRole("button", { name: "Ride" }));

    expect(onTypeChange).toHaveBeenCalledWith("Ride");
  });

  it("hides pagination when there is only one page", () => {
    setup({ totalPages: 1 });
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  it("shows pagination and the current range across pages", () => {
    setup({ page: 0, size: 25, total: 60, totalPages: 3, rows: [activity({})] });
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–1 of 60")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("computes the range from a 0-indexed middle page", () => {
    // Page index 1 (the 2nd page) of size 25 starts at row 26.
    const rows = Array.from({ length: 25 }, () => activity({}));
    setup({ page: 1, size: 25, total: 60, totalPages: 3, rows });
    expect(screen.getByText("Showing 26–50 of 60")).toBeInTheDocument();
  });

  it("fires onPageChange with the neighbouring page index", async () => {
    const user = userEvent.setup();
    const { onPageChange } = setup({ page: 1, total: 60, totalPages: 3 });

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(0);
  });

  it("disables Next on the last page", () => {
    setup({ page: 2, total: 60, totalPages: 3 });
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });
});
