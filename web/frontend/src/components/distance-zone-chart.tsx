"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";

import { ChartTooltip } from "@/components/chart-tooltip";
import { distanceZoneDistribution } from "@/lib/aggregate";
import type { Activity } from "@/lib/types";

// One fixed colour per distance zone, shortest → longest.
const ZONE_COLORS = [
  "hsl(199 89% 48%)",
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(48 96% 53%)",
  "hsl(38 92% 50%)",
  "hsl(0 72% 51%)",
];

// Chart body only (no Card frame) — the panel owns the Card/header. Renders the
// distribution of the given activities across fixed distance buckets as a donut,
// one slice per zone sized by its activity count. Activities without a positive
// distance are dropped upstream in `distanceZoneDistribution`. The built-in
// recharts <Legend> and on-slice <label> callouts are replaced by a custom DOM
// legend and a centred total, matching the PMC/weekly charts and avoiding the
// label collisions that crowd small slices.
export function DistanceZoneChart({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation();
  const zones = distanceZoneDistribution(activities);
  const data = zones
    .map((z) => ({
      ...z,
      label: t(`insights.distanceZones.${z.key}`),
      fill: ZONE_COLORS[zones.findIndex((x) => x.key === z.key)],
    }))
    .filter((z) => z.count > 0);

  if (data.length === 0) {
    return (
      <div
        className="flex h-72 w-full items-center justify-center text-sm text-muted-foreground"
        data-testid="distance-zone-empty"
      >
        {t("insights.distanceZonesEmpty")}
      </div>
    );
  }

  const total = data.reduce((sum, z) => sum + z.count, 0);

  return (
    <div
      className="flex h-72 w-full flex-col"
      data-testid="distance-zone-chart"
    >
      <div className="relative min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="85%"
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
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
            {t("insights.chartTotal")}
          </span>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {data.map((entry) => (
          <li key={entry.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-muted-foreground">{entry.label}</span>
            <span className="font-medium tabular-nums text-foreground">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
