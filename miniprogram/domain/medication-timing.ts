import type { MedicationRelation } from "../types/domain";

export interface MealTimes { breakfast: string; lunch: string; dinner: string }
export const DEFAULT_MEAL_TIMES: MealTimes = { breakfast: "07:30", lunch: "12:30", dinner: "18:30" };
export type TimingResult = { ok: true; time: string; relation: MedicationRelation; explanation: string } | { ok: false; message: string };
const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

// Only translate explicit timing instructions; never infer a regimen from a medicine name.
export function parseMedicationTiming(instruction: string, meals: MealTimes): TimingResult {
  const text = instruction.trim().replace(/\s+/g, "");
  const fail = (message: string): TimingResult => ({ ok: false, message });
  if (!text) return fail("请填写服用时间要求，例如：早餐前30分钟。");
  if (/或|必要时|按需|隔日|每周|不|勿|禁止|空腹|睡前|起床|小时后再/.test(text)) return fail("这条要求需要人工核对，请手动设置时间并保留原文。");
  if (/(?:每日|每天|一天)[二三四五六七八九两2-9]次|每餐|三餐/.test(text)) return fail("多次服用请分别添加记录，并逐条确认时间。");
  const prefix = "(?:(?:每天|每日)(?:一次|1次)?[，,：:]?)?";
  const suffix = "(?:服用|服药|吃|吃药)?[。！!]?";
  const fixed = text.match(new RegExp(`^${prefix}(\\d{1,2})[:：](\\d{2})${suffix}$`));
  if (fixed) {
    const time = `${fixed[1].padStart(2, "0")}:${fixed[2]}`;
    return validTime(time) ? { ok: true, time, relation: "fixedTime", explanation: `按填写的固定时间 ${time}` } : fail("请输入有效的24小时制时间。");
  }
  const match = text.match(new RegExp(`^${prefix}(随)?(早餐|早饭|午餐|午饭|晚餐|晚饭)(前|后|时)?(半小时|\\d+(?:分钟|小时))?${suffix}$`));
  if (!match) return fail("未能明确识别，请写成“早餐前30分钟”“随午餐”或“每日20:00”；复杂要求请手动设置。");
  const [, withMeal, meal, direction, duration] = match;
  if ((withMeal && (direction === "前" || direction === "后")) || ((!direction || direction === "时" || withMeal) && duration)) return fail("时间要求存在冲突，请核对后重新填写。");
  if (!withMeal && !direction) return fail("请补充餐前、餐后或随餐。");
  if ((direction === "前" || direction === "后") && !duration) return fail("请补充提前或延后多久，例如：早餐前30分钟。");
  const key = meal.startsWith("早") ? "breakfast" : meal.startsWith("午") ? "lunch" : "dinner";
  const base = meals[key];
  if (!validTime(base)) return fail("请先设置有效的三餐时间。");
  const minutes = !duration ? 0 : duration === "半小时" ? 30 : parseInt(duration, 10) * (duration.endsWith("小时") ? 60 : 1);
  const [hour, minute] = base.split(":").map(Number);
  const total = hour * 60 + minute + (direction === "前" ? -minutes : minutes);
  if (total < 0 || total >= 1440) return fail("计算结果跨天，请手动确认日期和时间。");
  const time = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return { ok: true, time, relation: direction === "前" ? "beforeMeal" : direction === "后" ? "afterMeal" : "withMeal", explanation: `${meal} ${base}，按“${instruction.trim()}”安排为 ${time}` };
}
