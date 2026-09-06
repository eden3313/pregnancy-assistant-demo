import { Download, Plus, WandSparkles } from "lucide-react";
import { buildIcs } from "../lib/calendar";
import type { ScheduleSlot } from "../lib/scheduler";
import { SUPPLEMENT_OPTIONS } from "../lib/scheduler";

interface SchedulerTabProps {
  schedule: ScheduleSlot[];
  selectedSupplements: string[];
  setSelectedSupplements: (value: string[]) => void;
  wakeTime: string;
  setWakeTime: (value: string) => void;
  sleepTime: string;
  setSleepTime: (value: string) => void;
}

export function SchedulerTab({
  schedule,
  selectedSupplements,
  setSelectedSupplements,
  wakeTime,
  setWakeTime,
  sleepTime,
  setSleepTime,
}: SchedulerTabProps) {
  function toggleSupplement(name: string) {
    if (selectedSupplements.includes(name)) {
      setSelectedSupplements(selectedSupplements.filter((item) => item !== name));
      return;
    }

    setSelectedSupplements([...selectedSupplements, name]);
  }

  function downloadCalendar() {
    const ics = buildIcs(schedule, {
      startDate: "2026-09-07",
      calendarName: "孕期补剂安排",
    });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pregnancy-supplement-schedule.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="tab-panel scheduler-layout" aria-label="补剂时间排程">
      <div className="section-block controls-block">
        <p className="section-kicker">补剂时间排程</p>
        <h2>把药盒变成今天的时间表</h2>
        <div className="time-controls">
          <label>
            起床
            <input type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} />
          </label>
          <label>
            睡觉
            <input type="time" value={sleepTime} onChange={(event) => setSleepTime(event.target.value)} />
          </label>
        </div>
        <div className="supplement-grid" aria-label="常见孕期补剂">
          {SUPPLEMENT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={selectedSupplements.includes(item) ? "chip is-selected" : "chip"}
              onClick={() => toggleSupplement(item)}
            >
              <Plus size={14} aria-hidden="true" />
              {item}
            </button>
          ))}
        </div>
        <button type="button" className="primary-action" onClick={downloadCalendar}>
          <Download size={18} aria-hidden="true" />
          导出日历
        </button>
      </div>

      <div className="timeline-block">
        <div className="timeline-header">
          <WandSparkles size={18} aria-hidden="true" />
          <span>自动生成排程</span>
        </div>
        <ol className="timeline">
          {schedule.map((slot) => (
            <li key={`${slot.time}-${slot.meds.join("-")}`} className="timeline-item">
              <time>{slot.time}</time>
              <div className="timeline-card">
                <strong>{slot.meds.join("、")}</strong>
                <p>{slot.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
