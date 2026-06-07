"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { useCurrentUser } from "@/lib/auth-queries";

// Applies the signed-in user's backend-stored theme app-wide (not just on the
// Profile page), so the preference is restored on login and on a fresh device —
// next-themes alone only restores this browser's localStorage value (AC-3).
export function ThemeSync() {
  const { data: user } = useCurrentUser();
  const { setTheme } = useTheme();
  const preference = user?.themePreference;

  // Apply each stored value exactly ONCE, on the transition that introduces it
  // (load / login / save / cross-device). next-themes recreates `setTheme` on
  // every theme change, so this effect re-runs mid-switch while the React Query
  // cache still holds the PRE-change preference; without this guard it would
  // re-apply that stale value on top of the user's just-made switch — a one-frame
  // flip to the opposite theme ("blink"). Comparing against the last value we
  // synced (not the current theme) makes such a stale re-run a no-op.
  const lastSynced = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (preference && preference !== lastSynced.current) {
      lastSynced.current = preference;
      setTheme(preference);
    }
  }, [preference, setTheme]);

  return null;
}
