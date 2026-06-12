// Derives a single "training status" band from the engine's current form (TSB)
// and CTL ramp, mirroring the at-a-glance status tile on platforms like COROS.
// Pure and source-agnostic: it reads only values we already compute (no new data),
// and the user-facing label/description live in the i18n catalog keyed by the band
// id (`insights.trainingStatus.<status>`).

export type TrainingStatus =
  | "overreaching"
  | "detraining"
  | "recovery"
  | "productive"
  | "maintenance";

// Full set in display priority order, for tests/tooling asserting copy coverage.
export const TRAINING_STATUSES: TrainingStatus[] = [
  "overreaching",
  "detraining",
  "recovery",
  "productive",
  "maintenance",
];

// Thresholds are deliberately simple and explained in the tooltip copy:
// - very negative form (deep fatigue) ⇒ overreaching, regardless of ramp;
// - otherwise a clearly falling fitness ramp ⇒ detraining;
// - otherwise high positive form (well rested, backed off) ⇒ recovery;
// - otherwise a clearly rising fitness ramp ⇒ productive;
// - otherwise steady ⇒ maintenance.
export function trainingStatus(
  ctlRampPerWeek: number,
  tsb: number,
): TrainingStatus {
  if (tsb < -25) return "overreaching";
  if (ctlRampPerWeek < -3) return "detraining";
  if (tsb > 15) return "recovery";
  if (ctlRampPerWeek > 3) return "productive";
  return "maintenance";
}
