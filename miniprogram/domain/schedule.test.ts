import { describe, expect, it } from "vitest";
import { addScheduleItem, buildDefaultSchedule, syncDailySchedule, toggleScheduleItem } from "./schedule";

const plans = [
  { id: "folic", name: "叶酸", time: "07:00", relation: "beforeMeal" as const },
  { id: "iron", name: "铁剂", time: "20:00", relation: "afterMeal" as const },
];

describe("mini program schedule", () => {
  it("builds meals in chronological order", () => {
    const items = buildDefaultSchedule("2026-11-09");
    expect(items.slice(0, 3).map((item) => item.title)).toEqual(["早餐", "午餐", "晚餐"]);
    expect(items.map((item) => item.time)).toEqual([...items.map((item) => item.time)].sort());
  });

  it("adds and completes an item without mutating input", () => {
    const original = buildDefaultSchedule("2026-11-09");
    const added = addScheduleItem(original, { id: "custom-1", date: "2026-11-09", time: "20:00", type: "custom", title: "整理产检资料", note: "", completed: false });
    const toggled = toggleScheduleItem(added, "custom-1");
    expect(original).toHaveLength(3);
    expect(toggled.find((item) => item.id === "custom-1")?.completed).toBe(true);
  });

  it("generates meals and medication reminders exactly once per day", () => {
    const first = syncDailySchedule([], "2026-11-09", plans);
    const second = syncDailySchedule(first, "2026-11-09", plans);
    expect(first.filter((item) => item.type === "meal")).toHaveLength(3);
    expect(first.filter((item) => item.type === "medication").map((item) => [item.time, item.title, item.note])).toEqual([
      ["07:00", "叶酸", "用户设置：饭前"],
      ["20:00", "铁剂", "用户设置：饭后"],
    ]);
    expect(second).toEqual(first);
  });

  it("updates unfinished reminders but keeps completed same-day history unchanged", () => {
    const original = syncDailySchedule([], "2026-11-09", plans);
    const completed = toggleScheduleItem(original, "medication-folic-2026-11-09");
    const changedPlans = [{ id: "folic", name: "叶酸片", time: "08:00", relation: "withMeal" as const }];
    const synced = syncDailySchedule(completed, "2026-11-09", changedPlans);
    expect(synced.find((item) => item.id === "medication-folic-2026-11-09")).toMatchObject({ title: "叶酸", time: "07:00", completed: true });
    expect(synced.some((item) => item.sourceMedicationId === "iron")).toBe(false);
    const nextDay = syncDailySchedule(synced, "2026-11-10", changedPlans);
    expect(nextDay.find((item) => item.id === "medication-folic-2026-11-10")).toMatchObject({ title: "叶酸片", time: "08:00", completed: false });
  });

  it("keeps completed history when a medication plan is deleted", () => {
    const original = syncDailySchedule([], "2026-11-09", plans);
    const completed = toggleScheduleItem(original, "medication-folic-2026-11-09");
    const synced = syncDailySchedule(completed, "2026-11-09", []);
    expect(synced.find((item) => item.sourceMedicationId === "folic")?.completed).toBe(true);
    expect(synced.some((item) => item.sourceMedicationId === "iron")).toBe(false);
  });
});
