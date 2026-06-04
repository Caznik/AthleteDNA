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

import { weeklyTrainingLoad } from "@/lib/aggregate";
import type { Activity } from "@/lib/types";

// Chart body only (no Card frame) — the panel owns the Card/header.
export function TrainingLoadChart({ activities }: { activities: Activity[] }) {
  const data = weeklyTrainingLoad(activities, 12);

  return (
    <div className="h-72 w-full" data-testid="training-load-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" fontSize={12} tickLine={false} />
          <YAxis fontSize={12} tickLine={false} width={48} />
          <Tooltip />
          <Bar dataKey="load" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
