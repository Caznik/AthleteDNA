"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";

export type RangeKey =
  | "7d"
  | "15d"
  | "30d"
  | "1m"
  | "2m"
  | "3m"
  | "6m"
  | "1y";

// Labels are resolved from the `ranges` catalog by `value` at render time, so the
// option set carries no user-facing strings.
export type RangeOption = { value: RangeKey; days: number };

// Default range set, used by the PMC chart.
export const RANGE_OPTIONS: RangeOption[] = [
  { value: "7d", days: 7 },
  { value: "15d", days: 15 },
  { value: "30d", days: 30 },
  { value: "6m", days: 180 },
];

// Weekly training load is coarser, so it uses month/year granularity.
export const WEEKLY_RANGE_OPTIONS: RangeOption[] = [
  { value: "1m", days: 30 },
  { value: "2m", days: 60 },
  { value: "3m", days: 90 },
  { value: "6m", days: 180 },
  { value: "1y", days: 365 },
];

// Day count for every known range key, regardless of which select it belongs to.
const ALL_RANGE_DAYS: Record<RangeKey, number> = {
  "7d": 7,
  "15d": 15,
  "30d": 30,
  "1m": 30,
  "2m": 60,
  "3m": 90,
  "6m": 180,
  "1y": 365,
};

// Trailing-window day count for a range key, defaulting to 30 for an unknown key.
export function rangeDays(range: RangeKey): number {
  return ALL_RANGE_DAYS[range] ?? 30;
}

// Standalone range dropdown so each chart can own its own window independently.
// `label` is both the visually-hidden <label> text and the accessible name, so
// callers must pass a distinct label per instance to keep them addressable.
export function RangeSelect({
  value,
  onChange,
  label,
  options = RANGE_OPTIONS,
}: {
  value: RangeKey;
  onChange: (value: RangeKey) => void;
  label: string;
  options?: RangeOption[];
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as RangeKey)}
        className="rounded-md border bg-background px-2 py-1 text-sm text-foreground shadow-sm"
      >
        {options.map((r) => (
          <option key={r.value} value={r.value}>
            {t(`ranges.${r.value}`)}
          </option>
        ))}
      </select>
    </>
  );
}
