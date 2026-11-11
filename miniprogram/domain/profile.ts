import type { PersonalProfile, PregnancyOverview } from "../types/domain";

const DAY = 86_400_000;
const TOTAL_DAYS = 280;

function utcDate(value: string): Date { return new Date(`${value}T00:00:00Z`); }
function dateOnly(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function validateProfile(value: PersonalProfile, today = new Date()): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.lastPeriod)) return "请选择末次月经第一天。";
  const start = utcDate(value.lastPeriod);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== value.lastPeriod) return "请输入有效日期。";
  const days = (utcDate(dateOnly(today)).getTime() - start.getTime()) / DAY;
  if (days < 0) return "末次月经不能晚于今天。";
  if (days > 301) return "该日期已超过 43 周，请核对后再填写。";
  if (!["single", "twins", "multiple"].includes(value.babies)) return "请选择胎数。";
  if (!["no", "yes", "unknown"].includes(value.risk)) return "请选择高危因素情况。";
  if (value.riskDetails.length > 500 || value.legacyMedicationNotes.length > 1000) return "输入内容过长，请简要填写。";
  if (!Array.isArray(value.medications)) return "请重新填写用药记录。";
  const relations = ["beforeMeal", "withMeal", "afterMeal", "fixedTime"];
  for (const medication of value.medications) {
    if (!medication.name.trim()) return "请填写药物名称。";
    if (medication.name.trim().length > 100) return "药物名称过长，请简要填写。";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(medication.time)) return "请选择有效的服用时间。";
    if (!relations.includes(medication.relation)) return "请选择饭前、随餐、饭后或固定时间。";
    if (!medication.id) return "用药记录编号缺失，请删除后重新添加。";
  }
  if (new Set(value.medications.map((item) => item.id)).size !== value.medications.length) return "用药记录编号重复，请删除后重新添加。";
  return "";
}

function nextCheckup(week: number): PregnancyOverview["nextCheckup"] {
  if (week < 11) return { title: "首次产检与孕周确认", window: "与产科预约确认", detail: "携带末次月经日期和用药记录，确认建档及后续筛查安排。" };
  if (week < 14) return { title: "NT 检查与早期建档", window: "11-13w+6d", detail: "整理基础化验、既往病史和需要向医生确认的问题。" };
  if (week < 20) return { title: "筛查结果确认", window: "16-20w", detail: "按医生安排确认唐筛、无创或其他检查结果。" };
  if (week < 24) return { title: "系统超声", window: "20-24w", detail: "携带既往报告，记录医生说明和后续安排。" };
  if (week < 28) return { title: "糖耐与常规复查", window: "24-28w", detail: "提前确认检查流程和是否需要空腹。" };
  if (week < 36) return { title: "晚孕期常规产检", window: "以产科预约为准", detail: "整理近期体重、血压、胎动和不适记录。" };
  return { title: "足月后产检安排", window: "及时联系产科", detail: "确认复查频率、分娩准备和入院流程。" };
}

function babyDescription(week: number): string {
  if (week < 16) return "宝宝的主要器官仍在快速发育，身体轮廓逐渐清晰。";
  if (week < 24) return "宝宝的骨骼和肌肉逐渐有力，胎动可能更容易被感受到。";
  if (week < 29) return "宝宝的听觉逐渐敏锐，也在形成自己的活动节奏。";
  if (week < 36) return "宝宝进入体重增长更明显的阶段。";
  return "宝宝已经接近足月，请按产科安排完成每次检查。";
}

function babySizeComparison(week: number): PregnancyOverview["babySizeComparison"] {
  const label = week < 8 ? "约一颗蓝莓大小" :
    week < 12 ? "约一颗草莓大小" :
    week < 16 ? "约一个牛油果大小" :
    week < 20 ? "约一根香蕉大小" :
    week < 24 ? "约一根玉米大小" :
    week < 28 ? "约一颗花椰菜大小" :
    week < 32 ? "约一个椰子大小" :
    week < 36 ? "约一个哈密瓜大小" : "约一个小南瓜大小";
  return { label, disclaimer: "仅作直观参考，个体差异较大，以产检结果为准。" };
}

export function buildPregnancyOverview(profile: PersonalProfile, today = new Date()): PregnancyOverview {
  const error = validateProfile(profile, today);
  if (error) throw new Error(error);
  const start = utcDate(profile.lastPeriod);
  const current = utcDate(dateOnly(today));
  const totalDays = Math.max(0, Math.round((current.getTime() - start.getTime()) / DAY));
  const week = Math.floor(totalDays / 7);
  const day = totalDays % 7;
  const due = new Date(start);
  due.setUTCDate(due.getUTCDate() + TOTAL_DAYS);
  const reminders: string[] = ["记录近期不适和准备向医生确认的问题。", "按预约时间完成产检并保存原始报告。"];
  if (profile.risk !== "no") reminders.unshift("已记录高危因素信息，请在产检时向医生完整说明。");
  if (profile.medications.length || profile.legacyMedicationNotes.trim()) reminders.unshift("已记录当前用药，请携带原包装或处方与医生核对。");
  return {
    dueDate: due.toISOString().slice(0, 10),
    trimester: week < 14 ? "孕早期" : week < 28 ? "孕中期" : "孕晚期",
    gestationalAge: { totalDays, week, day, label: `${week}w+${day}d` },
    progressPercent: Math.min(100, Math.max(0, Math.round(totalDays / TOTAL_DAYS * 100))),
    babyDescription: babyDescription(week), babySizeComparison: babySizeComparison(week), nextCheckup: nextCheckup(week), reminders,
  };
}
