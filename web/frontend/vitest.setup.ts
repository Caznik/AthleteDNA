import "@testing-library/jest-dom/vitest";

// Initialize the i18next singleton (default language "en") so any component using
// useTranslation() resolves real English copy in tests without mounting Providers.
// Test files that need a Spanish render call i18n.changeLanguage("es") themselves;
// files that mock "@/lib/i18n" / "react-i18next" override this per-file.
import "@/lib/i18n";

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs it on mount.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
