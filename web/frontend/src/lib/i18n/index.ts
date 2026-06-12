"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import es from "./locales/es.json";

// A single client-only i18next singleton, mirroring the ThemeProvider wiring.
// Resources are bundled (not http-loaded) and init runs synchronously at import,
// so t() resolves to the default `en` catalog in tests without a provider and
// without Suspense. The applied language is driven post-mount by <LanguageSync/>.
if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });
}

export default i18next;
