import "@testing-library/jest-dom/vitest";

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs it on mount.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
