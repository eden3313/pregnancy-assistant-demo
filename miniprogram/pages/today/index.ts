import { buildPregnancyOverview } from "../../domain/profile";
import { loadAppState } from "../../storage/app-state";
import { wxStorage } from "../../storage/wx-storage";
import { todayText } from "../../utils/date";

Page({
  data: { overview: null as any, todayItems: [] as any[] },
  onShow() {
    const state = loadAppState(wxStorage);
    if (!state.privacyAcceptedAt || !state.profile) return wx.reLaunch({ url: "/pages/onboarding/index" });
    const today = todayText();
    this.setData({ overview: buildPregnancyOverview(state.profile), todayItems: state.schedule.filter((item) => item.date === today) });
  },
  editProfile() { wx.navigateTo({ url: "/pages/profile/index" }); },
  openPrivacy() { wx.navigateTo({ url: "/pages/privacy/index" }); },
});
