import { defaultMealTimes, mealSuggestions, validateMealTimes, type MealTimes } from "./meals";

export interface ScheduleInput {
  meals?: MealTimes;
  supplements: string[];
  wakeTime: string;
  sleepTime: string;
}

export interface ScheduleSlot {
  kind?: "meal" | "supplement";
  menu?: string;
  time: string;
  meds: string[];
  reason: string;
}

export const SUPPLEMENT_OPTIONS = [
  "钙片",
  "铁剂",
  "复合维生素",
  "DHA",
  "叶酸",
  "维生素 D",
  "黄体酮",
  "益生菌",
];

export function generateSchedule(input: ScheduleInput): ScheduleSlot[] {
  const selected = new Set(input.supplements);
  const slots: ScheduleSlot[] = [];
  const wake = timeToMinutes(input.wakeTime);
  const sleep = timeToMinutes(input.sleepTime);
  const meals = input.meals || defaultMealTimes;
  if (input.meals && validateMealTimes(meals, input.wakeTime, input.sleepTime)) return [];
  const breakfast = timeToMinutes(meals.breakfast);
  const lunch = timeToMinutes(meals.lunch);
  if (input.meals) for (const meal of mealSuggestions) slots.push({ kind: "meal", time: meals[meal.key], meds: [meal.name], menu: meal.menu, reason: meal.reason });

  if (selected.has("益生菌")) {
    slots.push({
      time: minutesToTime(clampToDay(wake + 15, wake, sleep)),
      meds: ["益生菌"],
      reason: "放在起床后，便于和早餐前后形成固定动作；具体空腹或餐后以产品说明和医生嘱托为准。",
    });
  }

  const morningMeds = ["复合维生素", "叶酸"].filter((med) => selected.has(med));
  if (morningMeds.length > 0) {
    slots.push({
      time: minutesToTime(clampToDay(Math.max(wake + 30, breakfast), wake, sleep)),
      meds: morningMeds,
      reason: "早餐附近的示例提醒；是否随餐以及是否与其他补剂重复，以产品说明和医嘱为准。",
    });
  }

  if (selected.has("铁剂")) {
    slots.push({
      time: minutesToTime(clampToDay(Math.max(wake + 180, breakfast + 150), wake, sleep)),
      meds: ["铁剂"],
      reason: "与钙片间隔至少 2 小时，避免二者在肠道吸收时互相竞争；是否空腹按医生或说明书执行。",
    });
  }

  const lunchMeds = ["钙片", "维生素 D", "DHA"].filter((med) => selected.has(med));
  if (lunchMeds.length > 0) {
    const ironSlot = slots.find((slot) => slot.meds.includes("铁剂"));
    const earliestCalcium = ironSlot ? timeToMinutes(ironSlot.time) + 150 : lunch;

    slots.push({
      time: minutesToTime(clampToDay(Math.max(lunch, earliestCalcium), wake, sleep)),
      meds: lunchMeds,
      reason: "午餐附近的示例提醒；为与铁剂错开可能顺延。具体用法以产品说明和医嘱为准。",
    });
  }

  if (selected.has("黄体酮")) {
    slots.push({
      time: minutesToTime(clampToDay(sleep - 60, wake, sleep)),
      meds: ["黄体酮"],
      reason: "按医嘱固定在睡前附近，减少白天遗漏；剂量和停用时间只跟随医生安排。",
    });
  }

  return mergeSameTimeSlots(slots).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export function minutesBetween(a: string, b: string): number {
  return timeToMinutes(a) - timeToMinutes(b);
}

export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function minutesToTime(value: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, value));
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function clampToDay(value: number, wake: number, sleep: number): number {
  return Math.max(wake, Math.min(sleep - 15, value));
}

function mergeSameTimeSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  const byTime = new Map<string, ScheduleSlot>();

  slots.forEach((slot) => {
    const key = `${slot.time}-${slot.kind || "supplement"}`;
    const existing = byTime.get(key);
    if (!existing) {
      byTime.set(key, { ...slot });
      return;
    }

    existing.meds = [...existing.meds, ...slot.meds];
    existing.reason = `${existing.reason} ${slot.reason}`;
  });

  return Array.from(byTime.values());
}
