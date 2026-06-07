"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { WeeklyLoadPoint } from "@/lib/types";

// Engine-computed weekly training load as a bar chart, keyed on the ISO week's
// Monday. Replaces the former client-side approximation. Colour comes from a CSS
// variable so it tracks the theme. The aria-label reports the week count so the
// number of bars is assertable under jsdom (where recharts does not paint SVG).
export function WeeklyLoadChart({ data }: { data: WeeklyLoadPoint[] }) {
  return (
    <div
      className="h-72 w-full"
      data-testid="weekly-load-chart"
      aria-label={`Weekly training load, ${data.length} weeks`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="weekStart" fontSize={12} tickLine={false} />
          <YAxis fontSize={12} tickLine={false} width={48} />
          <Tooltip />
          <Bar dataKey="load" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
