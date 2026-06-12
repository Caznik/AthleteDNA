import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateUsername } from "./auth-queries";
import i18n from "./i18n";

// Capture sonner toast calls so we can assert the localized copy (AC-10).
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (msg: string) => toastError(msg),
    success: vi.fn(),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(async () => {
  toastError.mockClear();
  await i18n.changeLanguage("es");
});

afterEach(async () => {
  vi.restoreAllMocks();
  await i18n.changeLanguage("en");
});

describe("profile-mutation error localization (AC-10)", () => {
  it("maps a known backend error code to the active-language (es) copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "username_already_taken" }),
      }),
    );

    const { result } = renderHook(() => useUpdateUsername(), { wrapper });
    result.current.mutate("taken");

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Ese nombre de usuario ya está en uso.");
  });

  it("falls back to the generic translated message for an unknown code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "some_unmapped_code" }),
      }),
    );

    const { result } = renderHook(() => useUpdateUsername(), { wrapper });
    result.current.mutate("x");

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError).toHaveBeenCalledWith("Algo salió mal. Inténtalo de nuevo.");
  });
});
