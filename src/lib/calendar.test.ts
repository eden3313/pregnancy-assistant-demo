import { describe, expect, it } from "vitest";
import { buildIcs } from "./calendar";

describe("buildIcs", () => {
  it("exports one daily recurring event for every schedule slot", () => {
    const ics = buildIcs(
      [
        {
          kind: "meal",
          menu: "全麦面包 + 全熟鸡蛋",
          time: "07:00",
          meds: ["早餐"],
          reason: "均衡搭配。",
        },
        {
          time: "07:30",
          meds: ["复合维生素"],
          reason: "含 B 族维生素，建议早晨随餐。",
        },
        {
          time: "10:00",
          meds: ["铁剂"],
          reason: "与钙间隔 2 小时。",
        },
      ],
      {
        startDate: "2026-09-07",
        calendarName: "孕期补剂安排",
      },
    );

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain("RRULE:FREQ=DAILY");
    expect(ics).toContain("SUMMARY:孕期助手 - 铁剂");
    expect(ics).toContain("全麦面包 + 全熟鸡蛋");
  });
});
