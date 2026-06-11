"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

interface NavTransitionValue {
  // Undefined when no provider is mounted, so consumers fall back to native
  // navigation (e.g. a plain <Link>) instead of swallowing the click.
  navigate?: (href: string) => void;
  isPending: boolean;
}

const NavTransitionContext = createContext<NavTransitionValue>({
  navigate: undefined,
  isPending: false,
});

export function useNavTransition(): NavTransitionValue {
  return useContext(NavTransitionContext);
}

export function NavTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (href: string) => {
    // useTransition keeps isPending true until the destination segment has
    // rendered, which is exactly the window the overlay should be shown.
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <NavTransitionContext.Provider value={{ navigate, isPending }}>
      {children}
    </NavTransitionContext.Provider>
  );
}
