"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";

import { ChartTooltip } from "@/components/chart-tooltip";
import { MetricInfo } from "@/components/metric-info";
import { round2 } from "@/lib/format";
import type { WeeklyLoadPoint } from "@/lib/types";

// Compact axis ticks ("18 May") to avoid crowding; the tooltip header shows the
// fuller "Week of …" date. Falls back to the raw string if it is not parseable.
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// Engine-computed weekly training load as a bar chart, keyed on the ISO week's
// Monday, overlaid with the recommended load (the chronic-fitness target line) so a
// week's bar can be read against what the athlete should aim for. Colours come from
// CSS variables so they track the theme. The aria-label reports the week count so the
// number of bars is assertable under jsdom (where recharts does not paint SVG).
export function WeeklyLoadChart({ data }: { data: WeeklyLoadPoint[] }) {
  const { t } = useTranslation();
  const weekLabel = (iso: string) =>
    t("insights.weeklyLoadWeekOf", { date: shortDate(iso) });
  return (
    <div
      className="h-72 w-full"
      data-testid="weekly-load-chart"
      aria-label={t("insights.weeklyLoadAria", { weeks: data.length })}
    >
      {/* Custom legend rendered in our own DOM (mirrors the PMC legend): recharts'
          native <Legend> does not paint under jsdom's 0×0 container, so this keeps
          the labels and their info icons testable and deterministic. */}
      <ul
        className="mb-2 flex flex-wrap gap-4 text-xs"
        data-testid="weekly-load-legend"
      >
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          />
          {t("insights.weeklyLegend.load")}
          <MetricInfo id="weeklyLoad" />
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-0.5 w-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, hsl(var(--muted-foreground)) 0 5px, transparent 5px 9px)",
            }}
          />
          {t("insights.weeklyLegend.recommended")}
          <MetricInfo id="recommended" />
        </li>
      </ul>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {/* Vertical fade on each bar so the load reads with more depth than a flat fill. */}
            <linearGradient id="weekly-load-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="weekStart"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            tickFormatter={shortDate}
            className="fill-muted-foreground"
          />
          <YAxis
            yAxisId="load"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            tickFormatter={round2}
            className="fill-muted-foreground"
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted-foreground))", fillOpacity: 0.08 }}
            content={
              <ChartTooltip formatValue={round2} formatLabel={weekLabel} />
            }
          />
          <Bar
            yAxisId="load"
            dataKey="load"
            name={t("insights.weeklyLegend.load")}
            fill="url(#weekly-load-fill)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Line
            yAxisId="load"
            type="monotone"
            dataKey="recommendedLoad"
            name={t("insights.weeklyLegend.recommended")}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
