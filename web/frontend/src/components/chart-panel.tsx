"use client";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTypeChart activities={filtered} />
      </CardContent>
    </Card>
  );
}
