import { describe, expect, it } from "vitest";
import { DEFAULT_MEAL_TIMES, parseMedicationTiming } from "./medication-timing";

describe("explicit medication timing", () => {
  it.each([
    ["早饭前30分钟吃", "07:00", "beforeMeal"],
    ["每日一次，午餐后半小时服用", "13:00", "afterMeal"],
    ["随早餐", "07:30", "withMeal"],
    ["晚饭时吃药", "18:30", "withMeal"],
    ["每日8:05", "08:05", "fixedTime"],
  ])("parses %s", (text, time, relation) => {
    expect(parseMedicationTiming(text, DEFAULT_MEAL_TIMES)).toMatchObject({ ok: true, time, relation });
  });
  it.each(["早餐前吃", "饭前", "早餐", "睡前", "空腹", "每天两次早餐前30分钟", "早餐前30分钟或晚餐后30分钟", "不要早餐前30分钟吃", "每日25:00", "随早餐前30分钟", "早餐前30分钟，晚餐后30分钟"])("requires clarification for %s", text => {
    expect(parseMedicationTiming(text, DEFAULT_MEAL_TIMES).ok).toBe(false);
  });
  it("uses the user's meal time and rejects crossing midnight", () => {
    expect(parseMedicationTiming("早餐前30分钟", { ...DEFAULT_MEAL_TIMES, breakfast: "09:00" })).toMatchObject({ time: "08:30" });
    expect(parseMedicationTiming("早餐前2小时", { ...DEFAULT_MEAL_TIMES, breakfast: "01:00" }).ok).toBe(false);
  });
});
