"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import i18n from "@/lib/i18n";
import type {
  AuthUser,
  ChangePasswordPayload,
  Credentials,
  LanguagePreference,
  RegisterCredentials,
  ThemePreference,
} from "./types";

export const authUserKey = ["auth", "me"] as const;

// The BFF relays the backend's stable error CODE (e.g. "username_already_taken")
// in the `error` field. We map it to localized copy here so a Spanish user sees
// Spanish (AC-10); an unknown/absent code falls back to a generic translated
// message. Lives outside render and reads the i18n singleton, so it always uses
// the currently-applied language even when fired from an imperative onError.
function localizedError(code: string | undefined): string {
  const key = code ? `errors.${code}` : "errors.generic";
  return i18n.t(key, { defaultValue: i18n.t("errors.generic") });
}

function toastError(code: string | undefined) {
  toast.error(localizedError(code));
}

async function postCredentials(
  path: string,
  credentials: Credentials | RegisterCredentials,
): Promise<AuthUser> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = (await res.json().catch(() => ({}))) as
    | AuthUser
    | { error?: string };
  if (!res.ok) {
    // The thrown message is the backend error CODE; onError localizes it.
    throw new Error(("error" in data && data.error) || "generic");
  }
  return data as AuthUser;
}

// Current session. `null` when unauthenticated (the /api/auth/me 401 path).
export function useCurrentUser() {
  return useQuery({
    queryKey: authUserKey,
    queryFn: async (): Promise<AuthUser | null> => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Could not load session");
      return (await res.json()) as AuthUser;
    },
    staleTime: 60_000,
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      postCredentials("/api/auth/register", credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: Credentials) =>
      postCredentials("/api/auth/login", credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

// Shared sender for the authenticated profile mutations. The BFF carries the
// backend error CODE in the `error` field on failure; onError localizes it.
async function sendJson<T>(
  path: string,
  method: "PATCH" | "PUT",
  payload: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as
    | T
    | { error?: string };
  if (!res.ok) {
    throw new Error(
      (typeof data === "object" && data && "error" in data && data.error) ||
        "generic",
    );
  }
  return data as T;
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      sendJson<AuthUser>("/api/auth/me", "PATCH", { username }),
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
      toast.success(i18n.t("profile.username.updated"));
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

// Persists the chosen theme to the backend. The local switch happens instantly via
// next-themes in the component; this only mirrors it cross-device. On success the
// returned user (with its themePreference) replaces the cache; on failure a toast
// surfaces without reverting the local switch (AC-7).
export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (theme: ThemePreference) =>
      sendJson<AuthUser>("/api/auth/me/theme", "PUT", { theme }),
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

// Persists the chosen language to the backend. The local switch happens instantly
// via i18n.changeLanguage in the component; this only mirrors it cross-device. On
// failure a toast surfaces without reverting the local switch (AC-7).
export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: LanguagePreference) =>
      sendJson<AuthUser>("/api/auth/me/language", "PUT", { language }),
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

// Uploads a new profile photo. Sends multipart FormData (no JSON Content-Type) to
// the BFF, which relays the backend's 400 code on invalid type/size. On success
// writes the returned user into the cache AND invalidates it so the nav avatar
// re-reads the new photoUpdatedAt without a page reload.
export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<AuthUser> => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/auth/me/photo", { method: "PUT", body });
      const data = (await res.json().catch(() => ({}))) as
        | AuthUser
        | { error?: string };
      if (!res.ok) {
        throw new Error(
          (typeof data === "object" && data && "error" in data && data.error) ||
            "generic",
        );
      }
      return data as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
      queryClient.invalidateQueries({ queryKey: authUserKey });
      toast.success(i18n.t("profile.photo.updated"));
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

export function useRemovePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<AuthUser> => {
      const res = await fetch("/api/auth/me/photo", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as
        | AuthUser
        | { error?: string };
      if (!res.ok) {
        throw new Error(
          (typeof data === "object" && data && "error" in data && data.error) ||
            "generic",
        );
      }
      return data as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
      queryClient.invalidateQueries({ queryKey: authUserKey });
      toast.success(i18n.t("profile.photo.removed"));
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      sendJson<void>("/api/auth/me/password", "PUT", payload),
    onSuccess: () => {
      toast.success(i18n.t("profile.password.changed"));
    },
    onError: (error: Error) => {
      toastError(error.message);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(authUserKey, null);
      queryClient.invalidateQueries({ queryKey: authUserKey });
    },
  });
}
