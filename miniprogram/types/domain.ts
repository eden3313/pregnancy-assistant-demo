export type BabyCount = "single" | "twins" | "multiple";
export type RiskStatus = "no" | "yes" | "unknown";

export interface PersonalProfile {
  lastPeriod: string;
  babies: BabyCount;
  risk: RiskStatus;
  riskDetails: string;
  medications: string;
}

export interface PregnancyOverview {
  dueDate: string;
  trimester: string;
  gestationalAge: { totalDays: number; week: number; day: number; label: string };
  progressPercent: number;
  babyDescription: string;
  nextCheckup: { title: string; window: string; detail: string };
  reminders: string[];
}

export type ScheduleType = "meal" | "supplement" | "checkup" | "custom";
export interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  type: ScheduleType;
  title: string;
  note: string;
  completed: boolean;
}

export interface ExtractedReportDraft {
  sourceText: string;
  reportTitle: string;
  reportDate: string;
  items: Array<{ name: string; value: string; unit: string; sourceText: string }>;
  summary: string;
  terms: Array<{ term: string; definition: string }>;
  limitations: string;
}

export interface PersonalRecord {
  id: string;
  date: string;
  title: string;
  body: string;
  tags: string[];
  photoPath: string;
  extracted?: ExtractedReportDraft;
  createdAt: string;
  updatedAt: string;
}
