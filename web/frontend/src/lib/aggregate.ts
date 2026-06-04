import type { Activity } from "./types";

export interface WeeklyLoadPoint {
  weekStart: string; // ISO date (Monday) of the week bucket
  label: string; // short display label e.g. "01 May"
  load: number;
}

export interface SummaryTotals {
  count: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  avgHr: number | null;
}

// Returns the Monday 00:00 UTC at or before `date`.
function startOfIsoWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

// Buckets training load by ISO week over the last `weeks` weeks (rolling window
// ending on the week containing `now`). Empty weeks render as 0.
export function weeklyTrainingLoad(
  activities: Activity[],
  weeks = 12,
  now: Date = new Date(),
): WeeklyLoadPoint[] {
  const currentWeekStart = startOfIsoWeek(now);
  const buckets = new Map<number, number>();

  const earliest = new Date(currentWeekStart);
  earliest.setUTCDate(earliest.getUTCDate() - (weeks - 1) * 7);

  for (let i = 0; i < weeks; i++) {
    const ws = new Date(earliest);
    ws.setUTCDate(ws.getUTCDate() + i * 7);
    buckets.set(ws.getTime(), 0);
  }

  for (const a of activities) {
    if (!a.startDate || a.trainingLoad == null) continue;
    const d = new Date(a.startDate);
    if (Number.isNaN(d.getTime())) continue;
    const ws = startOfIsoWeek(d).getTime();
    if (buckets.has(ws)) {
      buckets.set(ws, (buckets.get(ws) ?? 0) + a.trainingLoad);
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, load]) => {
      const date = new Date(ts);
      return {
        weekStart: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        load,
      };
    });
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
