import { describe, expect, it } from "vitest";
import { analyzeReport } from "./reports";

describe("analyzeReport", () => {
  it("turns a new Hb result into plain language, trend text, and doctor questions", () => {
    const analysis = analyzeReport({
      gestationalWeek: 26,
      metrics: {
        hb: 105,
      },
      history: [
        { id: "w12", date: "2026-06-01", gestationalWeek: 12, metrics: { hb: 128 } },
        { id: "w20", date: "2026-07-27", gestationalWeek: 20, metrics: { hb: 112 } },
      ],
    });

    expect(analysis.plainLanguage).toContain("血红蛋白");
    expect(analysis.deviationNotes.join("")).toContain("生理性血液稀释");
    expect(analysis.trendSummary).toContain("较上次下降");
    expect(analysis.doctorQuestions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("血红蛋白"),
        expect.stringContaining("补铁"),
      ]),
    );
    expect(analysis.trendPoints).toHaveLength(3);
  });
});
