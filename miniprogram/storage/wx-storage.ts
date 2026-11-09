import type { KeyValueStorage } from "./app-state";
export const wxStorage: KeyValueStorage = {
  get: (key) => { const value = wx.getStorageSync(key); return typeof value === "string" ? value : undefined; },
  set: (key, value) => wx.setStorageSync(key, value),
  remove: (key) => wx.removeStorageSync(key),
};
