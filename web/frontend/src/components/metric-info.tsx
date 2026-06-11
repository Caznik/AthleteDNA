"use client";

import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { INSIGHT_COPY, type InsightMetricId } from "@/lib/insight-copy";

// A self-contained info affordance: a focusable icon button that reveals the
// static explanation for `id` on hover or keyboard focus. It wraps its OWN
// TooltipProvider so it is safe to drop into any surface — including isolated
// component tests that never mount the app's <Providers> tree (a single global
// provider would make Radix throw in every such render).
export function MetricInfo({ id }: { id: InsightMetricId }) {
  const { label, text } = INSIGHT_COPY[id];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
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
