import { Download, Plus, Utensils, WandSparkles } from "lucide-react";
import { buildIcs } from "../lib/calendar";
import { mealSuggestions, validateMealTimes, type MealTimes } from "../lib/meals";
import type { ScheduleSlot } from "../lib/scheduler";
import { SUPPLEMENT_OPTIONS } from "../lib/scheduler";

interface SchedulerTabProps {
  schedule: ScheduleSlot[];
  mealTimes: MealTimes;
  setMealTimes: (value: MealTimes) => void;
  selectedSupplements: string[];
  setSelectedSupplements: (value: string[]) => void;
  wakeTime: string;
  setWakeTime: (value: string) => void;
  sleepTime: string;
  setSleepTime: (value: string) => void;
}

export function SchedulerTab({
  schedule,
  mealTimes,
  setMealTimes,
  selectedSupplements,
  setSelectedSupplements,
  wakeTime,
  setWakeTime,
  sleepTime,
  setSleepTime,
}: SchedulerTabProps) {
  const timeError = validateMealTimes(mealTimes, wakeTime, sleepTime);
  function toggleSupplement(name: string) {
    if (selectedSupplements.includes(name)) {
      setSelectedSupplements(selectedSupplements.filter((item) => item !== name));
      return;
    }

    setSelectedSupplements([...selectedSupplements, name]);
  }

  function downloadCalendar() {
    const ics = buildIcs(schedule, {
      startDate: new Date().toLocaleDateString("sv-SE"),
      calendarName: "孕期三餐与补剂安排",
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
        <p className="section-kicker">每日时间排程</p>
        <h2>把三餐和补剂放进一天</h2>
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
        <div className="meal-time-controls" aria-label="三餐时间">
          {mealSuggestions.map((meal) => (
            <label key={meal.key}>
              {meal.name}
              <input type="time" value={mealTimes[meal.key]} onChange={(event) => setMealTimes({ ...mealTimes, [meal.key]: event.target.value })} />
            </label>
          ))}
        </div>
        {timeError && <p className="agent-error" role="alert">{timeError}</p>}
        <p className="control-caption"><Utensils size={15} />餐食建议会随三餐一起显示并写入导出的日历。</p>
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
        <button type="button" className="primary-action" disabled={Boolean(timeError)} onClick={downloadCalendar}>
          <Download size={18} aria-hidden="true" />
          导出日历
        </button>
      </div>

      <div className="timeline-block">
        <div className="timeline-header">
          <WandSparkles size={18} aria-hidden="true" />
          <span>自动生成三餐与补剂排程</span>
        </div>
        <ol className="timeline">
          {schedule.map((slot) => (
            <li key={`${slot.time}-${slot.meds.join("-")}`} className="timeline-item">
              <time>{slot.time}</time>
              <div className={slot.kind === "meal" ? "timeline-card meal-card" : "timeline-card"}>
                <strong>{slot.meds.join("、")}</strong>
                {slot.menu && <p className="meal-menu">{slot.menu}</p>}
                <p>{slot.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="disclaimer schedule-disclaimer">餐食内容是通用搭配示例，请结合过敏、糖代谢情况、医生或营养师建议调整。药物和补剂的用法以医嘱与产品说明为准。</p>
    </section>
  );
}
