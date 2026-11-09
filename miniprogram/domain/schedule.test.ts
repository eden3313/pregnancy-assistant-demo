import { describe, expect, it } from "vitest";
import { addScheduleItem, buildDefaultSchedule, toggleScheduleItem } from "./schedule";

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
});
