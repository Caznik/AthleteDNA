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
// distribution of the given (already filtered) activities by type as a pie chart,
// one slice per type sized by its activity count.
export function ActivityTypeChart({ activities }: { activities: Activity[] }) {
  const { t } = useTranslation();
  const data = countsByType(activities);

  if (data.length === 0) {
    return (
      <div
        className="flex h-72 w-full items-center justify-center text-sm text-muted-foreground"
        data-testid="activity-type-empty"
      >
        {t("activities.typeChartEmpty")}
      </div>
    );
  }

  return (
    <div className="h-72 w-full" data-testid="activity-type-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius="80%"
            label={(entry) => `${entry.type}: ${entry.count}`}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.type}
                fill={SLICE_COLORS[i % SLICE_COLORS.length]}
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
