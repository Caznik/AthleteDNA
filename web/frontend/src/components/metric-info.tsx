"use client";

import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type InsightMetricId } from "@/lib/insight-copy";

// A self-contained info affordance: a focusable icon button that reveals the
// explanation for `id` on hover or keyboard focus. The copy is keyed by the
// shared metric id in the i18n catalog (`insights.metrics.<id>`), so every
// surface referencing the same id renders the same wording in the active
// language. It wraps its OWN TooltipProvider so it is safe to drop into any
// surface — including isolated component tests that never mount <Providers>.
export function MetricInfo({ id }: { id: InsightMetricId }) {
  const { t } = useTranslation();
  const label = t(`insights.metrics.${id}.label`);
  const text = t(`insights.metrics.${id}.text`);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t("insights.metricInfoAbout", { label })}
            data-testid="metric-info"
            className="inline-flex items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
