"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { AuthNav } from "@/components/auth-nav";
import { useNavTransition } from "@/components/nav-transition";
import { cn } from "@/lib/utils";

// Routes that render without the app chrome (no top bar).
const BARE_ROUTES = ["/login", "/register"];

const TABS = [
  { href: "/", labelKey: "nav.dashboard" },
  { href: "/activities", labelKey: "nav.activities" },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { navigate } = useNavTransition();
  if (BARE_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3.5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
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
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {t(tab.labelKey)}
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
