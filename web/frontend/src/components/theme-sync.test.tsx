import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeSync } from "./theme-sync";
import type { AuthUser } from "@/lib/types";

const setTheme = vi.fn();
let currentUser: AuthUser | null = null;

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme }),
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
  });

  it("applies the signed-in user's stored preference", () => {
    currentUser = makeUser("dark");
    render(<ThemeSync />);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("leaves the theme untouched while logged out", () => {
    currentUser = null;
    render(<ThemeSync />);
    expect(setTheme).not.toHaveBeenCalled();
  });
});
