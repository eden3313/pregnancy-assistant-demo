import { validateProfile } from "../../domain/profile";
import { clearAppState, loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { todayText } from "../../utils/date";
import { removeSavedFile } from "../../services/local-files";

Page({
  data: { today: todayText(), form: null as any },
  onLoad() { const state = loadAppState(wxStorage); this.setData({ form: state.profile }); },
  onInput(event: any) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  onChoice(event: any) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  save() {
    const error = validateProfile(this.data.form); if (error) return wx.showToast({ title: error, icon: "none" });
    const state = loadAppState(wxStorage); state.profile = this.data.form; saveAppState(wxStorage, state);
    wx.showToast({ title: "资料已保存" }); setTimeout(() => wx.navigateBack(), 500);
  },
  clearAll() { wx.showModal({ title: "清除全部本地数据？", content: "资料、日程、记录和本地照片将无法恢复。", confirmColor: "#a14f43", success: async (result: any) => { if (result.confirm) { const state = loadAppState(wxStorage); await Promise.all(state.records.map((record) => removeSavedFile(record.photoPath))); clearAppState(wxStorage); wx.reLaunch({ url: "/pages/onboarding/index" }); } } }); },
});
