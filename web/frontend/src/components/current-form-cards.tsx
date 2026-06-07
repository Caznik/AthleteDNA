import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const cards = [
    { label: "Fitness (CTL)", value: String(Math.round(current.ctl)) },
    { label: "Fatigue (ATL)", value: String(Math.round(current.atl)) },
    { label: "Form (TSB)", value: signedRound(current.tsb) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3" data-testid="current-form-cards">
      {cards.map((c) => (
        <Card key={c.label} data-testid="current-form-card">
          <CardHeader className="pb-2">
            <CardDescription>{c.label}</CardDescription>
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
