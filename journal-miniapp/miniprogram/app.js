// app.js
App({
  globalData: {
    // 云开发环境 ID —— 在微信开发者工具开通云开发后填入
    // 你已经开通云开发，环境 ID 已填入
    envId: 'cloud1-d5grzvxu0c2f1eb04',
    openid: '',
    userInfo: null, // { _id, nickName, familyId, openid }
    familyId: '',
    familyName: ''
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
            this.globalData.familyId = user.familyId || '';
            this.globalData.familyName = user.familyName || '';
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
