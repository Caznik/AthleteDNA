"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { AuthForm } from "@/components/auth-form";
import { useLogin } from "@/lib/auth-queries";

export default function LoginPage() {
  const { t } = useTranslation();
  const login = useLogin();

  return (
    <AuthForm
      title={t("auth.login.title")}
      description={t("auth.login.description")}
      submitLabel={t("auth.login.submit")}
      pendingLabel={t("auth.login.pending")}
      pending={login.isPending}
      onSubmit={({ email, password }) => login.mutateAsync({ email, password })}
      footer={
        <>
          {t("auth.login.footerPrompt")}{" "}
          <Link href="/register" className="font-medium underline">
            {t("auth.login.footerAction")}
          </Link>
        </>
      }
    />
  );
}
