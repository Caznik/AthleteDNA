"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdateUsername } from "@/lib/auth-queries";

const MAX_USERNAME_LENGTH = 15;

export function ProfileUsernameForm({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(currentUsername);
  const update = useUpdateUsername();

  const trimmed = username.trim();
  const unchanged = trimmed === currentUsername;
  const canSave = trimmed.length > 0 && !unchanged && !update.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    try {
      await update.mutateAsync(trimmed);
    } catch {
      // Errors surface as toasts from the mutation hook.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.username.title")}</CardTitle>
        <CardDescription>{t("profile.username.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              {t("profile.username.label")}
            </label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              maxLength={MAX_USERNAME_LENGTH}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("profile.username.placeholder", {
                max: MAX_USERNAME_LENGTH,
              })}
            />
          </div>
          <Button type="submit" disabled={!canSave}>
            {update.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
