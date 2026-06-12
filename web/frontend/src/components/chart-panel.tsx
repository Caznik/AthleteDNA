"use client";

import { useTranslation } from "react-i18next";

import { ActivityTypeChart } from "@/components/activity-type-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Activity } from "@/lib/types";

// Dashboard chart panel: owns the Card frame and renders the activities-
// distribution pie for the dashboard-filtered list. The former chart selector
// (and the client-side training-load chart) was retired — weekly load now lives
// on /insights from engine data.
export function ChartPanel({ filtered }: { filtered: Activity[] }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.distribution")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTypeChart activities={filtered} />
      </CardContent>
    </Card>
  );
}
