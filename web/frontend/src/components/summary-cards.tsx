"use client";

import { useTranslation } from "react-i18next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { summarize } from "@/lib/aggregate";
import { formatDistanceKm, formatDuration, formatHr } from "@/lib/format";
import type { Activity } from "@/lib/types";

export function SummaryCards({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation();
  const totals = summarize(activities);

  const cards = [
    { key: "totalActivities", label: t("summary.totalActivities"), value: String(totals.count) },
    {
      key: "totalDistance",
      label: t("summary.totalDistance"),
      value: formatDistanceKm(totals.totalDistanceMeters),
    },
    {
      key: "totalTime",
      label: t("summary.totalTime"),
      value: formatDuration(totals.totalDurationSeconds),
    },
    { key: "averageHr", label: t("summary.averageHr"), value: formatHr(totals.avgHr) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.key} data-testid="summary-card">
          <CardHeader className="pb-2">
            <CardDescription>{c.label}</CardDescription>
            <CardTitle className="text-2xl">{c.value}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
