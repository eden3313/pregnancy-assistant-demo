export interface MealTimes { breakfast: string; lunch: string; dinner: string }
export const defaultMealTimes: MealTimes = { breakfast: "07:30", lunch: "12:30", dinner: "18:30" };
export const mealSuggestions = [
  { key: "breakfast" as const, name: "早餐", menu: "燕麦或全麦面包 + 全熟鸡蛋 + 巴氏杀菌奶或无糖强化豆奶", reason: "搭配全谷物、蛋白质与奶类或替代品；按胃口调整，尽量不以甜饮料代替早餐。" },
  { key: "lunch" as const, name: "午餐", menu: "杂粮饭 + 清蒸鱼或豆腐 + 两种蔬菜", reason: "主食、蛋白质和蔬菜搭配；鱼肉充分煮熟，蔬菜洗净，少选高盐加工食品。" },
  { key: "dinner" as const, name: "晚餐", menu: "米饭或薯类 + 瘦肉或豆类 + 时蔬", reason: "保留适量主食，搭配蛋白质与蔬菜；根据饥饿感选择份量，避免靠大量甜点补充能量。" },
];
export function validateMealTimes(meals: MealTimes, wake: string, sleep: string): string {
  const values = [wake, meals.breakfast, meals.lunch, meals.dinner, sleep];
  if (values.some(value => !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))) return "请填写完整的起床、三餐和睡觉时间。";
  if (values.some((value, index) => index > 0 && value <= values[index - 1])) return "请按同一天的起床、早餐、午餐、晚餐、睡觉顺序设置时间。";
  return "";
}
