"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateLanguage } from "@/lib/auth-queries";
import i18n from "@/lib/i18n";
import type { AuthUser, LanguagePreference } from "@/lib/types";

const LANGUAGE_OPTIONS: { value: LanguagePreference; labelKey: string }[] = [
  { value: "en", labelKey: "profile.language.en" },
  { value: "es", labelKey: "profile.language.es" },
];

export function ProfileLanguageForm({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const update = useUpdateLanguage();

  // i18n.language is only meaningful after hydration; gate on a mounted flag so the
  // first client render matches the server (en) and avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount, fall back to the server-known value so the right option shows as
  // selected on first paint. Applying the preference app-wide lives in <LanguageSync/>.
  const active = mounted ? i18n.language : user.languagePreference;

  const handleSelect = (value: LanguagePreference) => {
    if (value === active) return;
    void i18n.changeLanguage(value); // instant local switch (AC-6)
    update.mutate(value); // persist cross-device (AC-6); errors toast (AC-7)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.language.title")}</CardTitle>
        <CardDescription>{t("profile.language.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="group"
          aria-label={t("profile.language.group")}
          className="inline-flex gap-2"
        >
          {LANGUAGE_OPTIONS.map((option) => {
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
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
