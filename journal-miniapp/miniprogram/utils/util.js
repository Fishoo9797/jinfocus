// utils/util.js
// 返回本地日期字符串 yyyy-mm-dd（按用户本地时区）
function todayStr(date) {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 友好的日期显示
function prettyDate(str) {
  if (!str) return '';
  const d = new Date(str.replace(/-/g, '/'));
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${week}`;
}

// 毫秒 -> mm:ss
function duration(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

module.exports = {
  todayStr,
  prettyDate,
  duration
};
