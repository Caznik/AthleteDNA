"use client";

import { useState } from "react";

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
        title="Connect your Strava account"
        description="Link Strava to see your activities here."
        action={<ConnectStravaButton />}
      />
    );
  }

  if (activities.isError) {
    return (
      <EmptyState
        title="Couldn't load your activities"
        description="The backend is unreachable right now. Try again in a moment."
        action={<SyncButton />}
      />
    );
  }

  const data = activities.data;

  // Genuinely empty (not just a filter that matched nothing) → guide to sync.
  if (data && data.total === 0 && typeFilter === ALL) {
    return (
      <EmptyState
        title="No activities yet"
        description="Sync to pull in your latest Strava activities."
        action={<SyncButton />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Activities</h1>
        <SyncButton />
      </div>
      <ActivitiesTable
        rows={data?.items ?? []}
        types={[ALL, ...(types.data ?? [])]}
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
