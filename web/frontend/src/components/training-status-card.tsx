"use client";

import { useTranslation } from "react-i18next";

import { MetricInfo } from "@/components/metric-info";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trainingStatus, type TrainingStatus } from "@/lib/training-status";
import type { InsightCurrentForm, InsightTrends } from "@/lib/types";

// Colour each band so the overall state reads at a glance: building/fresh states
// positive, steady muted, declining/overload warning.
const STATUS_VARIANT: Record<
  TrainingStatus,
  "default" | "secondary" | "destructive"
> = {
  productive: "default",
  recovery: "default",
  maintenance: "secondary",
  detraining: "destructive",
  overreaching: "destructive",
};

// At-a-glance training-status tile: maps the current form (TSB) and CTL ramp onto
// a single status band with a short explanation. Repackages values already shown
// on the page (no new data).
export function TrainingStatusCard({
  current,
  trends,
}: {
  current: InsightCurrentForm;
  trends: InsightTrends;
}) {
  const { t } = useTranslation();
  const status = trainingStatus(trends.ctlRampPerWeek, current.tsb);

  return (
    <Card data-testid="training-status-card">
      <CardHeader className="pb-2">
        <span className="flex items-center gap-1.5">
          <CardTitle>{t("insights.trainingStatusTitle")}</CardTitle>
          <MetricInfo id="trainingStatus" />
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <Badge variant={STATUS_VARIANT[status]} data-testid="training-status-badge">
          {t(`insights.trainingStatus.${status}`)}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {t(`insights.trainingStatusDescription.${status}`)}
        </p>
      </CardContent>
    </Card>
  );
}
