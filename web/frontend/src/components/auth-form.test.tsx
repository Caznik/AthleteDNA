import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const baseProps = {
  title: "Log in",
  description: "Welcome back",
  submitLabel: "Log in",
  pendingLabel: "Logging in…",
  onSubmit: vi.fn(),
  footer: <span>footer</span>,
};

describe("AuthForm submit button (AC-3)", () => {
  it("disables submit and shows a spinner with the pending label while pending", () => {
    render(<AuthForm {...baseProps} pending />);
    const button = screen.getByRole("button", { name: /logging in/i });
    expect(button).toBeDisabled();
    expect(button.querySelector('[role="status"]')).not.toBeNull();
  });

  it("shows the submit label with no spinner when idle", () => {
    render(<AuthForm {...baseProps} pending={false} />);
    const button = screen.getByRole("button", { name: /^log in$/i });
    expect(button).toBeEnabled();
    expect(button.querySelector('[role="status"]')).toBeNull();
  });
});
