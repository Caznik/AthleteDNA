"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { AuthUser } from "@/lib/types";

const MAX_USERNAME_LENGTH = 15;

export interface AuthFormValues {
  email: string;
  password: string;
  // Present only when the form collects a username (registration).
  username?: string;
}

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  pending: boolean;
  // Show the username field and use new-password semantics (registration).
  showUsername?: boolean;
  onSubmit: (values: AuthFormValues) => Promise<AuthUser>;
  footer: React.ReactNode;
}

export function AuthForm({
  title,
  description,
  submitLabel,
  pendingLabel,
  pending,
  showUsername = false,
  onSubmit,
  footer,
}: AuthFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onSubmit({
        email,
        password,
        username: showUsername ? username : undefined,
      });
      // Land on the dashboard; the mutation already primed the session cache.
      router.push("/");
    } catch {
      // Errors surface as toasts from the mutation hook.
    }
  };

  return (
    // Fill main's content box (viewport minus its py-8) and center the card on
    // both axes. The site header is hidden on the auth routes.
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {showUsername && (
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium">
                  {t("auth.form.username")}
                </label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  maxLength={MAX_USERNAME_LENGTH}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("auth.form.usernamePlaceholder", {
                    max: MAX_USERNAME_LENGTH,
                  })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                {t("auth.form.email")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.form.emailPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                {t("auth.form.password")}
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={showUsername ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.form.passwordPlaceholder", { min: 8 })}
              />
            </div>
            <Button type="submit" className="w-full" loading={pending}>
              {pending ? pendingLabel : submitLabel}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export { Link };
