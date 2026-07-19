// cloudfunctions/createFamily/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const familyName = (event.familyName || '').trim();
  if (!familyName) return { ok: false, msg: '家庭名为空' };

  // 简单唯一ID：时间戳+随机
  const familyId = 'F' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

  const famRes = await db.collection('families').add({
    data: {
      familyId,
      familyName,
      createdBy: openid,
      createdAt: new Date()
    }
  });

  // 加入 familyIds 数组，并设为当前家庭
  await db.collection('users').where({ openid }).update({
    data: {
      familyIds: db.command.push(familyId),
      currentFamilyId: familyId,
      currentFamilyName: familyName
    }
  });

  return { ok: true, familyId, familyName };
};
