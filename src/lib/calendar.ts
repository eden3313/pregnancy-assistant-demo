import type { ScheduleSlot } from "./scheduler";

export interface IcsOptions {
  startDate: string;
  calendarName: string;
}

export function buildIcs(slots: ScheduleSlot[], options: IcsOptions): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pregnancy Assistant Demo//CN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcs(options.calendarName)}`,
  ];

  slots.forEach((slot, index) => {
    const stamp = toIcsDateTime(options.startDate, slot.time);
    lines.push(
      "BEGIN:VEVENT",
      `UID:pregnancy-assistant-${options.startDate}-${slot.time}-${index}@demo`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${stamp}`,
      `DTEND:${toIcsDateTime(options.startDate, addMinutes(slot.time, 15))}`,
      "RRULE:FREQ=DAILY",
      `SUMMARY:${escapeIcs(`孕期助手 - ${slot.meds.join("、")}`)}`,
      `DESCRIPTION:${escapeIcs([slot.menu, slot.reason].filter(Boolean).join("\n"))}`,
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function toIcsDateTime(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

function addMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
