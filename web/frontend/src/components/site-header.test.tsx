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
  it("renders an Insights tab linking to /insights", () => {
    usePathname.mockReturnValue("/");
    render(<SiteHeader />);
    const link = screen.getByRole("link", { name: "Insights" });
    expect(link).toHaveAttribute("href", "/insights");
  });

  it("marks the Insights tab as current on the /insights path", () => {
    usePathname.mockReturnValue("/insights");
    render(<SiteHeader />);
    const link = screen.getByRole("link", { name: "Insights" });
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
    await user.click(screen.getByRole("link", { name: "Insights" }));
    expect(push).toHaveBeenCalledWith("/insights");
  });
});
