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

import { MetricInfo } from "@/components/metric-info";
import { round2 } from "@/lib/format";
import type { WeeklyLoadPoint } from "@/lib/types";

// Engine-computed weekly training load as a bar chart, keyed on the ISO week's
// Monday, overlaid with the recommended load (the chronic-fitness target line) so a
// week's bar can be read against what the athlete should aim for. Colours come from
// CSS variables so they track the theme. The aria-label reports the week count so the
// number of bars is assertable under jsdom (where recharts does not paint SVG).
export function WeeklyLoadChart({ data }: { data: WeeklyLoadPoint[] }) {
  return (
    <div
      className="h-72 w-full"
      data-testid="weekly-load-chart"
      aria-label={`Weekly training load, ${data.length} weeks`}
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
          Weekly load
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
          Recommended
          <MetricInfo id="recommended" />
        </li>
      </ul>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="weekStart" fontSize={12} tickLine={false} />
          <YAxis
            yAxisId="load"
            fontSize={12}
            tickLine={false}
            width={48}
            tickFormatter={round2}
          />
          <Tooltip formatter={(value) => round2(value as number)} />
          <Bar
            yAxisId="load"
            dataKey="load"
            name="Weekly load"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="load"
            type="monotone"
            dataKey="recommendedLoad"
            name="Recommended"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
