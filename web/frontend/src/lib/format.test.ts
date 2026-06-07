import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDistanceKm,
  formatDuration,
  formatHr,
  formatPace,
  formatTrainingLoad,
} from "./format";

describe("formatDistanceKm", () => {
  it("converts meters to km with two decimals", () => {
    expect(formatDistanceKm(10000)).toBe("10.00 km");
    expect(formatDistanceKm(5432)).toBe("5.43 km");
  });
  it("renders a dash for null/NaN", () => {
    expect(formatDistanceKm(null)).toBe("—");
    expect(formatDistanceKm(undefined)).toBe("—");
    expect(formatDistanceKm(NaN)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats seconds as h m", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(3661)).toBe("1h 1m");
    expect(formatDuration(90)).toBe("0h 1m");
  });
  it("renders a dash for invalid input", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(-5)).toBe("—");
  });
});

describe("formatHr", () => {
  it("appends bpm", () => {
    expect(formatHr(150)).toBe("150 bpm");
  });
  it("renders a dash for null or zero", () => {
    expect(formatHr(null)).toBe("—");
    expect(formatHr(0)).toBe("—");
  });
});

describe("formatPace", () => {
  it("formats seconds per km as m:ss/km", () => {
    expect(formatPace(300)).toBe("5:00/km");
    expect(formatPace(329)).toBe("5:29/km");
    expect(formatPace(65)).toBe("1:05/km");
  });
  it("renders a dash for null, NaN or non-positive input", () => {
    expect(formatPace(null)).toBe("—");
    expect(formatPace(undefined)).toBe("—");
    expect(formatPace(NaN)).toBe("—");
    expect(formatPace(0)).toBe("—");
    expect(formatPace(-10)).toBe("—");
  });
});

describe("formatDate", () => {
  it("renders a dash for empty or invalid", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
  it("formats an ISO instant", () => {
    expect(formatDate("2026-05-01T08:00:00Z")).toMatch(/2026/);
  });
});

describe("formatTrainingLoad", () => {
  it("rounds and renders a number", () => {
    expect(formatTrainingLoad(540000)).toBe("540,000");
  });
  it("renders a dash for null", () => {
    expect(formatTrainingLoad(null)).toBe("—");
  });
});
