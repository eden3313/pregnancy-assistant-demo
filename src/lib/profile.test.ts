import { describe, expect, it } from "vitest";
import { buildPersonalOverview, validateProfile, type PersonalProfile } from "./profile";
const today = new Date(2026, 8, 6);
const profile: PersonalProfile = { lastPeriod: "2026-03-05", babies: "single", risk: "no", riskDetails: "", medications: "" };
describe("personal pregnancy profile", () => {
  it("calculates from LMP and preserves post-due-date weeks", () => {
    const result = buildPersonalOverview(profile, today);
    expect(result.dueDate).toBe("2026-12-10");
    expect(result.gestationalAge.label).toBe("26w+3d");
    expect(buildPersonalOverview({ ...profile, lastPeriod: "2025-11-20" }, today).gestationalAge.week).toBe(41);
  });
  it("rejects future and invalid dates", () => {
    expect(validateProfile({ ...profile, lastPeriod: "2026-09-07" }, today)).toContain("晚于");
    expect(validateProfile({ ...profile, lastPeriod: "2026-02-30" }, today)).toContain("有效");
  });
  it("early pregnancy does not select late pregnancy tasks", () => {
    expect(buildPersonalOverview({ ...profile, lastPeriod: "2026-08-01" }, today).nextCheckup.title).toContain("首次");
  });
  it("uses plurality, risk and medications without making prescriptions", () => {
    const result = buildPersonalOverview({ ...profile, babies: "twins", risk: "yes", riskDetails: "既往高血压", medications: "叶酸" }, today);
    expect(result.nextCheckup.title).toContain("个体化");
    expect(result.advice.join()).toContain("既往高血压");
    expect(result.advice.join()).toContain("叶酸");
    expect(result.babyDescription).toContain("分别");
  });
});
