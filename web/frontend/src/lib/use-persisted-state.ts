"use client";

import { useEffect, useState } from "react";

// SSR-safe persisted state. Initializes with `defaultValue` so the server and
// the first client render agree (avoids hydration mismatch), then hydrates from
// localStorage in an effect, and writes back on every change.
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        setValue(JSON.parse(raw) as T);
      } catch {
        // Ignore malformed stored values and keep the default.
      }
    }
    // Only read on mount / when the key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
