import { Check, FileText, LoaderCircle, Pill, Save, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { parseImageRequest, readImage, type ImageKind, type ImageResult } from "../lib/imageApi";
import type { ReportRecord } from "../lib/reports";
import { TrendChart } from "./TrendChart";

interface Props { records: ReportRecord[]; onSave: (record: ReportRecord) => void }

export function ReportsTab({ records, onSave }: Props) {
  const [kind, setKind] = useState<ImageKind>("report");
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImageResult | null>(null);
  const [week, setWeek] = useState(26);
  const [saved, setSaved] = useState(false);
  const [archive, setArchive] = useState<ImageResult[]>([]);
  const controller = useRef<AbortController | null>(null);
  const selection = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const liveRecords = records.filter(record => record.source === "live");
  const trendRecords = liveRecords.length ? liveRecords : records.filter(record => !record.source);
  useEffect(() => () => { controller.current?.abort(); selection.current++; }, []);

  function reset(nextKind: ImageKind) {
    selection.current++;
    setKind(nextKind); setImage(""); setFileName(""); setResult(null); setError(""); setMessages([]); setSaved(false);
    if (input.current) input.current.value = "";
  }
  async function select(file?: File) {
    if (!file) return;
    const id = ++selection.current;
    setReading(true); setError(""); setResult(null); setSaved(false); setMessages([]); setImage(""); setFileName("");
    try {
      const data = await readImage(file);
      if (id !== selection.current) return;
      setImage(data); setFileName(file.name); setMessages(["图片已就绪，等待提交"]);
    } catch (cause) { if (id === selection.current) setError((cause as Error).message); }
    finally { if (id === selection.current) setReading(false); }
  }
  async function parse(demo = false) {
    controller.current = new AbortController();
    setBusy(true); setError(""); setResult(null); setSaved(false); setMessages([demo ? "正在提交演示请求" : "正在提交图片"]);
    try {
      const parsed = await parseImageRequest({ kind, ...(demo ? { demo: true } : { imageDataUrl: image }) }, message => setMessages(current => [...current, message]), controller.current.signal);
      setResult(parsed);
      if (parsed.kind === "report" && typeof parsed.gestationalWeek === "number") setWeek(parsed.gestationalWeek);
      setMessages(current => [...current, "解析完成，待核对"]);
    } catch (cause) {
      if ((cause as Error).name === "AbortError") setMessages(current => [...current, "已取消"]);
      else setError((cause as Error).message === "Failed to fetch" ? "无法连接本地后端，请检查服务后重试。" : (cause as Error).message);
    } finally { setBusy(false); }
  }
  function save() {
    if (!result || saved || !Number.isInteger(week) || week < 4 || week > 42) return;
    if (result.kind === "report") {
      const hb = result.indicators.find(item => /血红蛋白|\b(hb|hgb)\b/i.test(item.name) && item.value !== null && item.value > 0 && /^(g\/l|g\/dl)$/i.test(item.unit.trim()));
      if (hb) onSave({ id: crypto.randomUUID(), date: result.reportDate || new Date().toLocaleDateString("sv-SE"), gestationalWeek: week,
        metrics: { hb: hb.value! * (hb.unit.toLowerCase().trim() === "g/dl" ? 10 : 1) }, source: result.mode,
      });
    }
    setArchive(current => [result, ...current]); setSaved(true);
    setMessages(current => [...current, "已归档至本次会话"]);
  }

  return <section className="tab-panel reports-layout" aria-label="报告归档与指标分析">
    <div className="report-form section-block">
      <p className="section-kicker">报告归档与指标分析</p><h2>图片解析助手</h2>
      <div className="kind-selector" role="group" aria-label="图片类型">
        <button type="button" aria-pressed={kind === "report"} disabled={busy || reading} onClick={() => reset("report")}><FileText size={17} />产检报告</button>
        <button type="button" aria-pressed={kind === "medicine"} disabled={busy || reading} onClick={() => reset("medicine")}><Pill size={17} />药盒</button>
      </div>
      <input ref={input} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="上传图片" disabled={busy || reading} onChange={event => { void select(event.target.files?.[0]); event.target.value = ""; }} />
      <button type="button" className="image-drop" disabled={busy || reading} onClick={() => input.current?.click()}>
        {image ? <img src={image} alt="待解析图片预览" /> : <Upload size={32} />}
        <strong>{reading ? "正在读取图片" : image ? "更换图片" : `上传${kind === "report" ? "产检报告" : "药盒"}图片`}</strong>
        <span>{fileName || "JPG / PNG / WebP · 最大 6 MB"}</span>
      </button>
      <p className="upload-notice">提交后，图片将发送至 AI 服务进行识别。本地后端不保存图片。</p>
      <button type="button" className="primary-action" disabled={!image || busy || reading} onClick={() => void parse()}>{busy ? <LoaderCircle className="spin" size={18} /> : <Upload size={18} />}开始解析</button>
      {busy ? <button className="upload-line" type="button" onClick={() => controller.current?.abort()}><X size={16} />取消解析</button>
        : <button className="upload-line" type="button" disabled={reading} onClick={() => void parse(true)}><FileText size={16} />查看演示样例</button>}
      <div className="agent-status" aria-live="polite" aria-busy={busy}>
        {messages.map((message, index) => <div key={`${index}-${message}`}>{busy && index === messages.length - 1 ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}<span>{message}</span></div>)}
      </div>
      {error && <p className="agent-error" role="alert">{error}</p>}
    </div>
    <div className="analysis-stack">
      {!result ? <div className="agent-empty"><FileText size={36} /><h2>{busy ? "正在整理图片内容" : "等待解析结果"}</h2><p>{kind === "report" ? "指标数值、报告参考区间与给医生的问题" : "药品名称、成分、规格与包装注意事项"}</p></div> : <>
        <div className="result-heading"><h2>{result.kind === "report" ? "报告解析结果" : "药盒解析结果"}</h2><span className={result.mode === "demo" ? "demo-label" : "live-label"}>{result.mode === "demo" ? "固定演示样例 · 非图片识别" : "图片识别结果 · 待核对"}</span></div>
        {result.reportTitle && <div className="report-meta"><strong>{result.reportTitle}</strong><span>{result.reportDate || "日期未识别"}</span><span>{typeof result.gestationalWeek === "number" ? `报告孕周 ${result.gestationalWeek}周${result.gestationalDay ?? 0}天` : "孕周未识别"}</span></div>}
        <p>{result.summary}</p>
        {result.conclusions && result.conclusions.length > 0 && <section className="report-conclusion"><p className="section-kicker">报告原文提示</p>{result.conclusions.map((item, index) => <p key={index}>{index + 1}. {item}</p>)}</section>}
        {result.findings && result.findings.length > 0 && <section><h2>超声所见整理</h2><dl className="finding-list">{result.findings.map((item, index) => <div key={index}><dt>{item.label}</dt><dd>{item.text}</dd></div>)}</dl></section>}
        {result.kind === "report" && result.indicators.length > 0 && <div className="metric-table-wrap"><table className="metric-table"><thead><tr><th>指标</th><th>识别数值</th><th>单位</th><th>报告参考区间</th></tr></thead><tbody>{result.indicators.map((item, index) => <tr key={index}><td>{item.name} {item.flag}</td><td><input aria-label={`${item.name}数值`} type="number" step="any" value={item.value ?? ""} disabled={saved} placeholder="未识别" onChange={event => { const value = event.target.value === "" ? null : Number(event.target.value); setResult(current => current && ({ ...current, indicators: current.indicators.map((metric, i) => i === index ? { ...metric, value } : metric) })); }} /></td><td>{item.unit || "未识别"}</td><td>{item.reference || "未识别"}</td></tr>)}</tbody></table></div>}
        {result.medicines.map((medicine, index) => <article className="medicine-result" key={index}><h2>{medicine.name}</h2><dl>{[["成分", medicine.ingredients], ["规格", medicine.strength], ["包装用法原文", medicine.labelDirections], ["注意事项", medicine.warnings]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "未识别"}</dd></div>)}</dl></article>)}
        <div><h2>核对提醒</h2><ul className="advice-list">{result.notes.map((note, i) => <li key={i}>{note}</li>)}</ul></div>
        <div><h2>给医生的问题</h2><ol className="question-list">{result.questions.map((question, i) => <li key={i}>{question}</li>)}</ol></div>
        <div className="archive-controls">{result.kind === "report" && <label>报告对应孕周<input type="number" min="4" max="42" step="1" value={week} disabled={saved} onChange={event => setWeek(Number(event.target.value))} /></label>}<button className="primary-action" type="button" disabled={saved || !Number.isInteger(week) || week < 4 || week > 42 || !(result.indicators.length || result.medicines.length)} onClick={save}><Save size={17} />{saved ? "已归档" : "核对并归档"}</button></div>
      </>}
      {trendRecords.some(item => item.metrics.hb !== undefined) ? <div className="section-block chart-section"><h2>血红蛋白历史趋势</h2><TrendChart points={trendRecords.filter(item => item.metrics.hb !== undefined).map(item => ({ week: item.gestationalWeek, value: item.metrics.hb!, label: `${item.gestationalWeek}w` })).sort((a,b) => a.week - b.week)} /><p className="upload-notice">{liveRecords.length ? "图中仅包含已归档的真实识别记录。" : "当前图表为演示历史。"}新报告仅将单位明确的 Hb 指标加入趋势。</p><div className="record-strip">{records.map(record => <span key={record.id}>{record.source !== "live" ? "样例 " : ""}{record.gestationalWeek}w · Hb {record.metrics.hb ?? "未识别"}</span>)}</div></div> : <div className="no-trend"><FileText size={24} /><div><h2>暂无可比较的 Hb 趋势</h2><p>当前超声样例不含血红蛋白。上传并归档含明确 Hb 单位的报告后，这里会自动生成趋势。</p></div></div>}
      {archive.length > 0 && <div><h2>本次会话归档</h2>{archive.map((entry, i) => <details key={i}><summary>{entry.kind === "medicine" ? "药盒" : "产检报告"} · {entry.mode === "demo" ? "演示样例" : "图片识别"}</summary><p>{entry.summary}</p>{entry.indicators.map((item,j) => <p key={j}>{item.name}：{item.value ?? "未识别"} {item.unit}</p>)}{entry.medicines.map((item,j) => <p key={j}>{item.name} · {item.ingredients} · {item.strength}</p>)}</details>)}</div>}
    </div>
    <p className="disclaimer">识别结果需对照原图核对。仅用于记录整理和就诊准备，不替代医生意见；药盒标签用法不代表个人用药建议。</p>
  </section>;
}
