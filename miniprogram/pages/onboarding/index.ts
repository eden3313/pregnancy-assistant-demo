import { validateProfile } from "../../domain/profile";
import { syncDailySchedule } from "../../domain/schedule";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { makeId, todayText } from "../../utils/date";
import type { MedicationPlan, PersonalProfile } from "../../types/domain";

const emptyMedication = (): MedicationPlan => ({ id: makeId("medication"), name: "", time: "08:00", relation: "fixedTime" });

Page({
  data: {
    today: todayText(), privacyAccepted: false,
    form: { lastPeriod: "", babies: "single", risk: "no", riskDetails: "", medications: [], legacyMedicationNotes: "" } as PersonalProfile,
  },
  onInput(event: any) { const field = event.currentTarget.dataset.field; this.setData({ [`form.${field}`]: event.detail.value }); },
  onChoice(event: any) { const field = event.currentTarget.dataset.field; this.setData({ [`form.${field}`]: event.detail.value }); },
  addMedication() { this.setData({ "form.medications": [...this.data.form.medications, emptyMedication()] }); },
  removeMedication(event: any) {
    const index = Number(event.currentTarget.dataset.index);
    this.setData({ "form.medications": this.data.form.medications.filter((_item: MedicationPlan, itemIndex: number) => itemIndex !== index) });
  },
  onMedicationInput(event: any) {
    const index = Number(event.currentTarget.dataset.index);
    const medications = this.data.form.medications.map((item: MedicationPlan, itemIndex: number) => itemIndex === index ? { ...item, [event.currentTarget.dataset.field]: event.detail.value } : item);
    this.setData({ "form.medications": medications });
  },
  onMedicationRelation(event: any) {
    const index = Number(event.currentTarget.dataset.index);
    const medications = this.data.form.medications.map((item: MedicationPlan, itemIndex: number) => itemIndex === index ? { ...item, relation: event.detail.value } : item);
    this.setData({ "form.medications": medications });
  },
  onPrivacy(event: any) { this.setData({ privacyAccepted: event.detail.value.includes("accepted") }); },
  openPrivacy() { wx.navigateTo({ url: "/pages/privacy/index" }); },
  submit() {
    if (!this.data.privacyAccepted) return wx.showToast({ title: "请先阅读并同意隐私说明", icon: "none" });
    const error = validateProfile(this.data.form);
    if (error) return wx.showToast({ title: error, icon: "none" });
    const state = loadAppState(wxStorage);
    state.privacyAcceptedAt = new Date().toISOString();
    const profile: PersonalProfile = { ...this.data.form, medications: this.data.form.medications.map((item: MedicationPlan) => ({ ...item, name: item.name.trim() })) };
    state.profile = profile;
    state.schedule = syncDailySchedule(state.schedule, todayText(), profile.medications);
    saveAppState(wxStorage, state);
    wx.switchTab({ url: "/pages/today/index" });
  },
});
