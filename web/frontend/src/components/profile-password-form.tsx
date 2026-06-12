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
import { useChangePassword } from "@/lib/auth-queries";

const MIN_PASSWORD_LENGTH = 8;

export function ProfilePasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const change = useChangePassword();

  const newTooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSave =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    confirmPassword === newPassword &&
    !change.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    try {
      await change.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // Errors surface as toasts from the mutation hook.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("profile.password.title")}</CardTitle>
        <CardDescription>{t("profile.password.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-sm font-medium">
              {t("profile.password.current")}
            </label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-sm font-medium">
              {t("profile.password.new")}
            </label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("profile.password.newPlaceholder", {
                min: MIN_PASSWORD_LENGTH,
              })}
            />
            {newTooShort && (
              <p className="text-sm text-destructive">
                {t("profile.password.tooShort", { min: MIN_PASSWORD_LENGTH })}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              {t("profile.password.confirm")}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {mismatch && (
              <p className="text-sm text-destructive">
                {t("profile.password.mismatch")}
              </p>
            )}
          </div>
          <Button type="submit" disabled={!canSave}>
            {change.isPending ? t("common.saving") : t("profile.password.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
