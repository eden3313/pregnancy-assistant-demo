import { createRecord, updateRecord, validateRecord } from "../../domain/records";
import { chooseAndSavePhoto, removeSavedFile } from "../../services/local-files";
import { extractReportForRecord } from "../../services/report-api";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { makeId, todayText } from "../../utils/date";

Page({
  data: { id: "", date: todayText(), title: "", body: "", tagsText: "", photoPath: "", extracted: null as any, status: "", busy: false },
  onLoad(options: any) { if (!options.id) return; const record = loadAppState(wxStorage).records.find((item) => item.id === options.id); if (record) this.setData({ ...record, tagsText: record.tags.join("、") }); },
  onInput(event: any) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  async choosePhoto() { try { const old = this.data.photoPath; const next = await chooseAndSavePhoto(); this.setData({ photoPath: next, extracted: null }); if (old && old !== next) await removeSavedFile(old); } catch (error: any) { if (!String(error.errMsg || error.message).includes("cancel")) wx.showToast({ title: error.message || "无法保存照片", icon: "none" }); } },
  parsePhoto() {
    if (!this.data.photoPath) return wx.showToast({ title: "请先选择报告照片", icon: "none" });
    wx.showModal({ title: "发送照片进行文字整理？", content: "照片将发送至服务端及模型服务。仅提取文字、摘要和术语释义，不提供诊断或医疗建议。", confirmText: "同意并继续", success: async (result: any) => { if (!result.confirm) return; this.setData({ busy: true, status: "正在读取并整理文字…" }); try { const extracted = await extractReportForRecord(this.data.photoPath); const body = [extracted.summary, ...extracted.items.map((item) => `${item.name}：${item.value}${item.unit ? ` ${item.unit}` : ""}`), extracted.sourceText].filter(Boolean).join("\n\n"); this.setData({ extracted, body, title: this.data.title || extracted.reportTitle || "报告文字记录", date: extracted.reportDate || this.data.date, status: "整理完成，请对照原图核验后保存。" }); } catch (error: any) { this.setData({ status: error.message || "文字整理失败，请重试。" }); } finally { this.setData({ busy: false }); } } });
  },
  save() {
    const draft = { date: this.data.date, title: this.data.title, body: this.data.body, tags: this.data.tagsText.split(/[、,，]/).map((item: string) => item.trim()).filter(Boolean), photoPath: this.data.photoPath, extracted: this.data.extracted || undefined };
    const error = validateRecord(draft); if (error) return wx.showToast({ title: error, icon: "none" });
    const state = loadAppState(wxStorage);
    if (this.data.id) { const current = state.records.find((item) => item.id === this.data.id); if (current) state.records = updateRecord(state.records, { ...current, ...draft }); }
    else state.records.push(createRecord(draft, makeId("record")));
    saveAppState(wxStorage, state); wx.showToast({ title: "记录已保存" }); setTimeout(() => wx.navigateBack(), 500);
  },
});
