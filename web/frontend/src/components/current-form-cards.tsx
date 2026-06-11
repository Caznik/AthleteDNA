import { MetricInfo } from "@/components/metric-info";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InsightMetricId } from "@/lib/insight-copy";
import type { InsightCurrentForm } from "@/lib/types";

// Maps the engine's form label to a badge variant so each state reads with a
// distinct colour (fresh = positive, fatigued = warning, neutral = muted).
const FORM_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  fresh: "default",
  neutral: "secondary",
  fatigued: "destructive",
};

// Signed whole number for TSB (form), e.g. 14.3 → "+14", -3.2 → "-3".
function signedRound(value: number): string {
  const rounded = Math.round(value);
  return rounded >= 0 ? `+${rounded}` : String(rounded);
}

export function CurrentFormCards({ current }: { current: InsightCurrentForm }) {
  const variant = FORM_VARIANT[current.formLabel] ?? "secondary";

  const cards: { label: string; value: string; metricId: InsightMetricId }[] = [
    { label: "Fitness (CTL)", value: String(Math.round(current.ctl)), metricId: "ctl" },
    { label: "Fatigue (ATL)", value: String(Math.round(current.atl)), metricId: "atl" },
    { label: "Form (TSB)", value: signedRound(current.tsb), metricId: "tsb" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3" data-testid="current-form-cards">
      {cards.map((c) => (
        <Card key={c.label} data-testid="current-form-card">
          <CardHeader className="pb-2">
            <span className="flex items-center gap-1.5">
              <CardDescription>{c.label}</CardDescription>
              <MetricInfo id={c.metricId} />
            </span>
            <CardTitle className="text-2xl">{c.value}</CardTitle>
          </CardHeader>
          <CardContent>
            {c.label.startsWith("Form") ? (
              <Badge variant={variant} data-testid="form-badge">
                {current.formLabel}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
