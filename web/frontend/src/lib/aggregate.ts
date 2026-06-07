import type { Activity, InsightSeriesPoint } from "./types";

export interface SummaryTotals {
  count: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  avgHr: number | null;
}

export interface TypeCountPoint {
  type: string;
  count: number;
}

// Returns the UTC 00:00 at the start of the day containing `date`.
function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

// Returns activities whose `startDate` falls within a rolling window of the last
// `days` days: from the start of (today − (days − 1)) at 00:00 UTC through `now`,
// inclusive at both ends. Activities with missing/invalid `startDate` are dropped.
// This is the single source of truth for the dashboard time-range boundary.
export function filterWithinDays(
  activities: Activity[],
  days: number,
  now: Date = new Date(),
): Activity[] {
  const windowStart = startOfUtcDay(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - (days - 1));
  const startMs = windowStart.getTime();
  const endMs = now.getTime();

  return activities.filter((a) => {
    if (!a.startDate) return false;
    const t = new Date(a.startDate).getTime();
    if (Number.isNaN(t)) return false;
    return t >= startMs && t <= endMs;
  });
}

// Sibling of `filterWithinDays` for engine PMC series points, which carry a
// calendar `date` ("2026-06-01") instead of an Activity `startDate`. Kept separate
// (not a generalization) so the Activity-typed original stays untouched. Returns
// points whose `date` falls within the trailing `days` window, inclusive at both
// ends; points with a missing/invalid `date` are dropped.
export function filterSeriesWithinDays(
  series: InsightSeriesPoint[],
  days: number,
  now: Date = new Date(),
): InsightSeriesPoint[] {
  const windowStart = startOfUtcDay(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - (days - 1));
  const startMs = windowStart.getTime();
  const endMs = now.getTime();

  return series.filter((p) => {
    if (!p.date) return false;
    const t = new Date(p.date).getTime();
    if (Number.isNaN(t)) return false;
    return t >= startMs && t <= endMs;
  });
}

// Counts activities per type (no date window). Result is sorted alphabetically
// by type for stable display.
export function countsByType(activities: Activity[]): TypeCountPoint[] {
  const counts = new Map<string, number>();
  for (const a of activities) {
    counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type));
}

// Counts activities per type within a rolling window of the last `days` days.
// Composed from the shared windowing helper so the date boundary lives in one place.
export function countsByTypeWithinDays(
  activities: Activity[],
  days: number,
  now: Date = new Date(),
): TypeCountPoint[] {
  return countsByType(filterWithinDays(activities, days, now));
}

export function summarize(activities: Activity[]): SummaryTotals {
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  let hrSum = 0;
  let hrCount = 0;

  for (const a of activities) {
    totalDistanceMeters += a.distance ?? 0;
    totalDurationSeconds += a.duration ?? 0;
    if (a.avgHr != null && a.avgHr > 0) {
      hrSum += a.avgHr;
      hrCount += 1;
    }
  }

  return {
    count: activities.length,
    totalDistanceMeters,
    totalDurationSeconds,
    avgHr: hrCount > 0 ? Math.round(hrSum / hrCount) : null,
  };
}

export function activityTypes(activities: Activity[]): string[] {
  return Array.from(new Set(activities.map((a) => a.type))).sort();
}
