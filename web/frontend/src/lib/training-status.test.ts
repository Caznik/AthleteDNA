import { describe, expect, it } from "vitest";

import { trainingStatus } from "./training-status";

describe("trainingStatus", () => {
  it("flags overreaching when form is deeply negative, regardless of ramp", () => {
    expect(trainingStatus(5, -30)).toBe("overreaching");
    expect(trainingStatus(-5, -26)).toBe("overreaching");
  });

  it("flags detraining when the fitness ramp is clearly falling", () => {
    expect(trainingStatus(-4, 0)).toBe("detraining");
  });

  it("flags recovery when well-rested without a falling ramp", () => {
    expect(trainingStatus(0, 20)).toBe("recovery");
  });

  it("flags productive when fitness is clearly rising", () => {
    expect(trainingStatus(4, 0)).toBe("productive");
  });

  it("defaults to maintenance when steady", () => {
    expect(trainingStatus(1, 0)).toBe("maintenance");
    expect(trainingStatus(-2, 10)).toBe("maintenance");
  });

  it("prioritises overreaching over a rising ramp", () => {
    expect(trainingStatus(10, -40)).toBe("overreaching");
  });
});
