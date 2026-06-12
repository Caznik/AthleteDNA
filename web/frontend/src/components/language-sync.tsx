"use client";

import { useEffect, useRef } from "react";

import { useCurrentUser } from "@/lib/auth-queries";
import i18n from "@/lib/i18n";

// Applies the signed-in user's backend-stored language app-wide (not just on the
// Profile page), so the preference is restored on login and on a fresh device
// (AC-8). Mirrors <ThemeSync/>. Unauthenticated → no call, the UI stays on "en".
export function LanguageSync() {
  const { data: user } = useCurrentUser();
  const preference = user?.languagePreference;

  // Apply each stored value exactly ONCE, on the transition that introduces it.
  // While a profile language switch is in flight the React Query cache still holds
  // the PRE-change preference, so this effect can re-run with the stale value;
  // comparing against the last value we synced makes such a re-run a no-op and
  // prevents a one-frame flip back to the old language ("blink").
  const lastSynced = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (preference && preference !== lastSynced.current) {
      lastSynced.current = preference;
      void i18n.changeLanguage(preference);
    }
  }, [preference]);

  return null;
}
