import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileUsernameForm } from "./profile-username-form";

const useUpdateUsername = vi.fn();

vi.mock("@/lib/auth-queries", () => ({
  useUpdateUsername: () => useUpdateUsername(),
}));

describe("ProfileUsernameForm", () => {
  const mutateAsync = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mutateAsync.mockClear();
    useUpdateUsername.mockReturnValue({ mutateAsync, isPending: false });
  });

  it("disables Save while the username is unchanged", () => {
    render(<ProfileUsernameForm currentUsername="carlos" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("disables Save when the field is emptied", async () => {
    const user = userEvent.setup();
    render(<ProfileUsernameForm currentUsername="carlos" />);
    await user.clear(screen.getByLabelText("Username"));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("submits the trimmed new username", async () => {
    const user = userEvent.setup();
    render(<ProfileUsernameForm currentUsername="carlos" />);
    const input = screen.getByLabelText("Username");
    await user.clear(input);
    await user.type(input, "  newhandle  ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mutateAsync).toHaveBeenCalledWith("newhandle");
  });
});
