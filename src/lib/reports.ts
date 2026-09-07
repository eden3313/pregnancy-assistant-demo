export interface ReportMetrics {
  hb?: number;
  hcg?: number;
  systolic?: number;
  diastolic?: number;
}

export interface ReportRecord {
  gestationalDay?: number;
  source?: "live" | "demo";
  id: string;
  date: string;
  gestationalWeek: number;
  metrics: ReportMetrics;
}

export interface AnalyzeReportInput {
  gestationalWeek: number;
  metrics: ReportMetrics;
  history: ReportRecord[];
}

export interface MetricPoint {
  week: number;
  value: number;
  label: string;
}

export interface ReportAnalysis {
  plainLanguage: string;
  deviationNotes: string[];
  doctorQuestions: string[];
  trendSummary: string;
  trendPoints: MetricPoint[];
}

export function analyzeReport(input: AnalyzeReportInput): ReportAnalysis {
  const currentHb = input.metrics.hb;
  const historyPoints = input.history
    .filter((record) => typeof record.metrics.hb === "number")
    .map((record) => ({
      week: record.gestationalWeek,
      value: record.metrics.hb as number,
      label: `${record.gestationalWeek}w`,
    }))
    .sort((a, b) => a.week - b.week);

  const trendPoints =
    typeof currentHb === "number"
      ? [
          ...historyPoints,
          {
            week: input.gestationalWeek,
            value: currentHb,
            label: `${input.gestationalWeek}w 本次`,
          },
        ]
      : historyPoints;

  return {
    plainLanguage: buildPlainLanguage(input),
    deviationNotes: buildDeviationNotes(input),
    doctorQuestions: buildDoctorQuestions(input, historyPoints),
    trendSummary: buildTrendSummary(currentHb, historyPoints),
    trendPoints,
  };
}

function buildPlainLanguage(input: AnalyzeReportInput): string {
  if (typeof input.metrics.hb !== "number") {
    return "这份报告已归档。当前 demo 主要展示血红蛋白 Hb 的趋势整理，其他指标先保留记录位置。";
  }

  return `血红蛋白 Hb 是血常规里观察携氧能力的指标。本次记录为 ${input.metrics.hb} g/L，建议和孕周、既往记录一起带给医生确认，而不是只看化验单上的成人参考箭头。`;
}

function buildDeviationNotes(input: AnalyzeReportInput): string[] {
  const notes: string[] = [];
  const hb = input.metrics.hb;

  if (typeof hb === "number") {
    const reference = getHbObservationBand(input.gestationalWeek);
    if (hb < reference.low) {
      notes.push(
        `Hb ${hb} g/L 低于当前孕周观察带 ${reference.low}-${reference.high} g/L；孕中期可能出现生理性血液稀释，但是否需要补铁、复查或调整饮食应在门诊确认。`,
      );
    } else {
      notes.push(
        `Hb ${hb} g/L 位于当前孕周观察带 ${reference.low}-${reference.high} g/L 内；孕中期常见生理性血液稀释，继续看趋势比单次箭头更有意义。`,
      );
    }
  }

  if (typeof input.metrics.hcg === "number") {
    notes.push(`HCG 已记录为 ${input.metrics.hcg}，本 demo 暂做归档展示，不输出诊断结论。`);
  }

  return notes.length > 0 ? notes : ["本次报告已归档，暂未发现可用于趋势展示的 demo 指标。"];
}

function buildDoctorQuestions(input: AnalyzeReportInput, historyPoints: MetricPoint[]): string[] {
  const hb = input.metrics.hb;
  const previous = historyPoints[historyPoints.length - 1];

  if (typeof hb !== "number") {
    return ["这份报告里哪些指标需要我下次复查时重点说明？", "是否有需要补充上传的报告页或医生嘱托？"];
  }

  const fromText = previous ? `从 ${previous.value} 到 ${hb}` : `目前是 ${hb}`;

  return [
    `我的血红蛋白 ${fromText}，需要开始补铁或调整现有补剂吗？`,
    "钙片和铁剂需要间隔多久，是否要避开茶、咖啡或奶制品？",
    "下次血常规建议什么时候复查，是否需要同时看铁蛋白？",
  ];
}

function buildTrendSummary(currentHb: number | undefined, historyPoints: MetricPoint[]): string {
  if (typeof currentHb !== "number") {
    return "当前没有可计算趋势的 Hb 数值。";
  }

  const previous = historyPoints[historyPoints.length - 1];
  if (!previous) {
    return `这是第一条 Hb 记录：${currentHb} g/L。`;
  }

  const delta = currentHb - previous.value;
  const percent = Math.abs((delta / previous.value) * 100).toFixed(1);
  const direction = delta >= 0 ? "上升" : "下降";

  return `较上次${direction} ${percent}%（${previous.value} -> ${currentHb} g/L）。`;
}

function getHbObservationBand(week: number): { low: number; high: number } {
  if (week < 14) {
    return { low: 110, high: 150 };
  }

  if (week < 29) {
    return { low: 105, high: 145 };
  }

  return { low: 105, high: 145 };
}
