"use client";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const variant = FORM_VARIANT[current.formLabel] ?? "secondary";

  const cards: {
    key: string;
    label: string;
    value: string;
    metricId: InsightMetricId;
    isForm?: boolean;
  }[] = [
    { key: "ctl", label: t("insights.currentForm.ctl"), value: String(Math.round(current.ctl)), metricId: "ctl" },
    { key: "atl", label: t("insights.currentForm.atl"), value: String(Math.round(current.atl)), metricId: "atl" },
    { key: "tsb", label: t("insights.currentForm.tsb"), value: signedRound(current.tsb), metricId: "tsb", isForm: true },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3" data-testid="current-form-cards">
      {cards.map((c) => (
        <Card key={c.key} data-testid="current-form-card">
          <CardHeader className="pb-2">
            <span className="flex items-center gap-1.5">
              <CardDescription className="text-xs font-medium uppercase tracking-wide">
                {c.label}
              </CardDescription>
              <MetricInfo id={c.metricId} />
            </span>
            <CardTitle className="text-2xl tabular-nums tracking-tight">
              {c.value}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {c.isForm ? (
              <Badge variant={variant} data-testid="form-badge">
                {t(`insights.formLabel.${current.formLabel}`, {
                  defaultValue: current.formLabel,
                })}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
