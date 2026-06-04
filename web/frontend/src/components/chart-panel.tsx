"use client";

import { useId } from "react";

import { ActivityTypeChart } from "@/components/activity-type-chart";
import { TrainingLoadChart } from "@/components/training-load-chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { Activity } from "@/lib/types";

type ChartKey = "distribution" | "training-load";

const OPTIONS: { value: ChartKey; label: string; title: string }[] = [
  {
    value: "distribution",
    label: "Activities distribution",
    title: "Activities distribution",
  },
  {
    value: "training-load",
    label: "Training load (last 12 weeks)",
    title: "Weekly training load (last 12 weeks)",
  },
];

// Dashboard chart panel: owns the Card frame, a dynamic title, and a selector
// that swaps between the available chart bodies. Selection persists to
// localStorage and defaults to the activities-distribution pie. The distribution
// pie renders the dashboard-filtered list (`filtered`); the Training Load chart
// renders the full unfiltered list (`all`) since it keeps its own 12-week window.
export function ChartPanel({
  filtered,
  all,
}: {
  filtered: Activity[];
  all: Activity[];
}) {
  const [selected, setSelected] = usePersistedState<ChartKey>(
    "dashboard.chart",
    "distribution",
  );
  const selectId = useId();

  const active = OPTIONS.find((o) => o.value === selected) ?? OPTIONS[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{active.title}</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="sr-only">
            Chart
          </label>
          <select
            id={selectId}
            aria-label="Chart"
            value={selected}
            onChange={(e) => setSelected(e.target.value as ChartKey)}
            className="rounded-md border bg-background px-2 py-1 text-sm text-foreground shadow-sm"
          >
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {selected === "training-load" ? (
          <TrainingLoadChart activities={all} />
        ) : (
          <ActivityTypeChart activities={filtered} />
        )}
      </CardContent>
    </Card>
  );
}
