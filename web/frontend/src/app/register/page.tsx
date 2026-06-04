"use client";

import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { useRegister } from "@/lib/auth-queries";

export default function RegisterPage() {
  const register = useRegister();

  return (
    <AuthForm
      title="Create your account"
      description="Pick a username and sign up with your email and a password."
      submitLabel="Create account"
      pendingLabel="Creating account…"
      pending={register.isPending}
      showUsername
      onSubmit={({ email, username, password }) =>
        register.mutateAsync({ email, username: username ?? "", password })
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
            Log in
          </Link>
        </>
      }
    />
  );
}
