import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const useSync = vi.fn();
vi.mock("@/lib/queries", () => ({
  useSync: () => useSync(),
}));

import { SyncButton } from "./sync-button";

afterEach(() => vi.clearAllMocks());

describe("SyncButton (AC-4)", () => {
  it("disables and shows a spinner with the busy label while syncing", () => {
    useSync.mockReturnValue({ isPending: true, mutate: vi.fn() });
    render(<SyncButton />);
    const button = screen.getByTestId("sync-button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Syncing…");
    expect(button.querySelector('[role="status"]')).not.toBeNull();
  });

  it("shows the idle label with no spinner when not syncing", () => {
    useSync.mockReturnValue({ isPending: false, mutate: vi.fn() });
    render(<SyncButton />);
    const button = screen.getByTestId("sync-button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Sync activities");
    expect(button.querySelector('[role="status"]')).toBeNull();
  });
});
