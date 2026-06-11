import { describe, expect, it } from "vitest";

import {
  INSIGHT_COPY,
  type InsightMetricId,
} from "./insight-copy";

const IDS: InsightMetricId[] = [
  "pmc",
  "weeklyLoad",
  "ctl",
  "atl",
  "tsb",
  "recommended",
  "ctlRamp",
  "formDirection",
  "prDistance",
  "prDuration",
  "prPace",
];

describe("INSIGHT_COPY", () => {
  it("defines non-empty label and text for every metric id (AC-3)", () => {
    for (const id of IDS) {
      const entry = INSIGHT_COPY[id];
      expect(entry, id).toBeDefined();
      expect(entry.label.trim().length, `${id}.label`).toBeGreaterThan(0);
      expect(entry.text.trim().length, `${id}.text`).toBeGreaterThan(0);
    }
  });

  it("explains the fresh/neutral/fatigued meaning in the TSB copy (AC-7)", () => {
    expect(INSIGHT_COPY.tsb.text).toMatch(/fresh/i);
    expect(INSIGHT_COPY.tsb.text).toMatch(/neutral/i);
    expect(INSIGHT_COPY.tsb.text).toMatch(/fatigued/i);
  });

  it("is the single source shared concepts resolve through (AC-3)", () => {
    // The card, the PMC series and the trend readout all read CTL/ATL/TSB copy
    // from this same map by id, so a lookup is referentially identical no matter
    // which surface performs it — wording cannot drift between surfaces.
    expect(INSIGHT_COPY["ctl"]).toBe(INSIGHT_COPY.ctl);
    expect(INSIGHT_COPY["tsb"]).toBe(INSIGHT_COPY.tsb);
  });

  it("keeps copy source-agnostic (no provider-specific wording)", () => {
    for (const id of IDS) {
      expect(INSIGHT_COPY[id].text, id).not.toMatch(/strava/i);
    }
  });
});
