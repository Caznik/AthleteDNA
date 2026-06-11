"use client";

import { useId } from "react";

export type RangeKey = "7d" | "15d" | "30d" | "6m";

export const RANGE_OPTIONS: { value: RangeKey; label: string; days: number }[] = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "15d", label: "15 days", days: 15 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "6m", label: "6 months", days: 180 },
];

// Trailing-window day count for a range key, defaulting to 30d for an unknown key.
export function rangeDays(range: RangeKey): number {
  return (RANGE_OPTIONS.find((r) => r.value === range) ?? RANGE_OPTIONS[2]).days;
}

// Standalone range dropdown so each chart can own its own window independently.
// `label` is both the visually-hidden <label> text and the accessible name, so
// callers must pass a distinct label per instance to keep them addressable.
export function RangeSelect({
  value,
  onChange,
  label,
}: {
  value: RangeKey;
  onChange: (value: RangeKey) => void;
  label: string;
}) {
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
        {RANGE_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </>
  );
}
