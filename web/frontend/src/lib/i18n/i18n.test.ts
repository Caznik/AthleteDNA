import { afterEach, describe, expect, it } from "vitest";

import i18n from "./index";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("i18n config", () => {
  it("defaults to English", () => {
    expect(i18n.language).toBe("en");
    expect(i18n.t("nav.dashboard")).toBe("Dashboard");
  });

  it("switches the active language with changeLanguage", async () => {
    await i18n.changeLanguage("es");
    expect(i18n.t("nav.dashboard")).toBe("Panel");
  });

  it("falls back to the English string for a missing es key (AC-13)", async () => {
    // A key present only in the English catalog must render its English value,
    // not the raw key, proving fallbackLng: "en".
    i18n.addResource("en", "translation", "__fallbackProbe", "English only");
    await i18n.changeLanguage("es");

    expect(i18n.t("__fallbackProbe")).toBe("English only");
  });
});
