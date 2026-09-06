import { describe, expect, it } from "vitest";
import { getPregnancyOverview } from "./pregnancy";

describe("getPregnancyOverview", () => {
  it("calculates gestational age and the next prenatal task from a due date", () => {
    const overview = getPregnancyOverview(
      {
        motherName: "林小姐",
        dueDate: "2026-12-10",
      },
      new Date("2026-09-06T08:00:00+08:00"),
    );

    expect(overview.gestationalAge.label).toBe("26w+3d");
    expect(overview.progressPercent).toBeGreaterThan(65);
    expect(overview.nextCheckup.title).toContain("糖耐");
    expect(overview.babyDescription).toContain("听觉");
    expect(overview.advice).toHaveLength(3);
  });
});
