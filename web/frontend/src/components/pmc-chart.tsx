"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";

import { ChartTooltip } from "@/components/chart-tooltip";
import { MetricInfo } from "@/components/metric-info";
import { round2 } from "@/lib/format";
import type { InsightMetricId } from "@/lib/insight-copy";
import type { InsightSeriesPoint } from "@/lib/types";

// Performance Management Chart: CTL (fitness) and ATL (fatigue) share the left
// axis; TSB (form) sits on a secondary right axis since it is centered near 0 and
// on a different scale. Colours come from CSS variables so the chart honours the
// active theme (matches weekly-load-chart / activity-type-chart). `metricId`
// keys each series to its shared explanation in INSIGHT_COPY.
const SERIES: {
  key: string;
  labelKey: string;
  color: string;
  axis: string;
  metricId: InsightMetricId;
}[] = [
  { key: "ctl", labelKey: "insights.pmcLegend.ctl", color: "hsl(var(--primary))", axis: "left", metricId: "ctl" },
  { key: "atl", labelKey: "insights.pmcLegend.atl", color: "hsl(38 92% 50%)", axis: "left", metricId: "atl" },
  { key: "tsb", labelKey: "insights.pmcLegend.tsb", color: "hsl(142 71% 45%)", axis: "tsb", metricId: "tsb" },
];

// recharts requires every series' yAxisId to resolve to an explicit YAxis id once a
// second axis exists — the implicit default no longer matches. Both axes carry ids.

// Compact axis ticks ("30 May") to avoid crowding; the tooltip header shows the
// fuller date. Falls back to the raw string if it is not a parseable date.
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PmcChart({ series }: { series: InsightSeriesPoint[] }) {
  const { t } = useTranslation();
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
            {t(s.labelKey)}
            <MetricInfo id={s.metricId} />
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {/* Soft vertical fade under the CTL (fitness) area — the headline metric. */}
            <linearGradient id="pmc-ctl-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="date"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={shortDate}
            className="fill-muted-foreground"
          />
          <YAxis
            yAxisId="left"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            tickFormatter={round2}
            className="fill-muted-foreground"
          />
          <YAxis
            yAxisId="tsb"
            orientation="right"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            tickFormatter={round2}
            className="fill-muted-foreground"
          />
          {/* The fresh/fatigued boundary: TSB above 0 is form, below is fatigue. */}
          <ReferenceLine
            yAxisId="tsb"
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.4}
            strokeDasharray="4 4"
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeOpacity: 0.3 }}
            content={
              <ChartTooltip formatValue={round2} formatLabel={fullDate} />
            }
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="ctl"
            name={t("insights.pmcLegend.ctl")}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#pmc-ctl-fill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="atl"
            name={t("insights.pmcLegend.atl")}
            stroke="hsl(38 92% 50%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            yAxisId="tsb"
            type="monotone"
            dataKey="tsb"
            name={t("insights.pmcLegend.tsb")}
            stroke="hsl(142 71% 45%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
