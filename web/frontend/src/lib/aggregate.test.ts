import { describe, expect, it } from "vitest";

import {
  activityTypes,
  countsByType,
  countsByTypeWithinDays,
  filterWithinDays,
  summarize,
  weeklyTrainingLoad,
} from "./aggregate";
import type { Activity } from "./types";

function activity(partial: Partial<Activity>): Activity {
  return {
    id: "1",
    type: "Running",
    distance: 10000,
    duration: 3600,
    avgHr: 150,
    externalStravaId: 1,
    startDate: "2026-05-25T08:00:00Z",
    trainingLoad: 540000,
    ...partial,
  };
}

describe("weeklyTrainingLoad", () => {
  const now = new Date("2026-06-01T12:00:00Z"); // Monday

  it("produces exactly `weeks` buckets", () => {
    const points = weeklyTrainingLoad([], 12, now);
    expect(points).toHaveLength(12);
  });

  it("fills empty weeks with 0", () => {
    const points = weeklyTrainingLoad([], 12, now);
    expect(points.every((p) => p.load === 0)).toBe(true);
  });

  it("buckets load into the matching ISO week", () => {
    const points = weeklyTrainingLoad(
      [activity({ startDate: "2026-05-25T08:00:00Z", trainingLoad: 1000 })],
      12,
      now,
    );
    const total = points.reduce((s, p) => s + p.load, 0);
    expect(total).toBe(1000);
  });

  it("ignores activities outside the rolling window", () => {
    const points = weeklyTrainingLoad(
      [activity({ startDate: "2025-01-01T08:00:00Z", trainingLoad: 999 })],
      12,
      now,
    );
    expect(points.reduce((s, p) => s + p.load, 0)).toBe(0);
  });

  it("sums multiple activities in the same week", () => {
    const points = weeklyTrainingLoad(
      [
        activity({ startDate: "2026-05-25T08:00:00Z", trainingLoad: 100 }),
        activity({ startDate: "2026-05-27T08:00:00Z", trainingLoad: 200 }),
      ],
      12,
      now,
    );
    expect(points.reduce((s, p) => s + p.load, 0)).toBe(300);
  });
});

describe("summarize", () => {
  it("computes count, totals and avg HR", () => {
    const result = summarize([
      activity({ distance: 10000, duration: 3600, avgHr: 150 }),
      activity({ distance: 5000, duration: 1800, avgHr: 130 }),
    ]);
    expect(result.count).toBe(2);
    expect(result.totalDistanceMeters).toBe(15000);
    expect(result.totalDurationSeconds).toBe(5400);
    expect(result.avgHr).toBe(140);
  });

  it("returns null avg HR when no HR data", () => {
    const result = summarize([activity({ avgHr: null })]);
    expect(result.avgHr).toBeNull();
  });

  it("handles empty input", () => {
    const result = summarize([]);
    expect(result).toEqual({
      count: 0,
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      avgHr: null,
    });
  });
});

describe("countsByTypeWithinDays", () => {
  // now = Mon 2026-06-01 12:00Z; 7-day window start = start of 2026-05-26 00:00Z
  const now = new Date("2026-06-01T12:00:00Z");

  it("counts activities per type within the rolling 7-day window", () => {
    const result = countsByTypeWithinDays(
      [
        activity({ type: "Run", startDate: "2026-05-28T08:00:00Z" }),
        activity({ type: "Run", startDate: "2026-05-30T08:00:00Z" }),
        activity({ type: "WeightTraining", startDate: "2026-06-01T06:00:00Z" }),
      ],
      7,
      now,
    );
    expect(result).toEqual([
      { type: "Run", count: 2 },
      { type: "WeightTraining", count: 1 },
    ]);
  });

  it("orders types alphabetically", () => {
    const result = countsByTypeWithinDays(
      [
        activity({ type: "Swim", startDate: "2026-05-28T08:00:00Z" }),
        activity({ type: "Ride", startDate: "2026-05-28T08:00:00Z" }),
        activity({ type: "Run", startDate: "2026-05-28T08:00:00Z" }),
      ],
      7,
      now,
    );
    expect(result.map((r) => r.type)).toEqual(["Ride", "Run", "Swim"]);
  });

  it("includes activities at the window lower bound (start of today−6 days)", () => {
    const result = countsByTypeWithinDays(
      [activity({ type: "Run", startDate: "2026-05-26T00:00:00Z" })],
      7,
      now,
    );
    expect(result).toEqual([{ type: "Run", count: 1 }]);
  });

  it("excludes activities just before the lower bound", () => {
    const result = countsByTypeWithinDays(
      [activity({ type: "Run", startDate: "2026-05-25T23:59:59Z" })],
      7,
      now,
    );
    expect(result).toEqual([]);
  });

  it("excludes activities after now", () => {
    const result = countsByTypeWithinDays(
      [activity({ type: "Run", startDate: "2026-06-01T12:00:01Z" })],
      7,
      now,
    );
    expect(result).toEqual([]);
  });

  it("widens the window for larger day counts (30 / 180 / 365 days)", () => {
    const acts = [
      activity({ type: "Run", startDate: "2026-05-10T08:00:00Z" }), // 22 days ago
      activity({ type: "Ride", startDate: "2026-01-15T08:00:00Z" }), // ~4.5 months ago
      activity({ type: "Swim", startDate: "2025-09-01T08:00:00Z" }), // ~9 months ago
    ];
    expect(countsByTypeWithinDays(acts, 7, now)).toEqual([]);
    expect(countsByTypeWithinDays(acts, 30, now)).toEqual([
      { type: "Run", count: 1 },
    ]);
    expect(countsByTypeWithinDays(acts, 180, now)).toEqual([
      { type: "Ride", count: 1 },
      { type: "Run", count: 1 },
    ]);
    expect(countsByTypeWithinDays(acts, 365, now)).toEqual([
      { type: "Ride", count: 1 },
      { type: "Run", count: 1 },
      { type: "Swim", count: 1 },
    ]);
  });

  it("returns empty array for an empty window", () => {
    expect(countsByTypeWithinDays([], 7, now)).toEqual([]);
  });

  it("ignores activities with missing or invalid startDate", () => {
    const result = countsByTypeWithinDays(
      [
        activity({ type: "Run", startDate: null }),
        activity({ type: "Run", startDate: "not-a-date" }),
        activity({ type: "Run", startDate: "2026-05-28T08:00:00Z" }),
      ],
      7,
      now,
    );
    expect(result).toEqual([{ type: "Run", count: 1 }]);
  });
});

describe("filterWithinDays", () => {
  // now = Mon 2026-06-01 12:00Z; 7-day window start = start of 2026-05-26 00:00Z
  const now = new Date("2026-06-01T12:00:00Z");

  it("keeps activities inside the rolling window", () => {
    const acts = [
      activity({ id: "a", startDate: "2026-05-28T08:00:00Z" }),
      activity({ id: "b", startDate: "2026-05-30T08:00:00Z" }),
    ];
    const result = filterWithinDays(acts, 7, now);
    expect(result.map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("includes activities at the window lower bound (start of today−6 days)", () => {
    const acts = [activity({ id: "a", startDate: "2026-05-26T00:00:00Z" })];
    expect(filterWithinDays(acts, 7, now).map((a) => a.id)).toEqual(["a"]);
  });

  it("excludes activities just before the lower bound", () => {
    const acts = [activity({ id: "a", startDate: "2026-05-25T23:59:59Z" })];
    expect(filterWithinDays(acts, 7, now)).toEqual([]);
  });

  it("excludes activities after now", () => {
    const acts = [activity({ id: "a", startDate: "2026-06-01T12:00:01Z" })];
    expect(filterWithinDays(acts, 7, now)).toEqual([]);
  });

  it("widens the window for larger day counts", () => {
    const acts = [
      activity({ id: "a", startDate: "2026-05-10T08:00:00Z" }), // 22 days ago
      activity({ id: "b", startDate: "2026-01-15T08:00:00Z" }), // ~4.5 months ago
      activity({ id: "c", startDate: "2025-09-01T08:00:00Z" }), // ~9 months ago
    ];
    expect(filterWithinDays(acts, 7, now)).toEqual([]);
    expect(filterWithinDays(acts, 30, now).map((a) => a.id)).toEqual(["a"]);
    expect(filterWithinDays(acts, 180, now).map((a) => a.id)).toEqual([
      "a",
      "b",
    ]);
    expect(filterWithinDays(acts, 365, now).map((a) => a.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("drops activities with missing or invalid startDate", () => {
    const acts = [
      activity({ id: "a", startDate: null }),
      activity({ id: "b", startDate: "not-a-date" }),
      activity({ id: "c", startDate: "2026-05-28T08:00:00Z" }),
    ];
    expect(filterWithinDays(acts, 7, now).map((a) => a.id)).toEqual(["c"]);
  });

  it("returns an empty array for empty input", () => {
    expect(filterWithinDays([], 7, now)).toEqual([]);
  });
});

describe("countsByType", () => {
  it("counts activities per type without any date window", () => {
    const result = countsByType([
      activity({ type: "Run", startDate: "2020-01-01T08:00:00Z" }),
      activity({ type: "Run", startDate: "2026-05-30T08:00:00Z" }),
      activity({ type: "Ride", startDate: "2010-05-30T08:00:00Z" }),
    ]);
    expect(result).toEqual([
      { type: "Ride", count: 1 },
      { type: "Run", count: 2 },
    ]);
  });

  it("orders types alphabetically", () => {
    const result = countsByType([
      activity({ type: "Swim" }),
      activity({ type: "Ride" }),
      activity({ type: "Run" }),
    ]);
    expect(result.map((r) => r.type)).toEqual(["Ride", "Run", "Swim"]);
  });

  it("returns an empty array for empty input", () => {
    expect(countsByType([])).toEqual([]);
  });
});

describe("activityTypes", () => {
  it("returns unique sorted types", () => {
    const types = activityTypes([
      activity({ type: "Running" }),
      activity({ type: "Ride" }),
      activity({ type: "Running" }),
    ]);
    expect(types).toEqual(["Ride", "Running"]);
  });
});
