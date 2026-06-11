import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Stub the header so the shell renders without AuthNav's session query.
vi.mock("@/components/site-header", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Force the transition flag so the overlay window is observable in jsdom, where
// a real router.push round-trip never flips isPending synchronously.
const useTransitionMock = vi.fn();
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useTransition: () => useTransitionMock() };
});

import { AppShell } from "./app-shell";

afterEach(() => vi.clearAllMocks());

describe("AppShell nav overlay (AC-6)", () => {
  it("renders a centered status overlay over dimmed, non-interactive content while pending", () => {
    useTransitionMock.mockReturnValue([true, (cb: () => void) => cb()]);
    render(
      <AppShell>
        <div data-testid="content">hi</div>
      </AppShell>,
    );

    const overlay = screen.getByTestId("nav-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.querySelector('[role="status"]')).not.toBeNull();

    const wrapper = screen.getByTestId("content").parentElement;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveClass("pointer-events-none");
  });

  it("renders no overlay when no transition is pending", () => {
    useTransitionMock.mockReturnValue([false, (cb: () => void) => cb()]);
    render(
      <AppShell>
        <div data-testid="content">hi</div>
      </AppShell>,
    );

    expect(screen.queryByTestId("nav-overlay")).toBeNull();
    const wrapper = screen.getByTestId("content").parentElement;
    expect(wrapper).not.toHaveAttribute("aria-hidden");
  });
});
