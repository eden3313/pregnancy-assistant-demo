import { createRecord, updateRecord, validateRecord } from "../../domain/records";
import { chooseAndSavePhoto, removeSavedFile } from "../../services/local-files";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { makeId, todayText } from "../../utils/date";

Page({
  data: { id: "", date: todayText(), title: "", body: "", tagsText: "", photoPath: "", extracted: null as any },
  onLoad(options: any) { if (!options.id) return; const record = loadAppState(wxStorage).records.find((item) => item.id === options.id); if (record) this.setData({ ...record, tagsText: record.tags.join("、") }); },
  onInput(event: any) { this.setData({ [event.currentTarget.dataset.field]: event.detail.value }); },
  async choosePhoto() { try { const old = this.data.photoPath; const next = await chooseAndSavePhoto(); this.setData({ photoPath: next, extracted: null }); if (old && old !== next) await removeSavedFile(old); } catch (error: any) { if (!String(error.errMsg || error.message).includes("cancel")) wx.showToast({ title: error.message || "无法保存照片", icon: "none" }); } },
  save() {
    const draft = { date: this.data.date, title: this.data.title, body: this.data.body, tags: this.data.tagsText.split(/[、,，]/).map((item: string) => item.trim()).filter(Boolean), photoPath: this.data.photoPath, extracted: this.data.extracted || undefined };
    const error = validateRecord(draft); if (error) return wx.showToast({ title: error, icon: "none" });
    const state = loadAppState(wxStorage);
    if (this.data.id) { const current = state.records.find((item) => item.id === this.data.id); if (current) state.records = updateRecord(state.records, { ...current, ...draft }); }
    else state.records.push(createRecord(draft, makeId("record")));
    saveAppState(wxStorage, state); wx.showToast({ title: "记录已保存" }); setTimeout(() => wx.navigateBack(), 500);
  },
});
