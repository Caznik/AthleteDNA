import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeSync } from "./theme-sync";
import type { AuthUser } from "@/lib/types";

const setTheme = vi.fn();
let currentUser: AuthUser | null = null;

// next-themes recreates `setTheme` on every render; mirror that by returning a
// fresh wrapper each call so ThemeSync's effect re-runs on every re-render (this
// is what made the stale-value clobber possible).
vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: (value: string) => setTheme(value) }),
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

  it("applies the stored preference on load", () => {
    currentUser = makeUser("dark");
    render(<ThemeSync />);
    expect(setTheme).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("does not re-apply a stale preference on intermediate re-renders (no opposite-theme blink)", () => {
    currentUser = makeUser("light");
    const { rerender } = render(<ThemeSync />);
    expect(setTheme).toHaveBeenCalledTimes(1);

    // The user just switched to dark locally; while the mutation is in flight the
    // cached preference is still "light". Re-renders here must NOT re-push "light".
    rerender(<ThemeSync />);
    rerender(<ThemeSync />);
    expect(setTheme).toHaveBeenCalledTimes(1);

    // Cache catches up to the new value -> applied exactly once.
    currentUser = makeUser("dark");
    rerender(<ThemeSync />);
    expect(setTheme).toHaveBeenCalledTimes(2);
    expect(setTheme).toHaveBeenLastCalledWith("dark");
  });

  it("leaves the theme untouched while logged out", () => {
    currentUser = null;
    render(<ThemeSync />);
    expect(setTheme).not.toHaveBeenCalled();
  });
});
