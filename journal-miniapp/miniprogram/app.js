// app.js
App({
  globalData: {
    // 云开发环境 ID —— 已填入
    envId: 'cloud1-d5grzvxu0c2f1eb04',
    openid: '',
    userInfo: null, // { _id, nickName, familyIds, currentFamilyId, currentFamilyName }
    familyId: '',          // 当前家庭ID（= currentFamilyId）
    familyName: '',        // 当前家庭名
    familyIds: [],         // 已加入的家庭ID列表
    families: []           // [{ familyId, familyName }]
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true
      });
    }
    this.login();
  },

  // 静默登录，拿 openid 并加载用户档案
  login() {
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: (res) => {
          const { openid, user } = res.result;
          this.globalData.openid = openid;
          if (user) {
            this.globalData.userInfo = user;
            this.globalData.familyId = user.currentFamilyId || '';
            this.globalData.familyName = user.currentFamilyName || '';
            this.globalData.familyIds = user.familyIds || [];
            this.globalData.families = (user.familyIds || []).map((fid) => ({
              familyId: fid,
              familyName: fid === user.currentFamilyId ? user.currentFamilyName : ''
            }));
          }
          resolve(res.result);
        },
        fail: (err) => {
          console.error('login failed', err);
          resolve(null);
        }
      });
    });
  }
});
