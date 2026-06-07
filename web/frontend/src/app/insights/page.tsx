"use client";

import { useId } from "react";

import { CurrentFormCards } from "@/components/current-form-cards";
import { EmptyState } from "@/components/empty-state";
import { PersonalRecordsTable } from "@/components/personal-records-table";
import { PmcChart } from "@/components/pmc-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyLoadChart } from "@/components/weekly-load-chart";
import { filterSeriesWithinDays } from "@/lib/aggregate";
import { useTrainingInsights } from "@/lib/queries";
import { usePersistedState } from "@/lib/use-persisted-state";

type RangeKey = "7d" | "15d" | "30d" | "6m";

const RANGE_OPTIONS: { value: RangeKey; label: string; days: number }[] = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "15d", label: "15 days", days: 15 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "6m", label: "6 months", days: 180 },
];

// The BFF passes the engine's 503 (engine unavailable) straight through; getJson
// folds the status into the thrown Error's message, so we match it there.
function is503(error: unknown): boolean {
  return error instanceof Error && error.message.includes("(503)");
}

export default function InsightsPage() {
  const insights = useTrainingInsights();
  const [range, setRange] = usePersistedState<RangeKey>(
    "insights.range",
    "30d",
  );
  const rangeId = useId();

  if (insights.isLoading) {
    return (
      <div className="space-y-4" data-testid="insights-skeleton">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (insights.isError) {
    if (is503(insights.error)) {
      return (
        <EmptyState
          title="Insights temporarily unavailable"
          description="We couldn't compute your insights right now. Please try again in a moment."
          action={
            <Button
              onClick={() => insights.refetch()}
              disabled={insights.isFetching}
            >
              {insights.isFetching ? "Refreshing…" : "Refresh"}
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        title="Couldn't load your insights"
        description="The backend is unreachable right now. Try again in a moment."
        action={
          <Button
            onClick={() => insights.refetch()}
            disabled={insights.isFetching}
          >
            {insights.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />
    );
  }

  const data = insights.data;

  if (!data || data.pmc.series.length === 0) {
    return (
      <EmptyState
        title="No insights yet"
        description="Sync your training data to see your fitness, fatigue and form trends."
      />
    );
  }

  const activeRange =
    RANGE_OPTIONS.find((r) => r.value === range) ?? RANGE_OPTIONS[2];
  const visibleSeries = filterSeriesWithinDays(
    data.pmc.series,
    activeRange.days,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <div className="flex items-center gap-2">
          <label htmlFor={rangeId} className="sr-only">
            Time range
          </label>
          <select
            id={rangeId}
            aria-label="Time range"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="rounded-md border bg-background px-2 py-1 text-sm text-foreground shadow-sm"
          >
            {RANGE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => insights.refetch()}
            disabled={insights.isFetching}
          >
            {insights.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <CurrentFormCards current={data.pmc.current} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Performance management</CardTitle>
          <div
            className="flex gap-4 text-sm text-muted-foreground"
            data-testid="trends-readout"
          >
            <span>CTL ramp {data.trends.ctlRampPerWeek.toFixed(1)}/wk</span>
            <span>Form {data.trends.tsbDirection}</span>
          </div>
        </CardHeader>
        <CardContent>
          <PmcChart series={visibleSeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly training load</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyLoadChart data={data.weeklyLoad} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal records</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalRecordsTable records={data.prs} />
        </CardContent>
      </Card>
    </div>
  );
}
