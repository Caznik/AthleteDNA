"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthNav } from "@/components/auth-nav";
import { useNavTransition } from "@/components/nav-transition";
import { cn } from "@/lib/utils";

// Routes that render without the app chrome (no top bar).
const BARE_ROUTES = ["/login", "/register"];

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/activities", label: "Activities" },
  { href: "/insights", label: "Insights" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { navigate } = useNavTransition();
  if (BARE_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          AthleteDNA
        </Link>

        <nav className="flex items-center justify-center gap-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  // Intercept only plain left-clicks; let modified clicks fall
                  // through so ⌘/ctrl-click still opens a new tab natively.
                  if (
                    navigate &&
                    !e.metaKey &&
                    !e.ctrlKey &&
                    !e.shiftKey &&
                    !e.altKey &&
                    e.button === 0
                  ) {
                    e.preventDefault();
                    navigate(tab.href);
                  }
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-4">
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
