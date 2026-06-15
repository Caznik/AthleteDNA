"use client";

import type { TooltipProps } from "recharts";

// Shared, theme-aware tooltip for recharts charts. Replaces recharts' default
// (an unstyled white box with raw series keys) so every chart reads as part of
// the app surface: card background, hairline border, rounded corners, soft
// shadow, and one colour-keyed row per series. `formatValue` keeps unit/decimal
// formatting in the caller's hands (e.g. round2, formatTrainingLoad); the
// optional `formatLabel` lets a chart prettify the x-axis header (dates, etc.).
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = (v) => String(v),
  formatLabel,
}: TooltipProps<number, string> & {
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      {label != null && (
        <p className="mb-1.5 font-medium text-foreground">
          {formatLabel ? formatLabel(String(label)) : String(label)}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, i) => (
          <li
            key={`${entry.dataKey as string}-${entry.name ?? i}`}
            className="flex items-center gap-2 tabular-nums"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              // Lines/bars expose `color`; pie slices carry it on the datum's `fill`.
              style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium text-foreground">
              {formatValue(entry.value as number)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
