"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InsightSeriesPoint } from "@/lib/types";

// Performance Management Chart: CTL (fitness) and ATL (fatigue) share the left
// axis; TSB (form) sits on a secondary right axis since it is centered near 0 and
// on a different scale. Colours come from CSS variables so the chart honours the
// active theme (matches training-load-chart / activity-type-chart).
const SERIES = [
  { key: "ctl", label: "CTL (Fitness)", color: "hsl(var(--primary))", axis: "left" },
  { key: "atl", label: "ATL (Fatigue)", color: "hsl(38 92% 50%)", axis: "left" },
  { key: "tsb", label: "TSB (Form)", color: "hsl(142 71% 45%)", axis: "tsb" },
] as const;

export function PmcChart({ series }: { series: InsightSeriesPoint[] }) {
  return (
    <div className="h-80 w-full" data-testid="pmc-chart">
      {/* Controlled legend rendered in our own DOM: recharts' <Legend> does not
          paint under jsdom's 0×0 container, so this keeps the labels testable and
          deterministic regardless of chart layout. */}
      <ul className="mb-2 flex flex-wrap gap-4 text-xs" data-testid="pmc-legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} />
          <YAxis fontSize={12} tickLine={false} width={48} />
          <YAxis
            yAxisId="tsb"
            orientation="right"
            fontSize={12}
            tickLine={false}
            width={48}
          />
          <Tooltip />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              yAxisId={s.axis === "tsb" ? "tsb" : undefined}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
