import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileThemeForm } from "./profile-theme-form";
import type { AuthUser } from "@/lib/types";

const setTheme = vi.fn();
const mutate = vi.fn();
let currentTheme = "system";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: currentTheme, setTheme }),
}));

vi.mock("@/lib/auth-queries", () => ({
  useUpdateTheme: () => ({ mutate }),
}));

function makeUser(themePreference: AuthUser["themePreference"]): AuthUser {
  return {
    id: "u1",
    email: "user@example.com",
    username: "carlos",
    photoUpdatedAt: null,
    themePreference,
    languagePreference: "en",
  };
}

describe("ProfileThemeForm", () => {
  beforeEach(() => {
    setTheme.mockClear();
    mutate.mockClear();
    currentTheme = "system";
  });

  it("renders the three options with the active one pressed", () => {
    render(<ProfileThemeForm user={makeUser("system")} />);

    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("applies and persists the chosen theme on click", async () => {
    const user = userEvent.setup();
    render(<ProfileThemeForm user={makeUser("system")} />);

    await user.click(screen.getByRole("button", { name: "Dark" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(mutate).toHaveBeenCalledWith("dark");
  });

  it("does not re-apply or persist the already-active option", async () => {
    const user = userEvent.setup();
    render(<ProfileThemeForm user={makeUser("system")} />);

    await user.click(screen.getByRole("button", { name: "System" }));

    expect(setTheme).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
});
