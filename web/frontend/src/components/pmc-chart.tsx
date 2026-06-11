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

import { MetricInfo } from "@/components/metric-info";
import { round2 } from "@/lib/format";
import type { InsightMetricId } from "@/lib/insight-copy";
import type { InsightSeriesPoint } from "@/lib/types";

// Performance Management Chart: CTL (fitness) and ATL (fatigue) share the left
// axis; TSB (form) sits on a secondary right axis since it is centered near 0 and
// on a different scale. Colours come from CSS variables so the chart honours the
// active theme (matches training-load-chart / activity-type-chart). `metricId`
// keys each series to its shared explanation in INSIGHT_COPY.
const SERIES: {
  key: string;
  label: string;
  color: string;
  axis: string;
  metricId: InsightMetricId;
}[] = [
  { key: "ctl", label: "CTL (Fitness)", color: "hsl(var(--primary))", axis: "left", metricId: "ctl" },
  { key: "atl", label: "ATL (Fatigue)", color: "hsl(38 92% 50%)", axis: "left", metricId: "atl" },
  { key: "tsb", label: "TSB (Form)", color: "hsl(142 71% 45%)", axis: "tsb", metricId: "tsb" },
];

// recharts requires every Line's yAxisId to resolve to an explicit YAxis id once a
// second axis exists — the implicit default no longer matches. Both axes carry ids.

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
            <MetricInfo id={s.metricId} />
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={series}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} />
          <YAxis
            yAxisId="left"
            fontSize={12}
            tickLine={false}
            width={48}
            tickFormatter={round2}
          />
          <YAxis
            yAxisId="tsb"
            orientation="right"
            fontSize={12}
            tickLine={false}
            width={48}
            tickFormatter={round2}
          />
          <Tooltip formatter={(value) => round2(value as number)} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              yAxisId={s.axis}
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
