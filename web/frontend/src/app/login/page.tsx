"use client";

import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { useLogin } from "@/lib/auth-queries";

export default function LoginPage() {
  const login = useLogin();

  return (
    <AuthForm
      title="Welcome back"
      description="Log in to your AthleteDNA account."
      submitLabel="Log in"
      pendingLabel="Logging in…"
      pending={login.isPending}
      onSubmit={({ email, password }) => login.mutateAsync({ email, password })}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium underline">
            Create one
          </Link>
        </>
      }
    />
  );
}
