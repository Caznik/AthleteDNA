// Stable, source-agnostic identifiers for the insight metrics shown on the
// /insights screen. Each surface (chart titles, chart series legends, the
// current-form cards, the trend readout and the PR table) references the SAME id
// so the explanatory copy for a shared concept (CTL/ATL/TSB, …) cannot drift:
// there is exactly one catalog entry per id at `insights.metrics.<id>` in each
// locale, resolved via i18n in <MetricInfo/>. The copy itself is localized; only
// the id contract lives here.

export type InsightMetricId =
  | "pmc"
  | "weeklyLoad"
  | "ctl"
  | "atl"
  | "tsb"
  | "recommended"
  | "ctlRamp"
  | "formDirection"
  | "prDistance"
  | "prDuration"
  | "prPace"
  | "trainingStatus"
  | "distanceZones"
  | "totalLoad";

// The full set of metric ids, so tests and tooling can assert catalog coverage.
export const INSIGHT_METRIC_IDS: InsightMetricId[] = [
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
  "trainingStatus",
  "distanceZones",
  "totalLoad",
];
