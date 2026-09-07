export interface PregnancyProfile {
  motherName: string;
  dueDate: string;
}

export interface GestationalAge {
  totalDays: number;
  week: number;
  day: number;
  label: string;
}

export interface CheckupTask {
  title: string;
  window: string;
  detail: string;
}

export interface PregnancyOverview {
  profileName: string;
  gestationalAge: GestationalAge;
  progressPercent: number;
  babyDescription: string;
  nextCheckup: CheckupTask;
  advice: string[];
}

interface CheckupNode {
  startWeek: number;
  endWeek: number;
  task: CheckupTask;
}

const PREGNANCY_TOTAL_DAYS = 280;

const CHECKUP_NODES: CheckupNode[] = [
  {
    startWeek: 12,
    endWeek: 14,
    task: {
      title: "NT 检查与早期产检建档",
      window: "11-13w+6d",
      detail: "确认胎儿早期结构筛查结果，补齐基础化验和建档信息。",
    },
  },
  {
    startWeek: 16,
    endWeek: 20,
    task: {
      title: "唐筛或无创结果确认",
      window: "16-20w",
      detail: "整理筛查结果，带着异常项或未完成项目去门诊确认。",
    },
  },
  {
    startWeek: 20,
    endWeek: 24,
    task: {
      title: "系统超声大排畸",
      window: "20-24w",
      detail: "重点归档胎儿结构超声结果和医生嘱托。",
    },
  },
  {
    startWeek: 24,
    endWeek: 28,
    task: {
      title: "糖耐筛查 + 血常规复查",
      window: "24-28w",
      detail: "提前确认糖耐流程，把血红蛋白、尿常规和补剂安排一起带给医生看。",
    },
  },
  {
    startWeek: 28,
    endWeek: 32,
    task: {
      title: "胎儿生长与胎位复查",
      window: "28-32w",
      detail: "对比近期体重、血压和超声记录，准备胎动与睡眠相关问题。",
    },
  },
  {
    startWeek: 32,
    endWeek: 36,
    task: {
      title: "晚孕期常规产检",
      window: "32-36w",
      detail: "产检频率逐步提高，整理胎心监护、血压和待产准备事项。",
    },
  },
  {
    startWeek: 36,
    endWeek: 41,
    task: {
      title: "足月后每周产检",
      window: "36w 后",
      detail: "关注胎动、宫缩、见红、破水等情况，把分娩问题清单带去门诊。",
    },
  },
];

export function getPregnancyOverview(
  profile: PregnancyProfile,
  today = new Date(),
): PregnancyOverview {
  const gestationalAge = getGestationalAge(profile.dueDate, today);
  const nextCheckup = getNextCheckup(gestationalAge.week);

  return {
    profileName: profile.motherName,
    gestationalAge,
    progressPercent: Math.min(
      100,
      Math.max(0, Math.round((gestationalAge.totalDays / PREGNANCY_TOTAL_DAYS) * 100)),
    ),
    babyDescription: describeBaby(gestationalAge.week),
    nextCheckup,
    advice: getAdvice(gestationalAge.week),
  };
}

export function getGestationalAge(dueDate: string, today = new Date()): GestationalAge {
  const due = parseDateOnly(dueDate);
  const current = stripTime(today);
  const daysUntilDue = Math.round((due.getTime() - current.getTime()) / 86_400_000);
  const totalDays = Math.max(0, PREGNANCY_TOTAL_DAYS - daysUntilDue);
  const week = Math.floor(totalDays / 7);
  const day = totalDays % 7;

  return {
    totalDays,
    week,
    day,
    label: `${week}w+${day}d`,
  };
}

export function getNextCheckup(week: number): CheckupTask {
  if (week < 11) return { title: "首次产检与孕周确认", window: "与产科预约确认", detail: "携带末次月经日期与用药清单，和医生确认孕周、建档及后续筛查安排。" };
  if (week >= 40) return { title: "确认预产期后的随访安排", window: "及时联系产科", detail: "请与产科确认复查与分娩计划，不要仅依赖本页面的一般时间安排。" };
  return (
    CHECKUP_NODES.find((node) => week < node.endWeek)?.task ??
    CHECKUP_NODES[CHECKUP_NODES.length - 1].task
  );
}

function describeBaby(week: number): string {
  if (week < 16) {
    return "宝宝的主要器官正在快速发育，接下来几周会逐渐进入更稳定的生长节奏。";
  }

  if (week < 24) {
    return "宝宝的骨骼和肌肉更有力量，胎动会变得更容易被感受到。";
  }

  if (week < 29) {
    return "宝宝的听觉正在变敏锐，可能会对熟悉的声音和妈妈的作息节奏有反应。";
  }

  if (week < 36) {
    return "宝宝进入体重增长更明显的阶段，胎动规律和妈妈的休息状态值得一起记录。";
  }

  return "宝宝已经接近足月，接下来要把胎动、产检和入院准备事项放在更醒目的位置。";
}

function getAdvice(week: number): string[] {
  if (week < 24) {
    return ["记录近期不适和想向医生了解的问题。", "把每次报告拍照归档，保留原始数值。", "将药物、补剂名称及用法整理好，供医生核对。"];
  }

  if (week < 29) {
    return [
      "糖耐和血常规结果出来后，先整理成问题清单再去问医生。",
      "钙和铁尽量错开 2 小时，避免互相影响吸收。",
      "观察胎动规律，不用追求次数完美，但要留意明显变化。",
    ];
  }

  return ["产检频率会提高，提前把报告和问题清单放在一起。", "继续记录血压、体重和胎动变化，看趋势比看单点更有用。", "睡眠和活动量尽量保持稳定，异常不适及时联系医生。"];
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function stripTime(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}
