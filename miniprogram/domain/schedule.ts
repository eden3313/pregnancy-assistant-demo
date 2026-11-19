import type { MedicationPlan, MedicationRelation, ScheduleItem } from "../types/domain";

const relationLabels: Record<MedicationRelation, string> = {
  beforeMeal: "饭前",
  withMeal: "随餐",
  afterMeal: "饭后",
  fixedTime: "固定时间",
};

export function medicationRelationLabel(relation: MedicationRelation): string { return relationLabels[relation]; }

export function buildDefaultSchedule(date: string): ScheduleItem[] {
  return [
    { id: `breakfast-${date}`, date, time: "07:30", type: "meal", title: "早餐", note: "全谷物、蛋白质与奶类或替代品的通用搭配示例。", completed: false },
    { id: `lunch-${date}`, date, time: "12:30", type: "meal", title: "午餐", note: "主食、蛋白质和蔬菜均衡搭配。", completed: false },
    { id: `dinner-${date}`, date, time: "18:30", type: "meal", title: "晚餐", note: "按胃口选择适量主食、蛋白质和蔬菜。", completed: false },
  ];
}

function sort(items: ScheduleItem[]): ScheduleItem[] { return [...items].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)); }

function medicationItem(plan: MedicationPlan, date: string): ScheduleItem {
  return {
    id: `medication-${plan.id}-${date}`,
    date,
    time: plan.time,
    type: "medication",
    title: plan.name.trim(),
    note: `用户设置：${medicationRelationLabel(plan.relation)}${plan.instruction ? `；原文：${plan.instruction}` : ""}`,
    completed: false,
    sourceMedicationId: plan.id,
  };
}

export function syncDailySchedule(items: ScheduleItem[], date: string, plans: MedicationPlan[]): ScheduleItem[] {
  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const synced = items.flatMap((item) => {
    if (item.date !== date || !item.sourceMedicationId) return [item];
    const plan = planById.get(item.sourceMedicationId);
    if (!plan) return item.completed ? [item] : [];
    if (item.completed) return [item];
    return [{ ...medicationItem(plan, date), completed: false }];
  });

  for (const meal of buildDefaultSchedule(date)) if (!synced.some((item) => item.id === meal.id)) synced.push(meal);
  for (const plan of plans) {
    const id = `medication-${plan.id}-${date}`;
    if (!synced.some((item) => item.id === id)) synced.push(medicationItem(plan, date));
  }
  return sort(synced);
}

export function addScheduleItem(items: ScheduleItem[], item: ScheduleItem): ScheduleItem[] {
  if (items.some((current) => current.id === item.id)) throw new Error("日程编号重复。");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) throw new Error("请输入有效时间。");
  return sort([...items, item]);
}
export function updateScheduleItem(items: ScheduleItem[], item: ScheduleItem): ScheduleItem[] { return sort(items.map((current) => current.id === item.id ? item : current)); }
export function deleteScheduleItem(items: ScheduleItem[], id: string): ScheduleItem[] { return items.filter((item) => item.id !== id); }
export function toggleScheduleItem(items: ScheduleItem[], id: string): ScheduleItem[] { return items.map((item) => item.id === id ? { ...item, completed: !item.completed } : item); }
