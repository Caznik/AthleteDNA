"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { AuthForm } from "@/components/auth-form";
import { useRegister } from "@/lib/auth-queries";

export default function RegisterPage() {
  const { t } = useTranslation();
  const register = useRegister();

  return (
    <AuthForm
      title={t("auth.register.title")}
      description={t("auth.register.description")}
      submitLabel={t("auth.register.submit")}
      pendingLabel={t("auth.register.pending")}
      pending={register.isPending}
      showUsername
      onSubmit={({ email, username, password }) =>
        register.mutateAsync({ email, username: username ?? "", password })
      }
      footer={
        <>
          {t("auth.register.footerPrompt")}{" "}
          <Link href="/login" className="font-medium underline">
            {t("auth.register.footerAction")}
          </Link>
        </>
      }
    />
  );
}
