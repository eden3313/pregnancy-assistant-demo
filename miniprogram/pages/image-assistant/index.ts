import { chooseAndSavePhoto, removeSavedFile } from "../../services/local-files";
import { aiConfigured, recognizeImage } from "../../services/image-ai";
import { DEFAULT_MEAL_TIMES, parseMedicationTiming } from "../../domain/medication-timing";
import { syncDailySchedule } from "../../domain/schedule";
import { createRecord } from "../../domain/records";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { makeId, todayText } from "../../utils/date";

Page({
  requestTask: null as any,
  alive: true,
  data: { kind: "medicine", photoPath: "", busy: false, error: "", ready: false, name: "", timingText: "", sourceText: "", title: "", time: "08:00", relation: "fixedTime", timingReady: false, timingMessage: "", saved: false, configured: aiConfigured() },
  onLoad(options: any) { this.setData({ kind: options.kind === "report" ? "report" : "medicine" }); },
  onUnload() { this.alive = false; this.requestTask?.abort(); if (this.data.photoPath) void removeSavedFile(this.data.photoPath); },
  async choosePhoto() {
    if (this.data.busy) return;
    try {
      const path = await chooseAndSavePhoto();
      const old = this.data.photoPath;
      this.setData({ photoPath: path, ready: false, error: "", saved: false, name: "", sourceText: "", timingText: "", timingReady: false });
      if (old) await removeSavedFile(old);
    } catch (error: any) { if (!String(error.errMsg || error.message).includes("cancel")) wx.showToast({ title: error.message || "选图失败", icon: "none" }); }
  },
  upload() {
    if (this.data.busy || !this.data.photoPath) return;
    if (!this.data.configured) return wx.showModal({ title: "服务尚未配置", content: "请先部署后端并配置正式HTTPS域名。", showCancel: false });
    wx.showModal({ title: "确认发送图片", content: "所选图片将发送到本程序后端及OpenAI服务用于文字识别，可能涉及境外处理。请先遮盖姓名、电话、证件号等无关信息。取消则不上传。识别不提供诊断或用药判断，详情见隐私说明。", confirmText: "同意并识别", success: async (response: any) => {
      if (!response.confirm || this.data.busy) return;
      this.setData({ busy: true, ready: false, error: "", timingReady: false });
      try {
        const result = await recognizeImage(this.data.photoPath, this.data.kind as "medicine" | "report", (task) => { this.requestTask = task; if (!this.alive) task.abort(); });
        if (!this.alive) return;
        this.setData({ ready: true, sourceText: result.sourceText, name: result.name || "", timingText: result.timingText || "", title: (result.reportTitle || "报告文字记录").slice(0, 80), saved: false });
      } catch (error: any) { if (this.alive) this.setData({ error: error.message || "识别失败，请重试。" }); }
      finally { this.requestTask = null; if (this.alive) this.setData({ busy: false }); }
    } });
  },
  onInput(event: any) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value, saved: false, ...(field === "timingText" ? { timingReady: false } : {}) });
  },
  calculate() {
    const state = loadAppState(wxStorage);
    const meals = { ...DEFAULT_MEAL_TIMES };
    for (const [key, title] of [["breakfast", "早餐"], ["lunch", "午餐"], ["dinner", "晚餐"]] as const) {
      const meal = state.schedule.find(item => item.date === todayText() && item.type === "meal" && item.title === title);
      if (meal) meals[key] = meal.time;
    }
    const result = parseMedicationTiming(this.data.timingText, meals);
    if (!result.ok) return this.setData({ timingReady: false, timingMessage: result.message });
    this.setData({ time: result.time, relation: result.relation, timingReady: true, timingMessage: result.explanation, saved: false });
  },
  manualTime(event: any) { this.setData({ time: event.detail.value, relation: "fixedTime", timingReady: true, timingMessage: "已选择手动时间，请核对原要求。", saved: false }); },
  save() {
    if (!this.data.ready || this.data.busy || this.data.saved) return;
    const state = loadAppState(wxStorage);
    if (this.data.kind === "medicine") {
      if (!state.profile) return wx.showToast({ title: "请先建立孕期资料", icon: "none" });
      if (!this.data.name.trim() || this.data.name.trim().length > 100) return wx.showToast({ title: "请核对药名（最多100字）", icon: "none" });
      if (!this.data.timingReady) return wx.showToast({ title: "请先生成或手动确认时间", icon: "none" });
    } else if (!this.data.title.trim()) return wx.showToast({ title: "请填写记录标题", icon: "none" });
    wx.showModal({ title: "确认保存", content: this.data.kind === "medicine" ? `将“${this.data.name}”加入每日 ${this.data.time} 的用药日程。请核对原说明书或医嘱；不会自动调整剂量，也不会随餐时变化自动改时间。` : "请确认已逐项核对识别原文，保存后可在个人记录中继续编辑。", success: (response: any) => {
      if (!response.confirm || this.data.saved) return;
      const latest = loadAppState(wxStorage);
      if (this.data.kind === "medicine") {
        if (!latest.profile) return;
        latest.profile.medications.push({ id: makeId("medication"), name: this.data.name.trim(), time: this.data.time, relation: this.data.relation as any, instruction: this.data.timingText });
        latest.schedule = syncDailySchedule(latest.schedule, todayText(), latest.profile.medications);
      } else latest.records.push(createRecord({ date: todayText(), title: this.data.title, body: this.data.sourceText, tags: ["图片识别", "已核对"], photoPath: "" }));
      saveAppState(wxStorage, latest);
      this.setData({ saved: true });
      wx.showToast({ title: "已保存到本机" });
    } });
  },
  openPrivacy() { wx.navigateTo({ url: "/pages/privacy/index" }); },
});
