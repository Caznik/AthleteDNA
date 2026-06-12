"use client";

import { useTranslation } from "react-i18next";

import { CurrentFormCards } from "@/components/current-form-cards";
import { DistanceZoneChart } from "@/components/distance-zone-chart";
import { EmptyState } from "@/components/empty-state";
import { MetricInfo } from "@/components/metric-info";
import { PersonalRecordsTable } from "@/components/personal-records-table";
import { PmcChart } from "@/components/pmc-chart";
import { TrainingStatusCard } from "@/components/training-status-card";
import { TrainingSummaryCards } from "@/components/training-summary-cards";
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
import {
  filterSeriesWithinDays,
  filterWeeklyWithinDays,
  filterWithinDays,
  sumSeriesLoad,
} from "@/lib/aggregate";
import { useActivities, useTrainingInsights } from "@/lib/queries";
import { usePersistedState } from "@/lib/use-persisted-state";

// The training summary mirrors COROS's fixed 4-week window.
const SUMMARY_WINDOW_DAYS = 28;

// The BFF passes the engine's 503 (engine unavailable) straight through; getJson
// folds the status into the thrown Error's message, so we match it there.
function is503(error: unknown): boolean {
  return error instanceof Error && error.message.includes("(503)");
}

export default function InsightsPage() {
  const { t } = useTranslation();
  const insights = useTrainingInsights();
  // Raw activities power the date-windowed summary and distance-zone tiles, which
  // need per-activity distance/load the insights payload doesn't carry. They are
  // supplementary: the page still gates on the insights query, and the activity
  // tiles fall back to their own empty states until this resolves.
  const activitiesQuery = useActivities();
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
          title={t("insights.unavailableTitle")}
          description={t("insights.unavailableDescription")}
          action={
            <Button
              onClick={() => insights.refetch()}
              loading={insights.isFetching}
            >
              {insights.isFetching ? t("common.refreshing") : t("common.refresh")}
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        title={t("insights.loadErrorTitle")}
        description={t("insights.loadErrorDescription")}
        action={
          <Button
            onClick={() => insights.refetch()}
            loading={insights.isFetching}
          >
            {insights.isFetching ? t("common.refreshing") : t("common.refresh")}
          </Button>
        }
      />
    );
  }

  const data = insights.data;

  if (!data || data.pmc.series.length === 0) {
    return (
      <EmptyState
        title={t("insights.emptyTitle")}
        description={t("insights.emptyDescription")}
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

  const activities = activitiesQuery.data ?? [];
  const summaryActivities = filterWithinDays(activities, SUMMARY_WINDOW_DAYS);
  // Total load on the engine's normalized scale (same as the weekly-load chart),
  // summed over the 4-week window — not the raw per-activity duration×HR.
  const summaryLoad = sumSeriesLoad(
    filterSeriesWithinDays(data.pmc.series, SUMMARY_WINDOW_DAYS),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("insights.title")}</h1>
        <Button
          variant="outline"
          onClick={() => insights.refetch()}
          loading={insights.isFetching}
        >
          {insights.isFetching ? t("common.refreshing") : t("common.refresh")}
        </Button>
      </div>

      <TrainingStatusCard current={data.pmc.current} trends={data.trends} />

      <CurrentFormCards current={data.pmc.current} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("insights.summaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingSummaryCards
            activities={summaryActivities}
            totalLoad={summaryLoad}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <span className="flex items-center gap-1.5">
            <CardTitle>{t("insights.pmcTitle")}</CardTitle>
            <MetricInfo id="pmc" />
          </span>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-4 text-sm text-muted-foreground"
              data-testid="trends-readout"
            >
              <span className="flex items-center gap-1.5">
                {t("insights.ctlRamp", {
                  value: data.trends.ctlRampPerWeek.toFixed(1),
                })}
                <MetricInfo id="ctlRamp" />
              </span>
              <span className="flex items-center gap-1.5">
                {t("insights.formTrend", {
                  direction: t(`insights.direction.${data.trends.tsbDirection}`, {
                    defaultValue: data.trends.tsbDirection,
                  }),
                })}
                <MetricInfo id="formDirection" />
              </span>
            </div>
            <RangeSelect
              value={pmcRange}
              onChange={setPmcRange}
              label={t("insights.pmcRangeLabel")}
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
            <CardTitle>{t("insights.weeklyLoadTitle")}</CardTitle>
            <MetricInfo id="weeklyLoad" />
          </span>
          <RangeSelect
            value={weeklyRange}
            onChange={setWeeklyRange}
            label={t("insights.weeklyRangeLabel")}
            options={WEEKLY_RANGE_OPTIONS}
          />
        </CardHeader>
        <CardContent>
          <WeeklyLoadChart data={visibleWeeklyLoad} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <span className="flex items-center gap-1.5">
            <CardTitle>{t("insights.distanceZonesTitle")}</CardTitle>
            <MetricInfo id="distanceZones" />
          </span>
        </CardHeader>
        <CardContent>
          <DistanceZoneChart activities={activities} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("insights.prTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalRecordsTable records={data.prs} />
        </CardContent>
      </Card>
    </div>
  );
}
