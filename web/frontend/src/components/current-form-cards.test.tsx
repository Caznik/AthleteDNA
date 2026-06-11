import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurrentFormCards } from "./current-form-cards";

describe("CurrentFormCards", () => {
  it("shows rounded fitness/fatigue, signed form and the form badge", () => {
    render(
      <CurrentFormCards
        current={{ ctl: 62.4, atl: 48.1, tsb: 14.3, formLabel: "fresh" }}
      />,
    );

    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("+14")).toBeInTheDocument();

    const badge = screen.getByTestId("form-badge");
    expect(badge).toHaveTextContent("fresh");
  });

  it("renders an info-tooltip button on each of the three cards (AC-7)", () => {
    render(
      <CurrentFormCards
        current={{ ctl: 62.4, atl: 48.1, tsb: 14.3, formLabel: "fresh" }}
      />,
    );

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

  it("renders a negative form value with a minus sign", () => {
    render(
      <CurrentFormCards
        current={{ ctl: 40, atl: 43, tsb: -3.2, formLabel: "fatigued" }}
      />,
    );
    expect(screen.getByText("-3")).toBeInTheDocument();
    expect(screen.getByTestId("form-badge")).toHaveTextContent("fatigued");
  });
});
