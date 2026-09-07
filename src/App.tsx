import { ClipboardList, Heart, HeartPulse, Pill, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { defaultSupplements } from "./data/seed";
import { buildPersonalOverview, readProfile, PROFILE_KEY, type PersonalProfile } from "./lib/profile";
import { ProfilePage } from "./components/ProfilePage";
import type { ReportRecord } from "./lib/reports";
import { generateSchedule } from "./lib/scheduler";
import { defaultMealTimes, type MealTimes } from "./lib/meals";
import { OverviewTab } from "./components/OverviewTab";
import { ReportsTab } from "./components/ReportsTab";
import { SchedulerTab } from "./components/SchedulerTab";
import { TabButton } from "./components/TabButton";

type TabId = "overview" | "scheduler" | "reports";


const tabs = [
  { id: "overview" as const, label: "孕期状态", icon: HeartPulse },
  { id: "scheduler" as const, label: "时间排程", icon: Pill },
  { id: "reports" as const, label: "报告归档", icon: ClipboardList },
];

export default function App() {
  const [profile, setProfile] = useState<PersonalProfile | null>(readProfile);
  const [editing, setEditing] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedSupplements, setSelectedSupplements] = useState(defaultSupplements);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("22:30");
  const [mealTimes, setMealTimes] = useState<MealTimes>(defaultMealTimes);
  const [records, setRecords] = useState<ReportRecord[]>([]);

  const overview = profile ? buildPersonalOverview(profile) : null;
  function saveProfile(value: PersonalProfile) {
    setProfile(value); setEditing(false); setActiveTab("overview"); setStorageError("");
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(value)); }
    catch { setStorageError("浏览器未允许保存资料，本次会话仍可使用，刷新后需重新填写。"); }
  }
  function clearProfile() {
    try { localStorage.removeItem(PROFILE_KEY); }
    catch { setStorageError("无法清除浏览器中的资料，请检查浏览器存储设置。"); return; }
    setProfile(null); setEditing(false); setRecords([]); setStorageError("");
  }
  const schedule = useMemo(
    () =>
      generateSchedule({
        supplements: selectedSupplements,
        meals: mealTimes,
        wakeTime,
        sleepTime,
      }),
    [mealTimes, selectedSupplements, sleepTime, wakeTime],
  );

  return (
    <div className="app-shell clay-theme">
      <header className="app-header">
        <a className="brand" href="#" onClick={event => { event.preventDefault(); setEditing(false); setActiveTab("overview"); }}><span className="brand-icon"><Heart size={23} /></span><span>孕伴<small>GROW TOGETHER</small></span></a>
        <div className="header-actions"><span className="local-note">每一周，都有陪伴</span>{profile && <button className="profile-button" onClick={() => setEditing(true)}><UserRound size={17} />我的资料</button>}</div>
      </header>

      <div className="garden-banner"><div><p>YOUR LITTLE WORLD</p><h2>孕伴 · 孕期私人助手</h2><span>把每一份期待，照顾成日常。</span></div></div>

      {profile && !editing && <nav className="tab-nav" aria-label="功能切换">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            label={tab.label}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </nav>}

      <main>
        {storageError && <p role="alert" className="agent-error">{storageError}</p>}
        {(!profile || editing) && <ProfilePage key={editing ? "edit" : "new"} initial={profile} onSave={saveProfile} onCancel={() => setEditing(false)} />}
        {profile && !editing && activeTab === "overview" && overview && <OverviewTab profile={profile} overview={overview} onEdit={() => setEditing(true)} onReports={() => setActiveTab("reports")} />}
        {profile && !editing && activeTab === "scheduler" && (
          <SchedulerTab
            schedule={schedule}
            mealTimes={mealTimes}
            setMealTimes={setMealTimes}
            selectedSupplements={selectedSupplements}
            setSelectedSupplements={setSelectedSupplements}
            sleepTime={sleepTime}
            setSleepTime={setSleepTime}
            wakeTime={wakeTime}
            setWakeTime={setWakeTime}
          />
        )}
        {profile && <div hidden={editing || activeTab !== "reports"}>
          <ReportsTab
            records={records}
            onSave={(record) => setRecords(current => [...current, record])}
          />
        </div>}
      </main>
      <footer className="site-footer"><span>孕伴 · 记录你的每一程</span>{profile && <button className="text-button" onClick={clearProfile}>清除本地资料</button>}<span>仅供记录与就诊准备</span></footer>
    </div>
  );
}
