import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";
import { NavTransitionProvider } from "./nav-transition";

const usePathname = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ push }),
}));

// AuthNav pulls the session query; stub it so the header renders in isolation.
vi.mock("@/components/auth-nav", () => ({
  AuthNav: () => <div data-testid="auth-nav" />,
}));

describe("SiteHeader", () => {
  it("renders an Activities tab linking to /activities and no merged-away Insights tab", () => {
    usePathname.mockReturnValue("/");
    render(<SiteHeader />);
    const link = screen.getByRole("link", { name: "Activities" });
    expect(link).toHaveAttribute("href", "/activities");
    // Insights was merged into the dashboard at /, so its tab is gone.
    expect(screen.queryByRole("link", { name: "Insights" })).toBeNull();
  });

  it("marks the Activities tab as current on the /activities path", () => {
    usePathname.mockReturnValue("/activities");
    render(<SiteHeader />);
    const link = screen.getByRole("link", { name: "Activities" });
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("intercepts a plain tab click into a client navigation (AC-7)", async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue("/");
    render(
      <NavTransitionProvider>
        <SiteHeader />
      </NavTransitionProvider>,
    );
    await user.click(screen.getByRole("link", { name: "Activities" }));
    expect(push).toHaveBeenCalledWith("/activities");
  });
});
