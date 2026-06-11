// Static, source-agnostic explanatory copy for the insight metrics shown on the
// /insights screen. Keyed by a stable metric id so each surface (chart titles,
// chart series legends, the current-form cards, the trend readout and the PR
// table) references the SAME string for a shared concept — wording for CTL/ATL/
// TSB cannot drift because there is exactly one entry per concept here.

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
  | "prPace";

export const INSIGHT_COPY: Record<
  InsightMetricId,
  { label: string; text: string }
> = {
  pmc: {
    label: "Performance management",
    text: "Tracks how your fitness, fatigue and form evolve over time so you can see whether your training is building you up or wearing you down.",
  },
  weeklyLoad: {
    label: "Weekly training load",
    text: "Your total training load summed per week, shown against a recommended target so you can spot weeks that ramped up or backed off too sharply.",
  },
  ctl: {
    label: "Fitness (CTL)",
    text: "Fitness (CTL) is your long-term training load average. It rises slowly as you train consistently and reflects the durable fitness you have built.",
  },
  atl: {
    label: "Fatigue (ATL)",
    text: "Fatigue (ATL) is your short-term training load average. It reacts quickly to recent hard sessions and reflects how tired you currently are.",
  },
  tsb: {
    label: "Form (TSB)",
    text: "Form (TSB) is fitness minus fatigue. A positive value means you are fresh and well-rested, near zero means neutral, and a negative value means you are fatigued.",
  },
  recommended: {
    label: "Recommended load",
    text: "The training load to aim for each week, derived from your current fitness, so you progress without ramping up too fast.",
  },
  ctlRamp: {
    label: "CTL ramp",
    text: "How fast your fitness (CTL) is changing per week. A positive ramp means fitness is building; a steep ramp can mean you are loading up quickly.",
  },
  formDirection: {
    label: "Form direction",
    text: "Which way your form (TSB) is trending — rising toward fresh or falling toward fatigued over recent days.",
  },
  prDistance: {
    label: "Max distance",
    text: "The longest single-activity distance you have recorded for this activity type.",
  },
  prDuration: {
    label: "Max duration",
    text: "The longest single-activity duration you have recorded for this activity type.",
  },
  prPace: {
    label: "Best pace",
    text: "The fastest average pace you have recorded for this activity type.",
  },
};
