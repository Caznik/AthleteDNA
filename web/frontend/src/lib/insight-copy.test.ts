import { describe, expect, it } from "vitest";

import { INSIGHT_METRIC_IDS } from "./insight-copy";
import en from "./i18n/locales/en.json";
import es from "./i18n/locales/es.json";

type MetricCopy = { label: string; text: string };
const enMetrics = en.insights.metrics as Record<string, MetricCopy>;
const esMetrics = es.insights.metrics as Record<string, MetricCopy>;

describe("insight metric copy catalog", () => {
  it("defines non-empty label and text for every metric id in both locales (AC-9)", () => {
    for (const id of INSIGHT_METRIC_IDS) {
      for (const [locale, metrics] of [
        ["en", enMetrics],
        ["es", esMetrics],
      ] as const) {
        const entry = metrics[id];
        expect(entry, `${locale}.${id}`).toBeDefined();
        expect(entry.label.trim().length, `${locale}.${id}.label`).toBeGreaterThan(0);
        expect(entry.text.trim().length, `${locale}.${id}.text`).toBeGreaterThan(0);
      }
    }
  });

  it("explains the fresh/neutral/fatigued meaning in the TSB copy (AC-7)", () => {
    expect(enMetrics.tsb.text).toMatch(/fresh/i);
    expect(enMetrics.tsb.text).toMatch(/neutral/i);
    expect(enMetrics.tsb.text).toMatch(/fatigued/i);
  });

  it("shares one catalog entry per concept (no per-surface duplication)", () => {
    // Every id maps to exactly one entry in each locale, so the card, the PMC
    // series and the trend readout that look up the same id resolve identical
    // copy — wording cannot drift between surfaces.
    expect(Object.keys(enMetrics).sort()).toEqual([...INSIGHT_METRIC_IDS].sort());
    expect(Object.keys(esMetrics).sort()).toEqual([...INSIGHT_METRIC_IDS].sort());
  });

  it("keeps copy source-agnostic (no provider-specific wording)", () => {
    for (const id of INSIGHT_METRIC_IDS) {
      expect(enMetrics[id].text, `en.${id}`).not.toMatch(/strava/i);
      expect(esMetrics[id].text, `es.${id}`).not.toMatch(/strava/i);
    }
  });
});
