import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { summarize } from "@/lib/aggregate";
import { formatDistanceKm, formatDuration, formatHr } from "@/lib/format";
import type { Activity } from "@/lib/types";

export function SummaryCards({ activities }: { activities: Activity[] }) {
  const totals = summarize(activities);

  const cards = [
    { label: "Total activities", value: String(totals.count) },
    {
      label: "Total distance",
      value: formatDistanceKm(totals.totalDistanceMeters),
    },
    { label: "Total time", value: formatDuration(totals.totalDurationSeconds) },
    { label: "Average HR", value: formatHr(totals.avgHr) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} data-testid="summary-card">
          <CardHeader className="pb-2">
            <CardDescription>{c.label}</CardDescription>
            <CardTitle className="text-2xl">{c.value}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
