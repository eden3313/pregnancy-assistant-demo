import { describe, expect, it } from "vitest";
import { generateSchedule, minutesBetween } from "./scheduler";

describe("generateSchedule", () => {
  it("places calcium and iron at least two hours apart with visible reasons", () => {
    const slots = generateSchedule({
      supplements: ["钙片", "铁剂", "复合维生素", "DHA", "黄体酮"],
      wakeTime: "07:00",
      sleepTime: "22:30",
      meals: { breakfast: "07:30", lunch: "12:30", dinner: "18:30" },
    });

    const flatMeds = slots.flatMap((slot) => slot.meds);
    expect(flatMeds).toEqual(
      expect.arrayContaining(["钙片", "铁剂", "复合维生素", "DHA", "黄体酮"]),
    );

    const calcium = slots.find((slot) => slot.meds.includes("钙片"));
    const iron = slots.find((slot) => slot.meds.includes("铁剂"));

    expect(calcium).toBeDefined();
    expect(iron).toBeDefined();
    expect(Math.abs(minutesBetween(calcium!.time, iron!.time))).toBeGreaterThanOrEqual(120);
    expect(iron!.reason).toContain("钙");
    expect(iron!.reason).toContain("2 小时");
    expect(slots.every((slot) => slot.reason.length > 12)).toBe(true);
    expect(slots.filter((slot) => slot.kind === "meal").map((slot) => slot.meds[0])).toEqual(["早餐", "午餐", "晚餐"]);
    expect(slots.find((slot) => slot.meds.includes("早餐"))?.menu).toContain("全熟鸡蛋");
  });

  it("rejects meal times outside the daily order", () => {
    expect(generateSchedule({ supplements: [], wakeTime: "07:00", sleepTime: "22:30", meals: { breakfast: "08:00", lunch: "07:30", dinner: "18:30" } })).toEqual([]);
  });
});
