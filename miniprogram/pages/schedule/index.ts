import { addScheduleItem, deleteScheduleItem, toggleScheduleItem, updateScheduleItem } from "../../domain/schedule";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { makeId, todayText } from "../../utils/date";
import type { ScheduleItem } from "../../types/domain";

const emptyForm = (): ScheduleItem => ({ id: "", date: todayText(), time: "08:00", type: "custom", title: "", note: "", completed: false });
Page({
  data: { items: [] as ScheduleItem[], editing: false, form: emptyForm(), typeNames: ["吃饭", "补剂", "产检", "自定义"], typeValues: ["meal", "supplement", "checkup", "custom"], typeIndex: 3 },
  onShow() { this.reload(); },
  reload() { this.setData({ items: loadAppState(wxStorage).schedule }); },
  add() { this.setData({ editing: true, form: emptyForm(), typeIndex: 3 }); },
  edit(event: any) { const item = this.data.items.find((entry: ScheduleItem) => entry.id === event.currentTarget.dataset.id); if (item) this.setData({ editing: true, form: { ...item }, typeIndex: this.data.typeValues.indexOf(item.type) }); },
  close() { this.setData({ editing: false }); },
  onInput(event: any) { this.setData({ [`form.${event.currentTarget.dataset.field}`]: event.detail.value }); },
  onType(event: any) { const index = Number(event.detail.value); this.setData({ typeIndex: index, "form.type": this.data.typeValues[index] }); },
  save() {
    const form = { ...this.data.form, title: this.data.form.title.trim() };
    if (!form.title) return wx.showToast({ title: "请填写日程名称", icon: "none" });
    const state = loadAppState(wxStorage);
    try { state.schedule = form.id ? updateScheduleItem(state.schedule, form) : addScheduleItem(state.schedule, { ...form, id: makeId("schedule") }); }
    catch (error: any) { return wx.showToast({ title: error.message, icon: "none" }); }
    saveAppState(wxStorage, state); this.setData({ editing: false, items: state.schedule });
  },
  toggle(event: any) { const state = loadAppState(wxStorage); state.schedule = toggleScheduleItem(state.schedule, event.currentTarget.dataset.id); saveAppState(wxStorage, state); this.setData({ items: state.schedule }); },
  remove(event: any) { const id = event.currentTarget.dataset.id; wx.showModal({ title: "删除这条日程？", success: (result: any) => { if (result.confirm) { const state = loadAppState(wxStorage); state.schedule = deleteScheduleItem(state.schedule, id); saveAppState(wxStorage, state); this.setData({ items: state.schedule }); } } }); },
});
