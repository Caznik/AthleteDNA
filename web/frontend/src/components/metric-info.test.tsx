import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricInfo } from "./metric-info";

describe("MetricInfo", () => {
  it("renders a focusable button whose accessible name names the metric (AC-2, AC-10)", () => {
    render(<MetricInfo id="ctl" />);

    const button = screen.getByRole("button", { name: /about fitness \(ctl\)/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");

    // Keyboard-focusable: a native, non-disabled <button> with no negative
    // tabindex is in the tab order by definition.
    expect(button.tagName).toBe("BUTTON");
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("tabindex", "-1");
  });

  it("derives its accessible name from the shared copy map for any id (AC-3)", () => {
    render(<MetricInfo id="tsb" />);
    expect(
      screen.getByRole("button", { name: /about form \(tsb\)/i }),
    ).toBeInTheDocument();
  });
});
