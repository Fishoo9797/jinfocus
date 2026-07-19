// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    nickName: '',
    familyName: '',
    familyId: '',
    memberCount: 0,
    joined: false,        // 是否已加入家庭
    inviteCode: '',       // 加入时输入的家庭ID
    showJoin: false
  },

  onShow() {
    const u = app.globalData.userInfo;
    this.setData({
      joined: !!app.globalData.familyId,
      nickName: u ? u.nickName : '',
      familyName: app.globalData.familyName || '',
      familyId: app.globalData.familyId || ''
    });
    if (app.globalData.familyId) {
      this.loadMemberCount();
    }
  },

  loadMemberCount() {
    wx.cloud.callFunction({
      name: 'getFamily',
      data: {},
      success: (res) => {
        const members = (res.result && res.result.members) || [];
        this.setData({ memberCount: members.length });
      }
    });
  },

  onNick(e) { this.setData({ nickName: e.detail.value }); },
  onFamily(e) { this.setData({ familyName: e.detail.value }); },
  onInvite(e) { this.setData({ inviteCode: e.detail.value }); },

  // 保存昵称
  saveNick() {
    const nick = this.data.nickName.trim();
    if (!nick) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    wx.cloud.callFunction({
      name: 'saveJournal',
      data: { action: 'updateNick', nickName: nick },
      success: () => {
        if (app.globalData.userInfo) app.globalData.userInfo.nickName = nick;
        wx.showToast({ title: '已保存', icon: 'success' });
      },
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    });
  },

  // 创建家庭
  createFamily() {
    const name = this.data.familyName.trim();
    if (!name) {
      wx.showToast({ title: '给家庭起个名字', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '创建中...' });
    wx.cloud.callFunction({
      name: 'createFamily',
      data: { familyName: name },
      success: (res) => {
        wx.hideLoading();
        const r = res.result || {};
        app.globalData.familyId = r.familyId;
        app.globalData.familyName = name;
        if (app.globalData.userInfo) {
          app.globalData.userInfo.familyId = r.familyId;
          app.globalData.userInfo.familyName = name;
        }
        this.setData({ joined: true, familyId: r.familyId });
        wx.showToast({ title: '家庭已创建', icon: 'success' });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '创建失败', icon: 'none' });
      }
    });
  },

  toggleJoin() { this.setData({ showJoin: !this.data.showJoin }); },

  // 加入家庭
  joinFamily() {
    const code = this.data.inviteCode.trim();
    if (!code) {
      wx.showToast({ title: '请输入家庭ID', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加入中...' });
    wx.cloud.callFunction({
      name: 'joinFamily',
      data: { familyId: code },
      success: (res) => {
        wx.hideLoading();
        const r = res.result || {};
        if (r.ok) {
          app.globalData.familyId = code;
          app.globalData.familyName = r.familyName || '';
          if (app.globalData.userInfo) {
            app.globalData.userInfo.familyId = code;
            app.globalData.userInfo.familyName = r.familyName || '';
          }
          this.setData({ joined: true, familyId: code, familyName: r.familyName || '', showJoin: false });
          wx.showToast({ title: '已加入', icon: 'success' });
        } else {
          wx.showToast({ title: r.msg || '家庭不存在', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '加入失败', icon: 'none' });
      }
    });
  },

  copyId() {
    wx.setClipboardData({
      data: this.data.familyId,
      success: () => wx.showToast({ title: '家庭ID已复制', icon: 'none' })
    });
  }
});
