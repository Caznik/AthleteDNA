"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { useCurrentUser } from "@/lib/auth-queries";

// Applies the signed-in user's backend-stored theme app-wide (not just on the
// Profile page), so the preference is restored on login and on a fresh device —
// next-themes alone only restores this browser's localStorage value (AC-3).
//
// It only acts on a genuine divergence (the stored value differs from what is
// currently applied): on load / login / cross-device. It must NOT re-apply the
// value the user just picked locally — after a local switch the mutation writes
// the same value back into the query cache, and re-running setTheme then causes
// a visible re-flip ("blink"). We read the current theme through a ref so the
// effect keys only on the stored preference and never clobbers an in-session
// switch. While logged out (undefined) the current theme is left untouched.
export function ThemeSync() {
  const { data: user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const preference = user?.themePreference;

  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    if (preference && preference !== themeRef.current) {
      setTheme(preference);
    }
  }, [preference, setTheme]);

  return null;
}
