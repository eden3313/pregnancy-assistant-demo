import { ArrowRight, CalendarDays, Heart, Pill, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { babyLabels, dateOnly, validateProfile, type PersonalProfile } from "../lib/profile";

interface Props { initial: PersonalProfile | null; onSave: (profile: PersonalProfile) => void; onCancel: () => void }
export function ProfilePage({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<PersonalProfile>(initial || { lastPeriod: "", babies: "single", risk: "unknown", riskDetails: "", medications: "" });
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const message = validateProfile(draft);
    setError(message);
    if (!message) onSave({ ...draft, riskDetails: draft.risk === "yes" ? draft.riskDetails.trim() : "", medications: draft.medications.trim() });
  }
  return <section className="profile-page" aria-label="孕期资料">
    <div className="page-intro"><span className="section-kicker">YOUR PREGNANCY, YOUR PACE</span><h1>{initial ? "更新你的孕期档案" : "从了解你开始"}</h1><p>每一段孕育，都有自己的节奏。</p></div>
    <form className="profile-form" onSubmit={submit}>
      <div className="form-section"><div className="form-section-title"><CalendarDays size={20} /><h2>01 · 孕期起点</h2></div>
        <label htmlFor="last-period">末次月经第一天<input id="last-period" name="lastPeriod" required type="date" max={dateOnly()} value={draft.lastPeriod} onChange={event => setDraft({ ...draft, lastPeriod: event.target.value })} /></label>
        <p className="field-note">用于估算孕周与预产期；月经不规律、辅助生殖或超声已校正日期时，请以医生确认的孕周为准。</p>
      </div>
      <fieldset className="form-section"><legend><Heart size={20} />02 · 胎数</legend><div className="radio-options">{(Object.keys(babyLabels) as PersonalProfile["babies"][]).map(value => <label key={value} className={draft.babies === value ? "radio-option selected" : "radio-option"}><input type="radio" name="babies" value={value} checked={draft.babies === value} onChange={() => setDraft({ ...draft, babies: value })} /><span>{babyLabels[value]}</span></label>)}</div></fieldset>
      <fieldset className="form-section"><legend><ShieldCheck size={20} />03 · 是否有高危因素</legend><div className="radio-options">{([["no", "无"], ["yes", "有"], ["unknown", "不确定"]] as const).map(([value, label]) => <label key={value} className={draft.risk === value ? "radio-option selected" : "radio-option"}><input type="radio" name="risk" value={value} checked={draft.risk === value} onChange={() => setDraft({ ...draft, risk: value })} /><span>{label}</span></label>)}</div>
        {draft.risk === "yes" && <label className="risk-detail">高危因素说明（选填）<textarea maxLength={1000} value={draft.riskDetails} placeholder="填写医生已告知的情况或相关病史" onChange={event => setDraft({ ...draft, riskDetails: event.target.value })} /></label>}
      </fieldset>
      <div className="form-section"><div className="form-section-title"><Pill size={20} /><h2>04 · 当前正在服用的药物</h2></div><label>药物与补剂清单<textarea maxLength={2000} rows={4} value={draft.medications} placeholder="例如：叶酸，每天一次；没有正在服用的药物可留空" onChange={event => setDraft({ ...draft, medications: event.target.value })} /></label></div>
      {error && <p role="alert" className="agent-error">{error}</p>}
      <div className="form-footer"><p>资料仅保存在此浏览器，可随时修改或清除。</p><div>{initial && <button className="text-button" type="button" onClick={onCancel}>取消</button>}<button className="primary-action" type="submit">{initial ? "保存并更新孕期状态" : "生成我的孕期状态"}<ArrowRight size={18} /></button></div></div>
    </form>
  </section>;
}
