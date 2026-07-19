# 家人日记 · 每日三问（微信小程序）

一个给家人一起用的 daily journaling 小程序。每天清晨，每个家庭成员回答三个简单的问题，并能在「家人」里互相看到彼此今天的回答。

> "今天最重要的一件事是什么？／今天有什么值得感恩？／今天，我想成为一个怎样的人？"

---

## 功能一览

| 页面 | 功能 |
|------|------|
| **今日** | 回答当天三问（文字）+ 可选语音小记（纯录音条，可回放）；已写则锁定回顾 |
| **家人** | 查看同家庭所有成员今天的回答与完成情况 |
| **往期** | 时间轴回溯，可切换「全家」/「我的」 |
| **我的** | 设置昵称；创建 / 加入多个家庭；切换当前家庭；复制家庭ID分享给家人 |

- 数据存于**微信云开发**（云数据库 + 云存储 + 云函数），无需自建服务器、无需域名备案。
- **支持多家庭**：一个人可同时加入多个家庭（如原生家庭、自己的小家），在「我的」里切换当前查看的圈子，各家庭数据独立、互不干扰。

## 三个问题（可自定义）

`miniprogram/pages/index/index.js` 中的 `QUESTIONS` 常量：

```js
const QUESTIONS = [
  { key: 'q1', title: '今天最重要的一件事是什么？', hint: '无论发生什么，今天都要做的一件事。' },
  { key: 'q2', title: '今天有什么值得感恩？', hint: '哪怕是一件很小的事情。' },
  { key: 'q3', title: '今天，我想成为一个怎样的人？', hint: '选择一个品质去践行，比如：耐心、勇敢、自律、负责、真诚。' }
];
```

想改问题，直接改这段即可。

---

## 目录结构

```
journal-miniapp/
├── project.config.json          # 小程序项目配置（填 AppID）
├── sitemap.json
├── README.md
├── QUICKSTART.md               # 一步步部署指南
├── miniprogram/
│   ├── app.js / app.json / app.wxss
│   ├── utils/util.js            # 日期、时长等小工具
│   └── pages/
│       ├── index/              # 今日三问
│       ├── family/             # 家人的今日
│       ├── history/            # 往期回顾
│       └── profile/            # 我的（家庭管理、昵称）
└── cloudfunctions/
    ├── login/                  # 静默登录 + 创建用户档案
    ├── saveJournal/            # 保存/更新日记、更新昵称
    ├── getJournals/            # 查询今日/往期日记
    ├── getFamily/              # 家庭成员及今日完成情况
    ├── createFamily/           # 创建家庭
    └── joinFamily/             # 加入家庭
```

## 数据库集合（在云开发控制台创建）

| 集合 | 字段 |
|------|------|
| `users` | `openid`, `nickName`, `familyIds`(数组), `currentFamilyId`, `currentFamilyName`, `createdAt` |
| `families` | `familyId`, `familyName`, `createdBy`, `createdAt` |
| `journals` | `_openid`, `date`, `q1`, `q2`, `q3`, `voiceFileID`, `createdAt` |

> 建议在 `journals` 上给 `_openid` 和 `date` 加索引，查询更快。

## 权限说明

- 云函数以**管理员身份**读写数据库（绕过端侧权限限制），家庭隔离逻辑写在云函数内（按用户 `currentFamilyId` 过滤），安全可靠。
- 语音文件存于云存储，仅通过 fileID 在家庭成员间播放。

---

详见 **QUICKSTART.md** 完成从零到上线。
