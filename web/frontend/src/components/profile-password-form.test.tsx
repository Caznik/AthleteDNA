import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfilePasswordForm } from "./profile-password-form";

const useChangePassword = vi.fn();

vi.mock("@/lib/auth-queries", () => ({
  useChangePassword: () => useChangePassword(),
}));

describe("ProfilePasswordForm", () => {
  const mutateAsync = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mutateAsync.mockClear();
    useChangePassword.mockReturnValue({ mutateAsync, isPending: false });
  });

  it("keeps Save disabled until the form is valid", () => {
    render(<ProfilePasswordForm />);
    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeDisabled();
  });

  it("flags a confirmation mismatch and blocks submit", async () => {
    const user = userEvent.setup();
    render(<ProfilePasswordForm />);
    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "different123",
    );
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeDisabled();
  });

  it("submits current and new password when valid", async () => {
    const user = userEvent.setup();
    render(<ProfilePasswordForm />);
    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    await user.type(screen.getByLabelText("New password"), "newpassword1");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "newpassword1",
    );
    await user.click(
      screen.getByRole("button", { name: "Change password" }),
    );
    expect(mutateAsync).toHaveBeenCalledWith({
      currentPassword: "oldpassword",
      newPassword: "newpassword1",
    });
  });
});
