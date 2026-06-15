"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ActivityTypeChart } from "@/components/activity-type-chart";
import { ConnectStravaButton } from "@/components/connect-strava-button";
import { CurrentFormCards } from "@/components/current-form-cards";
import { DistanceZoneChart } from "@/components/distance-zone-chart";
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
import { TrainingStatusCard } from "@/components/training-status-card";
import { TrainingSummaryCards } from "@/components/training-summary-cards";
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
import {
  useActivities,
  useStravaStatus,
  useTrainingInsights,
} from "@/lib/queries";
import { usePersistedState } from "@/lib/use-persisted-state";

// The BFF passes the engine's 503 (engine unavailable) straight through; getJson
// folds the status into the thrown Error's message, so we match it there.
function is503(error: unknown): boolean {
  return error instanceof Error && error.message.includes("(503)");
}

// Inline notice for the engine-powered region. The page itself is gated on the
// Strava activities query, so a flaky/unavailable insights engine degrades only
// this band — the summary and distribution sections (pure activity data) stay up.
function InsightsBanner({
  title,
  description,
  onRetry,
  fetching,
}: {
  title: string;
  description: string;
  onRetry: () => void;
  fetching: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card data-testid="insights-banner">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button variant="outline" onClick={onRetry} loading={fetching}>
          {fetching ? t("common.refreshing") : t("common.refresh")}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const status = useStravaStatus();
  const activitiesQuery = useActivities();
  const insights = useTrainingInsights();

  // Global range drives the summary totals and the distribution donuts. The PMC
  // and weekly-load charts keep their own independent, persisted windows.
  const [range, setRange] = usePersistedState<RangeKey>(
    "dashboard.range",
    "30d",
  );
  const [pmcRange, setPmcRange] = usePersistedState<RangeKey>(
    "insights.pmcRange",
    "30d",
  );
  const [weeklyRange, setWeeklyRange] = usePersistedState<RangeKey>(
    "insights.weeklyRange",
    "1m",
  );

  if (status.isLoading || activitiesQuery.isLoading) {
    return (
      <div className="space-y-4" data-testid="dashboard-skeleton">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
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

  // Syncing and importing live on the Activities page now, so dashboard dead-ends
  // send the user there rather than offering a redundant sync control here.
  const goToActivities = (
    <Button asChild variant="outline">
      <Link href="/activities">{t("dashboard.goToActivities")}</Link>
    </Button>
  );

  if (activitiesQuery.isError) {
    return (
      <EmptyState
        title={t("dashboard.loadErrorTitle")}
        description={t("dashboard.loadErrorDescription")}
        action={goToActivities}
      />
    );
  }

  const activities = activitiesQuery.data ?? [];

  if (activities.length === 0) {
    return (
      <EmptyState
        title={t("dashboard.emptyTitle")}
        description={t("dashboard.emptyDescription")}
        action={goToActivities}
      />
    );
  }

  const days = rangeDays(range);
  const rangedActivities = filterWithinDays(activities, days);

  const data = insights.data;
  const hasInsights = !!data && data.pmc.series.length > 0;

  // Total load on the engine's normalized scale, summed over the active window —
  // not the raw per-activity duration×HR. NaN (→ "—") until the engine resolves.
  const summaryLoad = hasInsights
    ? sumSeriesLoad(filterSeriesWithinDays(data.pmc.series, days))
    : NaN;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
        <RangeSelect
          value={range}
          onChange={setRange}
          label={t("dashboard.timeRange")}
        />
      </div>

      {/* Engine-powered hero: training status + current form. Degrades to a
          loading skeleton or an inline retry banner without blanking the page. */}
      {insights.isError ? (
        <InsightsBanner
          title={
            is503(insights.error)
              ? t("insights.unavailableTitle")
              : t("insights.loadErrorTitle")
          }
          description={
            is503(insights.error)
              ? t("insights.unavailableDescription")
              : t("insights.loadErrorDescription")
          }
          onRetry={() => insights.refetch()}
          fetching={insights.isFetching}
        />
      ) : insights.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-24" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      ) : hasInsights ? (
        <>
          <TrainingStatusCard current={data.pmc.current} trends={data.trends} />
          <CurrentFormCards current={data.pmc.current} />
        </>
      ) : (
        <InsightsBanner
          title={t("insights.emptyTitle")}
          description={t("insights.emptyDescription")}
          onRetry={() => insights.refetch()}
          fetching={insights.isFetching}
        />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("insights.summaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingSummaryCards
            activities={rangedActivities}
            totalLoad={summaryLoad}
          />
        </CardContent>
      </Card>

      {/* Engine-powered charts: only when the insights payload is present. The
          banner above already covers the loading/error/empty cases. */}
      {hasInsights ? (
        <>
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
                      direction: t(
                        `insights.direction.${data.trends.tsbDirection}`,
                        { defaultValue: data.trends.tsbDirection },
                      ),
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
              <PmcChart
                series={filterSeriesWithinDays(
                  data.pmc.series,
                  rangeDays(pmcRange),
                )}
              />
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
              <WeeklyLoadChart
                data={filterWeeklyWithinDays(
                  data.weeklyLoad,
                  rangeDays(weeklyRange),
                )}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Distribution donuts (pure activity data): activity type + distance zone,
          side by side, both windowed by the global range. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.distribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTypeChart activities={rangedActivities} />
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
            <DistanceZoneChart activities={rangedActivities} />
          </CardContent>
        </Card>
      </div>

      {hasInsights ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("insights.prTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonalRecordsTable records={data.prs} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
