import { validateProfile } from "../../domain/profile";
import { syncDailySchedule } from "../../domain/schedule";
import { clearAppState, loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { makeId, todayText } from "../../utils/date";
import { removeSavedFile } from "../../services/local-files";
import type { MedicationPlan, PersonalProfile } from "../../types/domain";

const emptyMedication = (): MedicationPlan => ({ id: makeId("medication"), name: "", time: "08:00", relation: "fixedTime" });

Page({
  data: { today: todayText(), form: null as any },
  onLoad() { const state = loadAppState(wxStorage); this.setData({ form: state.profile }); },
  onInput(event: any) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  onChoice(event: any) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
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
  save() {
    const error = validateProfile(this.data.form); if (error) return wx.showToast({ title: error, icon: "none" });
    const state = loadAppState(wxStorage);
    const profile: PersonalProfile = { ...this.data.form, medications: this.data.form.medications.map((item: MedicationPlan) => ({ ...item, name: item.name.trim() })) };
    state.profile = profile;
    state.schedule = syncDailySchedule(state.schedule, todayText(), profile.medications);
    saveAppState(wxStorage, state);
    wx.showToast({ title: "资料已保存" }); setTimeout(() => wx.navigateBack(), 500);
  },
  clearAll() { wx.showModal({ title: "清除全部本地数据？", content: "资料、日程、记录和本地照片将无法恢复。", confirmColor: "#a14f43", success: async (result: any) => { if (result.confirm) { const state = loadAppState(wxStorage); await Promise.all(state.records.map((record) => removeSavedFile(record.photoPath))); clearAppState(wxStorage); wx.reLaunch({ url: "/pages/onboarding/index" }); } } }); },
});
