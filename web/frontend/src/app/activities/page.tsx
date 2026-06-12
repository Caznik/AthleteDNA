"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { ActivitiesTable } from "@/components/activities-table";
import { ConnectStravaButton } from "@/components/connect-strava-button";
import { EmptyState } from "@/components/empty-state";
import { SyncButton } from "@/components/sync-button";
import {
  useActivitiesPage,
  useActivityTypes,
  useStravaStatus,
} from "@/lib/queries";

const PAGE_SIZE = 25;
const ALL = "All";

export default function ActivitiesPage() {
  const { t } = useTranslation();
  const status = useStravaStatus();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>(ALL);

  const activities = useActivitiesPage({
    page,
    size: PAGE_SIZE,
    type: typeFilter === ALL ? null : typeFilter,
  });
  const types = useActivityTypes();

  // Changing the filter changes the result set, so start back at the first page.
  function selectType(t: string) {
    setTypeFilter(t);
    setPage(0);
  }

  if (status.isLoading || activities.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (status.data && !status.data.linked) {
    return (
      <EmptyState
        title={t("activities.connectTitle")}
        description={t("activities.connectDescription")}
        action={<ConnectStravaButton />}
      />
    );
  }

  if (activities.isError) {
    return (
      <EmptyState
        title={t("activities.loadErrorTitle")}
        description={t("activities.loadErrorDescription")}
        action={<SyncButton />}
      />
    );
  }

  const data = activities.data;

  // Genuinely empty (not just a filter that matched nothing) → guide to sync.
  if (data && data.total === 0 && typeFilter === ALL) {
    return (
      <EmptyState
        title={t("activities.emptyTitle")}
        description={t("activities.emptyDescription")}
        action={<SyncButton />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("activities.title")}</h1>
        <SyncButton />
      </div>
      <ActivitiesTable
        rows={data?.items ?? []}
        types={[ALL, ...(types.data ?? [])]}
        allValue={ALL}
        typeFilter={typeFilter}
        onTypeChange={selectType}
        page={page}
        size={PAGE_SIZE}
        total={data?.total ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
