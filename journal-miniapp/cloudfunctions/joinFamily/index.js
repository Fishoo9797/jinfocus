// cloudfunctions/joinFamily/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const familyId = (event.familyId || '').trim();
  if (!familyId) return { ok: false, msg: '家庭ID为空' };

  const famRes = await db.collection('families').where({ familyId }).get();
  if (famRes.data.length === 0) {
    return { ok: false, msg: '家庭不存在，请检查ID' };
  }
  const familyName = famRes.data[0].familyName;

  // 加入 familyIds 数组（不重复）；若无当前家庭则设为当前
  const meRes = await db.collection('users').where({ openid }).get();
  const myIds = (meRes.data[0] && meRes.data[0].familyIds) || [];
  const updateData = { familyIds: db.command.push(familyId) };
  if (!myIds.includes(familyId)) {
    // 去重：若已存在则不重复 push
    if (myIds.length === 0) {
      updateData.currentFamilyId = familyId;
      updateData.currentFamilyName = familyName;
    }
  }
  if (myIds.includes(familyId)) {
    // 已在家庭中，仅切换当前
    updateData.currentFamilyId = familyId;
    updateData.currentFamilyName = familyName;
    delete updateData.familyIds;
  }
  await db.collection('users').where({ openid }).update({ data: updateData });

  return { ok: true, familyId, familyName };
};
