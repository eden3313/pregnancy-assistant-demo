import { ArrowUpRight, CalendarDays, Heart, Pill } from "lucide-react";
import { babyLabels, riskLabels, type PersonalProfile, type buildPersonalOverview } from "../lib/profile";

interface Props { overview: ReturnType<typeof buildPersonalOverview>; profile: PersonalProfile; onEdit: () => void; onReports: () => void }
export function OverviewTab({ overview, profile, onEdit, onReports }: Props) {
  return <section className="tab-panel personal-overview" aria-label="孕期状态">
    <div className="overview-title"><div><p className="section-kicker">A LITTLE MORE, EVERY DAY</p><h1>一起，慢慢长大。</h1></div><button className="text-button" onClick={onEdit}>修改资料<ArrowUpRight size={16} /></button></div>
    <div className="pregnancy-summary">
      <div className="week-display"><span>{overview.trimester} · {babyLabels[profile.babies]}</span><div><strong>{overview.gestationalAge.week}</strong><span>周 <b>+ {overview.gestationalAge.day}</b> 天</span></div><span className="week-label">按末次月经估算</span></div>
      <div className="baby-status"><Heart size={23} /><h2>这一周的小小变化</h2><p>{overview.babyDescription}</p><div className="progress-track" role="progressbar" aria-label="孕期进度" aria-valuenow={overview.progressPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${overview.progressPercent}%` }} /></div><div className="progress-labels"><span>孕期起点</span><span>40 周参考节点</span></div></div>
    </div>
    <div className="profile-facts"><div><span>估算预产期</span><strong>{overview.dueDate}</strong></div><div><span>胎数</span><strong>{babyLabels[profile.babies]}</strong></div><div><span>高危因素</span><strong>{riskLabels[profile.risk]}</strong></div><div><span>当前用药</span><strong>{profile.medications.trim() ? "已记录，待医生核对" : "未填写"}</strong></div></div>
    <div className="care-columns"><section className="checkup-section"><div className="section-icon"><CalendarDays size={20} /></div><p className="section-kicker">下一步 · 产检准备</p><h2>{overview.nextCheckup.title}</h2><span className="checkup-window">{overview.nextCheckup.window}</span><p>{overview.nextCheckup.detail}</p><button className="text-button" onClick={onReports}>整理我的产检报告<ArrowUpRight size={17} /></button></section>
    <section className="advice-section"><p className="section-kicker">留一点关心给自己</p><h2>这段时间要注意</h2><ol className="personal-advice">{overview.advice.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol></section></div>
    {profile.medications.trim() && <section className="medication-summary"><Pill size={22} /><div><h2>当前用药清单</h2><p>{profile.medications}</p></div><button className="text-button" onClick={onEdit}>编辑<ArrowUpRight size={16} /></button></section>}
    <p className="disclaimer">孕周及发育描述是一般参考，不代表检查结果。预产期、产检时间及用药请以医生意见为准。</p>
  </section>;
}
