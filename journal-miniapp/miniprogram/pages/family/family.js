// pages/family/family.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    dateStr: '',
    prettyDate: '',
    members: [],     // [{ _id, nickName, journal, done }]
    loading: true,
    noFamily: false,
    familyName: ''
  },

  onShow() {
    this.refreshDate();
    this.setData({ familyName: app.globalData.familyName || '' });
    this.loadFamily();
  },

  refreshDate() {
    const ds = util.todayStr();
    this.setData({ dateStr: ds, prettyDate: util.prettyDate(ds) });
  },

  loadFamily() {
    if (!app.globalData.familyId) {
      this.setData({ loading: false, noFamily: true });
      return;
    }
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'getFamily',
      data: { date: this.data.dateStr },
      success: (res) => {
        const members = (res.result && res.result.members) || [];
        this.setData({ members, loading: false, noFamily: false });
      },
      fail: (err) => {
        console.error('getFamily failed', err);
        this.setData({ loading: false });
      }
    });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  // 点击语音播放（需要临时下载 fileID -> 临时路径后播放）
  playMemberVoice(e) {
    const fileID = e.currentTarget.dataset.file;
    if (!fileID) return;
    wx.showLoading({ title: '加载语音...' });
    wx.cloud.downloadFile({
      fileID,
      success: (r) => {
        wx.hideLoading();
        const ctx = wx.createInnerAudioContext();
        ctx.src = r.tempFilePath;
        ctx.play();
        ctx.onEnded(() => ctx.destroy());
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '语音加载失败', icon: 'none' });
      }
    });
  }
});
