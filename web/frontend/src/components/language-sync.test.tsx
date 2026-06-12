import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LanguageSync } from "./language-sync";
import type { AuthUser } from "@/lib/types";

const changeLanguage = vi.fn();
let currentUser: AuthUser | null = null;

vi.mock("@/lib/i18n", () => ({
  default: { changeLanguage: (lng: string) => changeLanguage(lng) },
}));

vi.mock("@/lib/auth-queries", () => ({
  useCurrentUser: () => ({ data: currentUser }),
}));

function makeUser(
  languagePreference: AuthUser["languagePreference"],
): AuthUser {
  return {
    id: "u1",
    email: "user@example.com",
    username: "carlos",
    photoUpdatedAt: null,
    themePreference: "system",
    languagePreference,
  };
}

describe("LanguageSync", () => {
  beforeEach(() => {
    changeLanguage.mockClear();
    currentUser = null;
  });

  it("applies the stored language on load (AC-8)", () => {
    currentUser = makeUser("es");
    render(<LanguageSync />);
    expect(changeLanguage).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith("es");
  });

  it("does not re-apply a stale preference on intermediate re-renders (no language blink) (AC-8)", () => {
    currentUser = makeUser("en");
    const { rerender } = render(<LanguageSync />);
    expect(changeLanguage).toHaveBeenCalledTimes(1);

    // The user just switched to es locally; while the mutation is in flight the
    // cached preference is still "en". Re-renders here must NOT re-push "en".
    rerender(<LanguageSync />);
    rerender(<LanguageSync />);
    expect(changeLanguage).toHaveBeenCalledTimes(1);

    // Cache catches up to the new value -> applied exactly once.
    currentUser = makeUser("es");
    rerender(<LanguageSync />);
    expect(changeLanguage).toHaveBeenCalledTimes(2);
    expect(changeLanguage).toHaveBeenLastCalledWith("es");
  });

  it("leaves the language untouched while logged out (AC-8)", () => {
    currentUser = null;
    render(<LanguageSync />);
    expect(changeLanguage).not.toHaveBeenCalled();
  });
});
