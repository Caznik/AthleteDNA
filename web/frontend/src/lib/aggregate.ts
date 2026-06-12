import type { Activity, InsightSeriesPoint, WeeklyLoadPoint } from "./types";

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

// Stable ids for the distance buckets, in ascending order. The user-facing label
// for each lives in the i18n catalog (`insights.distanceZones.<key>`), so this
// module carries no display strings.
export type DistanceZoneKey =
  | "z0_5"
  | "z5_10"
  | "z10_15"
  | "z15_20"
  | "z20_25"
  | "z25plus";

export interface DistanceZonePoint {
  key: DistanceZoneKey;
  count: number;
  meters: number; // total distance falling in this bucket
}

// Upper bound (meters, exclusive) for each bucket except the open-ended last one.
const DISTANCE_ZONE_BOUNDS: { key: DistanceZoneKey; max: number }[] = [
  { key: "z0_5", max: 5000 },
  { key: "z5_10", max: 10000 },
  { key: "z10_15", max: 15000 },
  { key: "z15_20", max: 20000 },
  { key: "z20_25", max: 25000 },
  { key: "z25plus", max: Infinity },
];

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

// Sibling of `filterSeriesWithinDays` for engine weekly-load points, which carry
// a `weekStart` (the ISO week's Monday, "2026-06-01") instead of a daily `date`.
// Kept separate from the daily filters (not a generalization), matching the style
// of the other windowing helpers. Returns weeks whose Monday falls within the
// trailing `days` window, inclusive at both ends; invalid `weekStart` are dropped.
export function filterWeeklyWithinDays(
  weekly: WeeklyLoadPoint[],
  days: number,
  now: Date = new Date(),
): WeeklyLoadPoint[] {
  const windowStart = startOfUtcDay(now);
  windowStart.setUTCDate(windowStart.getUTCDate() - (days - 1));
  const startMs = windowStart.getTime();
  const endMs = now.getTime();

  return weekly.filter((w) => {
    if (!w.weekStart) return false;
    const t = new Date(w.weekStart).getTime();
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

// Sums the engine's normalized daily load over the given PMC series points. Used
// for the training-summary "total load" so it shares the same TSS-like scale as
// the weekly-load chart and PMC — not the raw duration×HR `Activity.trainingLoad`,
// which is orders of magnitude larger and would read as a different metric.
export function sumSeriesLoad(series: InsightSeriesPoint[]): number {
  return series.reduce((total, point) => total + point.load, 0);
}

// Buckets activities by distance into the fixed zones above. Always returns all
// six zones in ascending order (zero-count zones included) so the chart legend is
// stable; activities with a missing or non-positive distance carry no distance to
// place and are dropped.
export function distanceZoneDistribution(
  activities: Activity[],
): DistanceZonePoint[] {
  const points: DistanceZonePoint[] = DISTANCE_ZONE_BOUNDS.map(({ key }) => ({
    key,
    count: 0,
    meters: 0,
  }));

  for (const a of activities) {
    const distance = a.distance ?? 0;
    if (distance <= 0) continue;
    const idx = DISTANCE_ZONE_BOUNDS.findIndex((b) => distance < b.max);
    const bucket = points[idx];
    bucket.count += 1;
    bucket.meters += distance;
  }

  return points;
}

export function activityTypes(activities: Activity[]): string[] {
  return Array.from(new Set(activities.map((a) => a.type))).sort();
}
