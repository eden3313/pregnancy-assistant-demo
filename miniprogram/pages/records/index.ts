import { deleteRecord } from "../../domain/records";
import { removeSavedFile } from "../../services/local-files";
import { loadAppState, saveAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";

Page({
  data: { records: [] as any[] },
  onShow() { const records = loadAppState(wxStorage).records.slice().sort((a, b) => b.date.localeCompare(a.date)); this.setData({ records }); },
  add() { wx.navigateTo({ url: "/pages/record-editor/index" }); },
  edit(event: any) { wx.navigateTo({ url: `/pages/record-editor/index?id=${event.currentTarget.dataset.id}` }); },
  remove(event: any) { const id = event.currentTarget.dataset.id; wx.showModal({ title: "删除这条记录？", content: "文字和本地照片都将删除。", success: async (result: any) => { if (!result.confirm) return; const state = loadAppState(wxStorage); const deleted = deleteRecord(state.records, id); state.records = deleted.records; await removeSavedFile(deleted.deletedPhotoPath); saveAppState(wxStorage, state); this.setData({ records: state.records.slice().sort((a, b) => b.date.localeCompare(a.date)) }); } }); },
});
