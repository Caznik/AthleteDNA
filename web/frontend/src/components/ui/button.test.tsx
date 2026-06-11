import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button loading affordance (AC-2, AC-7)", () => {
  it("disables the button and renders an inline spinner when loading", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toBeDisabled();
    expect(button.querySelector('[role="status"]')).not.toBeNull();
  });

  it("renders no spinner and stays enabled when not loading", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toBeEnabled();
    expect(button.querySelector('[role="status"]')).toBeNull();
  });
});
