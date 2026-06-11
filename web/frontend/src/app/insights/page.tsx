"use client";

import { CurrentFormCards } from "@/components/current-form-cards";
import { EmptyState } from "@/components/empty-state";
import { MetricInfo } from "@/components/metric-info";
import { PersonalRecordsTable } from "@/components/personal-records-table";
import { PmcChart } from "@/components/pmc-chart";
import {
  RangeSelect,
  rangeDays,
  WEEKLY_RANGE_OPTIONS,
  type RangeKey,
} from "@/components/range-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WeeklyLoadChart } from "@/components/weekly-load-chart";
import { filterSeriesWithinDays, filterWeeklyWithinDays } from "@/lib/aggregate";
import { useTrainingInsights } from "@/lib/queries";
import { usePersistedState } from "@/lib/use-persisted-state";

// The BFF passes the engine's 503 (engine unavailable) straight through; getJson
// folds the status into the thrown Error's message, so we match it there.
function is503(error: unknown): boolean {
  return error instanceof Error && error.message.includes("(503)");
}

export default function InsightsPage() {
  const insights = useTrainingInsights();
  // Each chart owns its own range so they can be windowed independently.
  const [pmcRange, setPmcRange] = usePersistedState<RangeKey>(
    "insights.pmcRange",
    "30d",
  );
  const [weeklyRange, setWeeklyRange] = usePersistedState<RangeKey>(
    "insights.weeklyRange",
    "1m",
  );

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
              loading={insights.isFetching}
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
            loading={insights.isFetching}
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

  const visibleSeries = filterSeriesWithinDays(
    data.pmc.series,
    rangeDays(pmcRange),
  );
  const visibleWeeklyLoad = filterWeeklyWithinDays(
    data.weeklyLoad,
    rangeDays(weeklyRange),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <Button
          variant="outline"
          onClick={() => insights.refetch()}
          loading={insights.isFetching}
        >
          {insights.isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <CurrentFormCards current={data.pmc.current} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <span className="flex items-center gap-1.5">
            <CardTitle>Performance management</CardTitle>
            <MetricInfo id="pmc" />
          </span>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-4 text-sm text-muted-foreground"
              data-testid="trends-readout"
            >
              <span className="flex items-center gap-1.5">
                CTL ramp {data.trends.ctlRampPerWeek.toFixed(1)}/wk
                <MetricInfo id="ctlRamp" />
              </span>
              <span className="flex items-center gap-1.5">
                Form {data.trends.tsbDirection}
                <MetricInfo id="formDirection" />
              </span>
            </div>
            <RangeSelect
              value={pmcRange}
              onChange={setPmcRange}
              label="Performance management time range"
            />
          </div>
        </CardHeader>
        <CardContent>
          <PmcChart series={visibleSeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <span className="flex items-center gap-1.5">
            <CardTitle>Weekly training load</CardTitle>
            <MetricInfo id="weeklyLoad" />
          </span>
          <RangeSelect
            value={weeklyRange}
            onChange={setWeeklyRange}
            label="Weekly training load time range"
            options={WEEKLY_RANGE_OPTIONS}
          />
        </CardHeader>
        <CardContent>
          <WeeklyLoadChart data={visibleWeeklyLoad} />
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
