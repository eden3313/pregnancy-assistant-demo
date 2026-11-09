import { validateProfile } from "../../domain/profile";
import { buildDefaultSchedule } from "../../domain/schedule";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { todayText } from "../../utils/date";
import type { PersonalProfile } from "../../types/domain";

Page({
  data: {
    today: todayText(), privacyAccepted: false,
    form: { lastPeriod: "", babies: "single", risk: "no", riskDetails: "", medications: "" } as PersonalProfile,
  },
  onInput(event: any) { const field = event.currentTarget.dataset.field; this.setData({ [`form.${field}`]: event.detail.value }); },
  onChoice(event: any) { const field = event.currentTarget.dataset.field; this.setData({ [`form.${field}`]: event.detail.value }); },
  onPrivacy(event: any) { this.setData({ privacyAccepted: event.detail.value.includes("accepted") }); },
  openPrivacy() { wx.navigateTo({ url: "/pages/privacy/index" }); },
  submit() {
    if (!this.data.privacyAccepted) return wx.showToast({ title: "请先阅读并同意隐私说明", icon: "none" });
    const error = validateProfile(this.data.form);
    if (error) return wx.showToast({ title: error, icon: "none" });
    const state = loadAppState(wxStorage);
    state.privacyAcceptedAt = new Date().toISOString(); state.profile = this.data.form;
    if (!state.schedule.length) state.schedule = buildDefaultSchedule(todayText());
    saveAppState(wxStorage, state);
    wx.switchTab({ url: "/pages/today/index" });
  },
});
