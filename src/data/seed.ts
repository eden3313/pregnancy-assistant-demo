import type { PregnancyProfile } from "../lib/pregnancy";
import type { ReportRecord } from "../lib/reports";

export const demoProfile: PregnancyProfile = {
  motherName: "林小姐",
  dueDate: "2026-12-10",
};

export const defaultSupplements = ["钙片", "铁剂", "复合维生素", "DHA", "黄体酮"];

export const reportHistory: ReportRecord[] = [
  {
    id: "report-12",
    date: "2026-06-01",
    gestationalWeek: 12,
    metrics: {
      hb: 128,
      hcg: 78_000,
    },
  },
  {
    id: "report-20",
    date: "2026-07-27",
    gestationalWeek: 20,
    metrics: {
      hb: 112,
      hcg: 21_000,
    },
  },
];
