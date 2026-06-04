"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AuthUser,
  ChangePasswordPayload,
  Credentials,
  RegisterCredentials,
} from "./types";

export const authUserKey = ["auth", "me"] as const;

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
    throw new Error(
      ("error" in data && data.error) || "Something went wrong. Try again.",
    );
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
      toast.error(error.message);
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
      toast.error(error.message);
    },
  });
}

// Shared sender for the authenticated profile mutations. The BFF carries the
// human-readable reason in the `error` field on failure.
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
        "Something went wrong. Try again.",
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
      toast.success("Username updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Uploads a new profile photo. Sends multipart FormData (no JSON Content-Type) to
// the BFF, which relays the backend's 400 message on invalid type/size. On success
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
            "Could not upload photo. Try again.",
        );
      }
      return data as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
      queryClient.invalidateQueries({ queryKey: authUserKey });
      toast.success("Photo updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
            "Could not remove photo. Try again.",
        );
      }
      return data as AuthUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authUserKey, user);
      queryClient.invalidateQueries({ queryKey: authUserKey });
      toast.success("Photo removed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      sendJson<void>("/api/auth/me/password", "PUT", payload),
    onSuccess: () => {
      toast.success("Password changed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
