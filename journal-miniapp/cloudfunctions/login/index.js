// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const users = db.collection('users');
  const res = await users.where({ openid }).get();
  let user = null;
  if (res.data.length === 0) {
    // 首次使用：创建空用户档案（昵称默认"我"，未加入家庭）
    const addRes = await users.add({
      data: {
        openid,
        nickName: '我',
        familyIds: [],          // 已加入的家庭ID列表（支持多家庭）
        currentFamilyId: '',    // 当前正在查看的家庭
        currentFamilyName: '',
        createdAt: new Date()
      }
    });
    const getRes = await users.doc(addRes._id).get();
    user = getRes.data;
  } else {
    user = res.data[0];
  }

  return {
    openid,
    user: {
      _id: user._id,
      openid: user.openid,
      nickName: user.nickName,
      familyIds: user.familyIds || [],
      currentFamilyId: user.currentFamilyId || '',
      currentFamilyName: user.currentFamilyName || ''
    }
  };
};
