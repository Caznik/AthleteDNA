"use client";

import { useTranslation } from "react-i18next";

import { MetricInfo } from "@/components/metric-info";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { summarize } from "@/lib/aggregate";
import {
  formatDistanceKm,
  formatDuration,
  formatHr,
  formatTrainingLoad,
} from "@/lib/format";
import type { InsightMetricId } from "@/lib/insight-copy";
import type { Activity } from "@/lib/types";

// Fixed-window training summary (matches the "Resumen del Entrenamiento" tile on
// COROS): totals over the supplied, already date-filtered activities. The caller
// owns the window; this component only aggregates and formats. `totalLoad` is the
// engine-normalized load for the same window, passed in (not summed from the raw
// per-activity training load) so it reads on the page's TSS-like load scale.
export function TrainingSummaryCards({
  activities,
  totalLoad,
}: {
  activities: Activity[];
  totalLoad: number;
}) {
  const { t } = useTranslation();
  const totals = summarize(activities);

  const cards: {
    key: string;
    label: string;
    value: string;
    metricId?: InsightMetricId;
  }[] = [
    { key: "sessions", label: t("summary.totalActivities"), value: String(totals.count) },
    {
      key: "distance",
      label: t("summary.totalDistance"),
      value: formatDistanceKm(totals.totalDistanceMeters),
    },
    {
      key: "time",
      label: t("summary.totalTime"),
      value: formatDuration(totals.totalDurationSeconds),
    },
    { key: "avgHr", label: t("summary.averageHr"), value: formatHr(totals.avgHr) },
    {
      key: "load",
      label: t("summary.totalLoad"),
      value: formatTrainingLoad(totalLoad),
      metricId: "totalLoad",
    },
  ];

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      data-testid="training-summary-cards"
    >
      {cards.map((c) => (
        <Card key={c.key} data-testid="training-summary-card">
          <CardHeader className="pb-2">
            <span className="flex items-center gap-1.5">
              <CardDescription>{c.label}</CardDescription>
              {c.metricId ? <MetricInfo id={c.metricId} /> : null}
            </span>
            <CardTitle className="text-2xl">{c.value}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
