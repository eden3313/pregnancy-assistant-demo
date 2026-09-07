import { getPregnancyOverview, type PregnancyOverview } from "./pregnancy";

export interface PersonalProfile {
  lastPeriod: string;
  babies: "single" | "twins" | "multiple";
  risk: "no" | "yes" | "unknown";
  riskDetails: string;
  medications: string;
}
export const babyLabels = { single: "单胎", twins: "双胎", multiple: "多胎" };
export const riskLabels = { no: "未报告高危因素", yes: "有高危因素", unknown: "待医生确认" };
export const PROFILE_KEY = "pregnancy-profile-v1";
export const dateOnly = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const utcDate = (text: string) => new Date(text + "T00:00:00Z");

export function validateProfile(value: PersonalProfile, today = new Date()): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value.lastPeriod)) return "请选择末次月经第一天。";
  const date = utcDate(value.lastPeriod);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.lastPeriod) return "请输入有效日期。";
  const days = (utcDate(dateOnly(today)).getTime() - date.getTime()) / 86400000;
  if (days < 0) return "末次月经不能晚于今天。";
  if (days > 301) return "该日期已超过 43 周，请核对末次月经或向医生确认孕周。";
  if (!Object.prototype.hasOwnProperty.call(babyLabels, value.babies) || !Object.prototype.hasOwnProperty.call(riskLabels, value.risk)) return "请选择胎数和高危因素情况。";
  if (typeof value.riskDetails !== "string" || typeof value.medications !== "string") return "请核对输入的信息。";
  if (value.riskDetails.length > 1000 || value.medications.length > 2000) return "输入内容过长，请简要填写。";
  return "";
}

export function buildPersonalOverview(profile: PersonalProfile, today = new Date()): PregnancyOverview & { dueDate: string; trimester: string } {
  const error = validateProfile(profile, today);
  if (error) throw new Error(error);
  const due = utcDate(profile.lastPeriod);
  due.setUTCDate(due.getUTCDate() + 280);
  const dueDate = due.toISOString().slice(0, 10);
  const base = getPregnancyOverview({ motherName: "我的孕期", dueDate }, today);
  const week = base.gestationalAge.week;
  const personal: string[] = [];
  if (profile.babies !== "single") personal.push(`已记录${babyLabels[profile.babies]}：请与产科确认适合你的随访频率、超声计划与分娩安排。`);
  if (profile.risk === "yes") personal.push(`已记录高危因素${profile.riskDetails.trim() ? `：${profile.riskDetails.trim()}` : ""}。请把相关记录带给产科医生，确认个体化随访计划。`);
  if (profile.risk === "unknown") personal.push("高危因素尚未确认，下次就诊时请医生结合病史与检查评估。");
  if (profile.medications.trim()) personal.push(`当前用药已记录：${profile.medications.trim()}。就诊时核对药名、剂量及使用方式，请勿自行停药或调药。`);
  const individualized = profile.babies !== "single" || profile.risk === "yes";
  return { ...base, dueDate, trimester: week < 14 ? "孕早期" : week < 28 ? "孕中期" : "孕晚期",
    babyDescription: `${profile.babies === "single" ? "" : "以下为一般孕周发育信息，多个宝宝的实际生长需分别结合超声评估。"}${base.babyDescription}`,
    nextCheckup: individualized ? { title: "确认个体化产检计划", window: "以产科预约为准", detail: `已记录${babyLabels[profile.babies]}${profile.risk === "yes" ? "及高危因素" : ""}。请确认下一次随访日期；当前孕周的一般参考事项：${base.nextCheckup.title}。` } : base.nextCheckup,
    advice: [...personal, ...base.advice].slice(0, 5),
  };
}

export function readProfile(): PersonalProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateProfile(parsed) ? null : parsed;
  } catch { return null; }
}
