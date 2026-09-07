import { describe, expect, it } from "vitest";
import { validateMealTimes } from "./meals";

describe("validateMealTimes", () => {
  it("accepts ordered meals inside waking hours", () => {
    expect(validateMealTimes({ breakfast: "07:30", lunch: "12:30", dinner: "18:30" }, "07:00", "22:30")).toBe("");
  });

  it("requires wake, meals and sleep to stay in order", () => {
    expect(validateMealTimes({ breakfast: "06:30", lunch: "12:30", dinner: "18:30" }, "07:00", "22:30")).toContain("顺序");
  });
});
