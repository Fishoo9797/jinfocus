// cloudfunctions/saveJournal/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 1) 更新昵称
  if (event.action === 'updateNick') {
    await db.collection('users').where({ openid }).update({
      data: { nickName: event.nickName }
    });
    return { ok: true };
  }

  // 2) 保存今日日记（每个用户每天一条，用 _openid+date 唯一）
  const { date, q1, q2, q3, voiceFileID } = event;
  if (!date) return { ok: false, msg: '缺少日期' };

  const journals = db.collection('journals');
  const existing = await journals.where({ _openid: openid, date }).get();

  if (existing.data.length > 0) {
    await journals.doc(existing.data[0]._id).update({
      data: { q1, q2, q3, voiceFileID: voiceFileID || '' }
    });
  } else {
    await journals.add({
      data: {
        _openid: openid,
        date,
        q1: q1 || '',
        q2: q2 || '',
        q3: q3 || '',
        voiceFileID: voiceFileID || '',
        createdAt: new Date()
      }
    });
  }
  return { ok: true };
};
