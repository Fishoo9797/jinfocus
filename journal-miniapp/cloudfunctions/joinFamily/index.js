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

  await db.collection('users').where({ openid }).update({
    data: { familyId, familyName }
  });

  return { ok: true, familyId, familyName };
};
