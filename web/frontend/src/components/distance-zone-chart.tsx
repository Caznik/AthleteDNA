"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";

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
// distance are dropped upstream in `distanceZoneDistribution`.
export function DistanceZoneChart({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation();
  const zones = distanceZoneDistribution(activities);
  const data = zones
    .map((z) => ({ ...z, label: t(`insights.distanceZones.${z.key}`) }))
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

  return (
    <div className="h-72 w-full" data-testid="distance-zone-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            label={(entry) => `${entry.label}: ${entry.count}`}
          >
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={ZONE_COLORS[zones.findIndex((z) => z.key === entry.key)]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
