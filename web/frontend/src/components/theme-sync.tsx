"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { useCurrentUser } from "@/lib/auth-queries";

// Applies the signed-in user's backend-stored theme app-wide (not just on the
// Profile page), so the preference is restored on login and on a fresh device —
// next-themes alone only restores this browser's localStorage value (AC-3).
//
// Keyed only on the stored preference: it runs on load and after a successful
// save (which returns the same value, so the re-apply is idempotent) and never
// clobbers an in-session switch. While logged out (undefined) it leaves the
// current theme untouched.
export function ThemeSync() {
  const { data: user } = useCurrentUser();
  const { setTheme } = useTheme();
  const preference = user?.themePreference;

  useEffect(() => {
    if (preference) setTheme(preference);
  }, [preference, setTheme]);

  return null;
}
