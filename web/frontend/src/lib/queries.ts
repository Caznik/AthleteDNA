"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import i18n from "@/lib/i18n";

import type {
  Activity,
  ActivityPage,
  ConnectResponse,
  FitImportResponse,
  StatusResponse,
  SyncResponse,
  TrainingInsights,
} from "./types";

export const activitiesKey = ["activities"] as const;
export const activityTypesKey = ["activities", "types"] as const;
export const stravaStatusKey = ["strava", "status"] as const;
export const insightsKey = ["insights", "training"] as const;

// Key for one page of activities. Prefixed with activitiesKey so a sync that
// invalidates ["activities"] also refreshes every cached page.
export function activitiesPageKey(params: {
  page: number;
  size: number;
  type: string | null;
}) {
  return [...activitiesKey, "page", params] as const;
}

async function getJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`Request to ${input} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function useActivities() {
  return useQuery({
    queryKey: activitiesKey,
    queryFn: () => getJson<Activity[]>("/api/activities"),
  });
}

// One server-paged slice for the Activities table. `type: null` means all types.
// keepPreviousData keeps the current rows on screen while the next page loads,
// so paging doesn't flash a skeleton.
export function useActivitiesPage(params: {
  page: number;
  size: number;
  type: string | null;
}) {
  return useQuery({
    queryKey: activitiesPageKey(params),
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(params.page),
        size: String(params.size),
      });
      if (params.type) query.set("type", params.type);
      return getJson<ActivityPage>(`/api/activities/page?${query.toString()}`);
    },
    placeholderData: keepPreviousData,
  });
}

export function useActivityTypes() {
  return useQuery({
    queryKey: activityTypesKey,
    queryFn: () => getJson<string[]>("/api/activities/types"),
  });
}

// Engine-computed training insights from the BFF. getJson throws on any non-ok
// response, so a 503 (engine unavailable) surfaces as a query error rather than
// a thrown render — the /insights page branches on that.
export function useTrainingInsights() {
  return useQuery({
    queryKey: insightsKey,
    queryFn: () => getJson<TrainingInsights>("/api/insights/training"),
  });
}

// Uploads one or more .fit files to the BFF import endpoint. On success the new
// activities change the same data Strava sync does, so invalidate the same keys
// (activities pages, types filter, and engine insights) to pull them in.
export function useFitImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => {
      const body = new FormData();
      for (const file of files) {
        body.append("files", file);
      }
      return getJson<FitImportResponse>("/api/fit/import", {
        method: "POST",
        body,
      });
    },
    onSuccess: (data) => {
      toast.success(
        i18n.t("activities.fit.summary", {
          imported: data.imported,
          enriched: data.enriched,
          duplicates: data.duplicates,
          failed: data.failed,
        }),
      );
      queryClient.invalidateQueries({ queryKey: activitiesKey });
      queryClient.invalidateQueries({ queryKey: insightsKey });
    },
    onError: () => {
      toast.error(i18n.t("activities.fit.error"));
    },
  });
}

export function useStravaStatus() {
  return useQuery({
    queryKey: stravaStatusKey,
    queryFn: () => getJson<StatusResponse>("/api/strava/status"),
  });
}

export function useConnect() {
  return useMutation({
    mutationFn: () => getJson<ConnectResponse>("/api/strava/connect"),
    onError: () => {
      toast.error(i18n.t("strava.connectError"));
    },
  });
}

export function useSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      getJson<SyncResponse>("/api/strava/sync", { method: "POST" }),
    onSuccess: (data) => {
      toast.success(i18n.t("strava.syncSuccess", { n: data.synced }));
      queryClient.invalidateQueries({ queryKey: activitiesKey });
      queryClient.invalidateQueries({ queryKey: stravaStatusKey });
      // New activities change the engine's inputs, so the merged dashboard's
      // insights sections must recompute too.
      queryClient.invalidateQueries({ queryKey: insightsKey });
    },
    onError: () => {
      toast.error(i18n.t("strava.syncError"));
    },
  });
}
