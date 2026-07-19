// cloudfunctions/getJournals/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 先拿当前用户 → 家庭
  const meRes = await db.collection('users').where({ openid }).get();
  if (meRes.data.length === 0) return { data: [] };
  const me = meRes.data[0];
  const familyId = me.familyId;
  if (!familyId) return { data: [] };

  // 家庭成员的 openid 列表
  const famRes = await db.collection('users').where({ familyId }).get();
  const openids = famRes.data.map((u) => u.openid);

  if (event.type === 'today') {
    const date = event.date;
    const res = await db.collection('journals')
      .where({ _openid: _.in(openids), date })
      .limit(100)
      .get();
    // 附带昵称
    const nickMap = {};
    famRes.data.forEach((u) => { nickMap[u.openid] = u.nickName; });
    return {
      data: res.data.map((j) => ({
        _id: j._id,
        openid: j._openid,
        date: j.date,
        q1: j.q1, q2: j.q2, q3: j.q3,
        voiceFileID: j.voiceFileID,
        nickName: nickMap[j._openid] || '家人',
        createdAt: j.createdAt
      }))
    };
  }

  // type === 'history'：往期时间倒序
  const cond = { _openid: _.in(openids) };
  if (event.mineOnly) cond._openid = openid;
  const res = await db.collection('journals')
    .where(cond)
    .orderBy('date', 'desc')
    .limit(200)
    .get();
  const nickMap = {};
  famRes.data.forEach((u) => { nickMap[u.openid] = u.nickName; });
  return {
    data: res.data.map((j) => ({
      _id: j._id,
      openid: j._openid,
      date: j.date,
      q1: j.q1, q2: j.q2, q3: j.q3,
      voiceFileID: j.voiceFileID,
      nickName: nickMap[j._openid] || '家人',
      createdAt: j.createdAt
    }))
  };
};
