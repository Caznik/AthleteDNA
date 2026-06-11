"use client";

import {
  NavTransitionProvider,
  useNavTransition,
} from "@/components/nav-transition";
import { SiteHeader } from "@/components/site-header";
import { Spinner } from "@/components/ui/spinner";

// Split out so the hook is read inside the provider it depends on; `main` is the
// positioning context that scopes the overlay to the content (header stays
// interactive because it lives outside `main`).
function AppMain({ children }: { children: React.ReactNode }) {
  const { isPending } = useNavTransition();
  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div
        aria-hidden={isPending || undefined}
        className={isPending ? "pointer-events-none" : undefined}
      >
        {children}
      </div>
      {isPending ? (
        <div
          data-testid="nav-overlay"
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/60"
        >
          <Spinner className="h-8 w-8" />
        </div>
      ) : null}
    </main>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NavTransitionProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <AppMain>{children}</AppMain>
      </div>
    </NavTransitionProvider>
  );
}
