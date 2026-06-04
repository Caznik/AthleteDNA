import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { usePersistedState } from "./use-persisted-state";

afterEach(() => {
  localStorage.clear();
});

describe("usePersistedState", () => {
  it("returns the default when nothing is stored", () => {
    const { result } = renderHook(() => usePersistedState("k", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("restores a previously stored value", () => {
    localStorage.setItem("k", JSON.stringify("stored"));
    const { result } = renderHook(() => usePersistedState("k", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("persists updates to localStorage", () => {
    const { result } = renderHook(() => usePersistedState("k", "a"));
    act(() => {
      result.current[1]("b");
    });
    expect(result.current[0]).toBe("b");
    expect(localStorage.getItem("k")).toBe(JSON.stringify("b"));
  });
});
