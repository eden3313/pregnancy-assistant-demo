import { CalendarDays, ClipboardList, HeartPulse, Pill } from "lucide-react";
import { useMemo, useState } from "react";
import { defaultSupplements, demoProfile, reportHistory } from "./data/seed";
import { getPregnancyOverview } from "./lib/pregnancy";
import type { ReportRecord } from "./lib/reports";
import { generateSchedule } from "./lib/scheduler";
import { OverviewTab } from "./components/OverviewTab";
import { ReportsTab } from "./components/ReportsTab";
import { SchedulerTab } from "./components/SchedulerTab";
import { TabButton } from "./components/TabButton";

type TabId = "overview" | "scheduler" | "reports";

const DEMO_TODAY = new Date("2026-09-06T08:00:00+08:00");

const tabs = [
  { id: "overview" as const, label: "孕期状态", icon: HeartPulse },
  { id: "scheduler" as const, label: "时间排程", icon: Pill },
  { id: "reports" as const, label: "报告归档", icon: ClipboardList },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedSupplements, setSelectedSupplements] = useState(defaultSupplements);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("22:30");
  const [records, setRecords] = useState<ReportRecord[]>(reportHistory);

  const overview = useMemo(() => getPregnancyOverview(demoProfile, DEMO_TODAY), []);
  const schedule = useMemo(
    () =>
      generateSchedule({
        supplements: selectedSupplements,
        wakeTime,
        sleepTime,
      }),
    [selectedSupplements, sleepTime, wakeTime],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">孕期私人助手 MVP</p>
          <h1>今天该做的三件事</h1>
        </div>
        <div className="privacy-badge">
          <CalendarDays size={16} aria-hidden="true" />
          本地 demo
        </div>
      </header>

      <nav className="tab-nav" aria-label="功能切换">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </nav>

      <main>
        {activeTab === "overview" && <OverviewTab overview={overview} />}
        {activeTab === "scheduler" && (
          <SchedulerTab
            schedule={schedule}
            selectedSupplements={selectedSupplements}
            setSelectedSupplements={setSelectedSupplements}
            sleepTime={sleepTime}
            setSleepTime={setSleepTime}
            wakeTime={wakeTime}
            setWakeTime={setWakeTime}
          />
        )}
        <div hidden={activeTab !== "reports"}>
          <ReportsTab
            records={records}
            onSave={(record) => setRecords(current => [...current, record])}
          />
        </div>
      </main>
    </div>
  );
}
