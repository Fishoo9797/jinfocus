// cloudfunctions/getFamily/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const meRes = await db.collection('users').where({ openid }).get();
  if (meRes.data.length === 0) return { members: [] };
  const familyId = meRes.data[0].familyId;
  if (!familyId) return { members: [] };

  const famRes = await db.collection('users')
    .where({ familyId })
    .field({ openid: true, nickName: true, familyId: true })
    .get();

  // 今日日记 map
  let journalMap = {};
  if (event.date) {
    const jRes = await db.collection('journals')
      .where({ _openid: db.command.in(famRes.data.map((u) => u.openid)), date: event.date })
      .get();
    jRes.data.forEach((j) => { journalMap[j._openid] = j; });
  }

  const members = famRes.data.map((u) => {
    const j = journalMap[u.openid];
    return {
      _id: u._id,
      nickName: u.nickName,
      done: !!(j && (j.q1 || j.q2 || j.q3 || j.voiceFileID)),
      journal: j ? {
        q1: j.q1, q2: j.q2, q3: j.q3, voiceFileID: j.voiceFileID
      } : null
    };
  });

  return { members };
};
