import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("renders an accessible status with an animated icon and sr-only label (AC-1, AC-8)", () => {
    render(<Spinner />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("merges a caller-provided className onto the icon (AC-1)", () => {
    render(<Spinner className="h-8 w-8" />);
    const icon = screen.getByRole("status").querySelector(".animate-spin");
    expect(icon).toHaveClass("h-8", "w-8");
  });
});
