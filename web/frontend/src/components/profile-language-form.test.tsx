import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileLanguageForm } from "./profile-language-form";
import type { AuthUser } from "@/lib/types";

const h = vi.hoisted(() => {
  const state = { currentLng: "en" };
  const mutate = vi.fn();
  const changeLanguage = vi.fn((lng: string) => {
    state.currentLng = lng;
    return Promise.resolve();
  });
  return { state, mutate, changeLanguage };
});
const { mutate, changeLanguage } = h;

const LABELS: Record<string, string> = {
  "profile.language.title": "Language",
  "profile.language.description": "Choose the language AthleteDNA uses.",
  "profile.language.group": "Language",
  "profile.language.en": "English",
  "profile.language.es": "Spanish",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => LABELS[key] ?? key }),
}));

vi.mock("@/lib/i18n", () => ({
  default: {
    get language() {
      return h.state.currentLng;
    },
    changeLanguage: h.changeLanguage,
  },
}));

vi.mock("@/lib/auth-queries", () => ({
  useUpdateLanguage: () => ({ mutate: h.mutate }),
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

describe("ProfileLanguageForm", () => {
  beforeEach(() => {
    mutate.mockClear();
    changeLanguage.mockClear();
    h.state.currentLng = "en";
  });

  it("renders the EN/ES options with the active one pressed (AC-5)", () => {
    h.state.currentLng = "es";
    render(<ProfileLanguageForm user={makeUser("es")} />);

    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Spanish" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("applies and persists the chosen language on click (AC-6)", async () => {
    const user = userEvent.setup();
    render(<ProfileLanguageForm user={makeUser("en")} />);

    await user.click(screen.getByRole("button", { name: "Spanish" }));

    expect(changeLanguage).toHaveBeenCalledWith("es");
    expect(mutate).toHaveBeenCalledWith("es");
  });

  it("does not re-apply or persist the already-active option (AC-6)", async () => {
    const user = userEvent.setup();
    render(<ProfileLanguageForm user={makeUser("en")} />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(changeLanguage).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
});
