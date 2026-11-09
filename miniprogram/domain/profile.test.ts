import { describe, expect, it } from "vitest";
import { buildPregnancyOverview, validateProfile } from "./profile";

const profile = { lastPeriod: "2026-08-01", babies: "single" as const, risk: "no" as const, riskDetails: "", medications: "" };

describe("mini program pregnancy profile", () => {
  it("rejects future and implausibly old dates", () => {
    expect(validateProfile({ ...profile, lastPeriod: "2026-11-10" }, new Date("2026-11-09"))).toContain("晚于今天");
    expect(validateProfile({ ...profile, lastPeriod: "2025-12-01" }, new Date("2026-11-09"))).toContain("43 周");
  });

  it("builds due date and gestational age from last period", () => {
    const result = buildPregnancyOverview(profile, new Date("2026-11-09"));
    expect(result.dueDate).toBe("2027-05-08");
    expect(result.gestationalAge.label).toBe("14w+2d");
  });
});
