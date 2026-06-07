import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
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
});
