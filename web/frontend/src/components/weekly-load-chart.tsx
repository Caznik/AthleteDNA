"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
      <ResponsiveContainer width="100%" height="100%">
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
          <Legend />
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
