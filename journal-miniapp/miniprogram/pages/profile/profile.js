// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    nickName: '',
    familyName: '',        // 创建家庭时输入的名字
    inviteCode: '',        // 加入时输入的家庭ID
    showJoin: false,
    families: [],          // 已加入家庭列表 [{familyId, familyName, current}]
    currentFamilyId: '',
    currentFamilyName: '',
    joined: false
  },

  onShow() {
    const u = app.globalData.userInfo;
    const families = (app.globalData.familyIds || []).map((fid) => ({
      familyId: fid,
      familyName: (app.globalData.families.find((f) => f.familyId === fid) || {}).familyName || '未命名家庭',
      current: fid === app.globalData.familyId
    }));
    this.setData({
      nickName: u ? u.nickName : '',
      families,
      currentFamilyId: app.globalData.familyId || '',
      currentFamilyName: app.globalData.familyName || '',
      joined: !!app.globalData.familyId
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
        this.applyFamily(r.familyId, r.familyName);
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
          this.applyFamily(r.familyId, r.familyName);
          this.setData({ showJoin: false, inviteCode: '' });
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

  // 切换当前家庭
  switchFamily(e) {
    const fid = e.currentTarget.dataset.fid;
    if (fid === this.data.currentFamilyId) return;
    wx.showLoading({ title: '切换中...' });
    wx.cloud.callFunction({
      name: 'joinFamily',
      data: { familyId: fid },   // joinFamily 对已加入的家庭仅切换当前
      success: (res) => {
        wx.hideLoading();
        const r = res.result || {};
        if (r.ok) {
          this.applyFamily(r.familyId, r.familyName);
          wx.showToast({ title: '已切换到 ' + (r.familyName || '家庭'), icon: 'none' });
        } else {
          wx.showToast({ title: r.msg || '切换失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '切换失败', icon: 'none' });
      }
    });
  },

  // 统一：把家庭信息写回 globalData 并刷新本页
  applyFamily(familyId, familyName) {
    const app2 = getApp();
    app2.globalData.familyId = familyId;
    app2.globalData.familyName = familyName || '';
    if (app2.globalData.userInfo) {
      app2.globalData.userInfo.currentFamilyId = familyId;
      app2.globalData.userInfo.currentFamilyName = familyName || '';
    }
    // 重新拉取最新档案，确保 familyIds 同步
    if (app2.login) {
      app2.login().then(() => this.onShow());
    } else {
      this.onShow();
    }
  },

  copyId() {
    wx.setClipboardData({
      data: this.data.currentFamilyId,
      success: () => wx.showToast({ title: '家庭ID已复制', icon: 'none' })
    });
  },

  copyInvite(e) {
    const fid = e.currentTarget.dataset.fid;
    wx.setClipboardData({
      data: fid,
      success: () => wx.showToast({ title: '已复制', icon: 'none' })
    });
  }
});
