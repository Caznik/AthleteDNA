"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";

import { ChartTooltip } from "@/components/chart-tooltip";
import { countsByType } from "@/lib/aggregate";
import type { Activity } from "@/lib/types";

// Distinct slice colours, cycled if there are more types than entries.
const SLICE_COLORS = [
  "hsl(var(--primary))",
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 51%)",
  "hsl(199 89% 48%)",
  "hsl(48 96% 53%)",
];

// Chart body only (no Card frame) — the panel owns the Card/header. Renders the
// distribution of the given (already filtered) activities by type as a donut,
// one slice per type sized by its activity count. The built-in recharts <Legend>
// and on-slice <label> callouts are replaced by a custom DOM legend and a centred
// total, matching the PMC/weekly/distance charts.
export function ActivityTypeChart({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation();
  const counts = countsByType(activities);

  if (counts.length === 0) {
    return (
      <div
        className="flex h-72 w-full items-center justify-center text-sm text-muted-foreground"
        data-testid="activity-type-empty"
      >
        {t("activities.typeChartEmpty")}
      </div>
    );
  }

  const data = counts.map((entry, i) => ({
    ...entry,
    fill: SLICE_COLORS[i % SLICE_COLORS.length],
  }));
  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div
      className="flex h-72 w-full flex-col"
      data-testid="activity-type-chart"
    >
      <div className="relative min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.type} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatValue={(v) => String(v)} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Centred total, overlaid on the donut hole. pointer-events-none so it
            never intercepts hover from the slices beneath. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {total}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("activities.chartTotal")}
          </span>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {data.map((entry) => (
          <li key={entry.type} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-muted-foreground">{entry.type}</span>
            <span className="font-medium tabular-nums text-foreground">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
