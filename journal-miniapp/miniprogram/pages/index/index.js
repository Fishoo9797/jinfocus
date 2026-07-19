// pages/index/index.js
const app = getApp();
const util = require('../../utils/util.js');

// 三个自定义问题
const QUESTIONS = [
  {
    key: 'q1',
    title: '今天最重要的一件事是什么？',
    hint: '无论发生什么，今天都要做的一件事。'
  },
  {
    key: 'q2',
    title: '今天有什么值得感恩？',
    hint: '哪怕是一件很小的事情。'
  },
  {
    key: 'q3',
    title: '今天，我想成为一个怎样的人？',
    hint: '选择一个品质去践行，比如：耐心、勇敢、自律、负责、真诚。'
  }
];

Page({
  data: {
    questions: QUESTIONS,
    answers: { q1: '', q2: '', q3: '' },
    dateStr: '',
    prettyDate: '',
    saved: false,            // 今天是否已保存
    recording: false,        // 是否正在录音
    recDuration: 0,          // 录音时长(ms)
    voiceFileID: '',         // 已保存的语音 fileID
    voiceTempPath: '',       // 录音临时文件
    playing: false,          // 是否正在播放
    loading: true
  },

  recorderManager: null,  // 录音管理器
  innerAudioContext: null, // 音频播放器
  recTimer: null,

  onLoad() {
    this.initRecorder();
    this.initAudio();
    this.refreshDate();
  },

  onShow() {
    // 每次回到页面刷新（可能刚创建/加入家庭）
    this.refreshDate();
    if (!this.data.loading) {
      this.loadToday();
    }
  },

  refreshDate() {
    const ds = util.todayStr();
    this.setData({
      dateStr: ds,
      prettyDate: util.prettyDate(ds)
    });
  },

  initRecorder() {
    this.recorderManager = wx.getRecorderManager();
    this.recorderManager.onStop((res) => {
      clearInterval(this.recTimer);
      this.setData({
        recording: false,
        recDuration: 0,
        voiceTempPath: res.tempFilePath
      });
      wx.showToast({ title: '录音完成', icon: 'success' });
    });
    this.recorderManager.onError((err) => {
      console.error('recorder error', err);
      this.setData({ recording: false });
      wx.showToast({ title: '录音失败', icon: 'none' });
    });
  },

  initAudio() {
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onPlay(() => this.setData({ playing: true }));
    this.innerAudioContext.onStop(() => this.setData({ playing: false }));
    this.innerAudioContext.onEnded(() => this.setData({ playing: false }));
    this.innerAudioContext.onError(() => {
      this.setData({ playing: false });
      wx.showToast({ title: '播放失败', icon: 'none' });
    });
  },

  // 加载今天的日记（若已写过）
  loadToday() {
    if (!app.globalData.openid) {
      setTimeout(() => this.loadToday(), 400);
      return;
    }
    wx.cloud.callFunction({
      name: 'getJournals',
      data: {
        type: 'today',
        date: this.data.dateStr
      },
      success: (res) => {
        const list = (res.result && res.result.data) || [];
        if (list.length > 0) {
          const j = list[0];
          this.setData({
            answers: {
              q1: j.q1 || '',
              q2: j.q2 || '',
              q3: j.q3 || ''
            },
            voiceFileID: j.voiceFileID || '',
            voiceTempPath: '',
            saved: true
          });
        }
        this.setData({ loading: false });
      },
      fail: () => {
        this.setData({ loading: false });
      }
    });
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`answers.${key}`]: e.detail.value });
  },

  // 开始 / 停止录音
  toggleRecord() {
    if (this.data.recording) {
      this.recorderManager.stop();
    } else {
      this.setData({ recording: true, recDuration: 0 });
      this.recTimer = setInterval(() => {
        this.setData({ recDuration: this.data.recDuration + 200 });
      }, 200);
      this.recorderManager.start({ format: 'mp3', duration: 120000 });
    }
  },

  // 重录
  resetVoice() {
    this.setData({ voiceTempPath: '', voiceFileID: '' });
  },

  // 播放已保存的语音（fileID 或 临时路径）
  playVoice() {
    const ctx = this.innerAudioContext;
    if (this.data.voiceTempPath) {
      ctx.src = this.data.voiceTempPath;
    } else if (this.data.voiceFileID) {
      ctx.src = this.data.voiceFileID;
    } else {
      return;
    }
    ctx.play();
  },

  // 保存今日日记
  async save() {
    const { answers, dateStr } = this.data;
    if (!answers.q1 && !answers.q2 && !answers.q3 && !this.data.voiceTempPath) {
      wx.showToast({ title: '写点什么再保存吧', icon: 'none' });
      return;
    }
    if (!app.globalData.familyId) {
      wx.showModal({
        title: '还没有家庭',
        content: '请先到「我的」页面创建或加入一个家庭，日记才会和家人们共享。',
        confirmText: '去我的',
        success: (r) => { if (r.confirm) wx.switchTab({ url: '/pages/profile/profile' }); }
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    // 若录了音，先上传到云存储
    let voiceFileID = this.data.voiceFileID;
    if (this.data.voiceTempPath) {
      try {
        const up = await wx.cloud.uploadFile({
          cloudPath: `voices/${app.globalData.openid}/${dateStr}.mp3`,
          filePath: this.data.voiceTempPath
        });
        voiceFileID = up.fileID;
      } catch (e) {
        console.error('upload voice failed', e);
      }
    }

    wx.cloud.callFunction({
      name: 'saveJournal',
      data: {
        date: dateStr,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        voiceFileID: voiceFileID
      },
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: '已保存', icon: 'success' });
        this.setData({ saved: true, voiceFileID, voiceTempPath: '' });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('save failed', err);
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  goFamily() {
    wx.switchTab({ url: '/pages/family/family' });
  },

  onShareAppMessage() {
    return {
      title: '今天的三问，写给我最重要的人',
      path: '/pages/index/index'
    };
  }
});
