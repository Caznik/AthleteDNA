import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeSync } from "./theme-sync";
import type { AuthUser } from "@/lib/types";

const setTheme = vi.fn();
let currentUser: AuthUser | null = null;
let currentTheme: string | undefined = undefined;

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: currentTheme, setTheme }),
}));

vi.mock("@/lib/auth-queries", () => ({
  useCurrentUser: () => ({ data: currentUser }),
}));

function makeUser(themePreference: AuthUser["themePreference"]): AuthUser {
  return {
    id: "u1",
    email: "user@example.com",
    username: "carlos",
    photoUpdatedAt: null,
    themePreference,
  };
}

describe("ThemeSync", () => {
  beforeEach(() => {
    setTheme.mockClear();
    currentUser = null;
    currentTheme = undefined;
  });

  it("applies the stored preference when it differs from the current theme", () => {
    currentTheme = "light";
    currentUser = makeUser("dark");
    render(<ThemeSync />);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("does not re-apply when the stored preference already matches (no blink)", () => {
    currentTheme = "dark";
    currentUser = makeUser("dark");
    render(<ThemeSync />);
    expect(setTheme).not.toHaveBeenCalled();
  });

  it("leaves the theme untouched while logged out", () => {
    currentUser = null;
    render(<ThemeSync />);
    expect(setTheme).not.toHaveBeenCalled();
  });
});
