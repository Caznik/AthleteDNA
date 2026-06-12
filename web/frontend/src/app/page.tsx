"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { ConnectStravaButton } from "@/components/connect-strava-button";
import { EmptyState } from "@/components/empty-state";
import { SummaryCards } from "@/components/summary-cards";
import { SyncButton } from "@/components/sync-button";
import { ChartPanel } from "@/components/chart-panel";
import { filterWithinDays } from "@/lib/aggregate";
import { useActivities, useStravaStatus } from "@/lib/queries";
import { usePersistedState } from "@/lib/use-persisted-state";

type RangeKey = "7d" | "30d" | "6m" | "1y";

const RANGE_OPTIONS: { value: RangeKey; days: number }[] = [
  { value: "7d", days: 7 },
  { value: "30d", days: 30 },
  { value: "6m", days: 180 },
  { value: "1y", days: 365 },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const status = useStravaStatus();
  const activities = useActivities();
  const [range, setRange] = usePersistedState<RangeKey>(
    "dashboard.range",
    "30d",
  );
  const rangeId = useId();

  if (status.isLoading || activities.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  // Not connected → guide to Connect (distinct from empty-but-connected).
  if (status.data && !status.data.linked) {
    return (
      <EmptyState
        title={t("dashboard.connectTitle")}
        description={t("dashboard.connectDescription")}
        action={<ConnectStravaButton />}
      />
    );
  }

  if (activities.isError) {
    return (
      <EmptyState
        title={t("dashboard.loadErrorTitle")}
        description={t("dashboard.loadErrorDescription")}
        action={<SyncButton />}
      />
    );
  }

  const data = activities.data ?? [];

  if (data.length === 0) {
    return (
      <EmptyState
        title={t("dashboard.emptyTitle")}
        description={t("dashboard.emptyDescription")}
        action={<SyncButton />}
      />
    );
  }

  const activeRange =
    RANGE_OPTIONS.find((r) => r.value === range) ?? RANGE_OPTIONS[1];
  const filtered = filterWithinDays(data, activeRange.days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <div className="flex items-center gap-2">
          <label htmlFor={rangeId} className="sr-only">
            {t("dashboard.timeRange")}
          </label>
          <select
            id={rangeId}
            aria-label={t("dashboard.timeRange")}
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="rounded-md border bg-background px-2 py-1 text-sm text-foreground shadow-sm"
          >
            {RANGE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {t(`ranges.${r.value}`)}
              </option>
            ))}
          </select>
          <SyncButton />
        </div>
      </div>
      <SummaryCards activities={filtered} />
      <ChartPanel filtered={filtered} />
    </div>
  );
}
