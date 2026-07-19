// pages/history/history.js
const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    entries: [],     // [{ date, prettyDate, author, authorId, q1, q2, q3, voiceFileID }]
    loading: true,
    noFamily: false,
    filter: 'all'    // all | mine
  },

  onShow() {
    this.loadHistory();
  },

  switchFilter(e) {
    const f = e.currentTarget.dataset.f;
    if (f === this.data.filter) return;
    this.setData({ filter: f });
    this.loadHistory();
  },

  loadHistory() {
    if (!app.globalData.familyId) {
      this.setData({ loading: false, noFamily: true });
      return;
    }
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: 'getJournals',
      data: { type: 'history', mineOnly: this.data.filter === 'mine' },
      success: (res) => {
        const list = (res.result && res.result.data) || [];
        const entries = list.map((j) => ({
          _id: j._id,
          date: j.date,
          prettyDate: util.prettyDate(j.date),
          author: j.nickName || '家人',
          authorId: j.openid,
          q1: j.q1,
          q2: j.q2,
          q3: j.q3,
          voiceFileID: j.voiceFileID
        }));
        this.setData({ entries, loading: false });
      },
      fail: (err) => {
        console.error('history failed', err);
        this.setData({ loading: false });
      }
    });
  },

  playVoice(e) {
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
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
