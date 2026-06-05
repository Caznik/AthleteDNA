"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateTheme } from "@/lib/auth-queries";
import type { AuthUser, ThemePreference } from "@/lib/types";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ProfileThemeForm({ user }: { user: AuthUser }) {
  // next-themes' `theme` is the *setting* (light/dark/system), which is what the
  // segmented control must reflect — not `resolvedTheme`, or System could never
  // show as selected.
  const { theme, setTheme } = useTheme();
  const update = useUpdateTheme();

  // `theme` is only meaningful after hydration; gate on a mounted flag so the
  // first client render matches the server and avoids a hydration mismatch (AC-4).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Applying the backend preference app-wide lives in <ThemeSync/> (rendered in
  // Providers); this component only renders the control.

  // Before mount, fall back to the server-known value so the right option shows
  // as selected on first paint instead of flashing an unselected control.
  const active = mounted ? theme : user.themePreference;

  const handleSelect = (value: ThemePreference) => {
    if (value === active) return;
    setTheme(value); // instant local switch (AC-2)
    update.mutate(value); // persist cross-device (AC-3); errors toast (AC-7)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Appearance</CardTitle>
        <CardDescription>
          Choose how AthleteDNA looks. System follows your device setting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div role="group" aria-label="Theme" className="inline-flex gap-2">
          {THEME_OPTIONS.map((option) => {
            const isActive = active === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSelect(option.value)}
                className={buttonVariants({
                  variant: isActive ? "default" : "outline",
                })}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
