import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Modal
} from 'react-native';
import { mobileApi, getServerUrl, setServerUrl } from './src/services/api';
import {
  IconHome,
  IconZap,
  IconBookOpen,
  IconLayers,
  IconFileText,
  IconSparkles,
  IconPlus,
  IconSettings,
  IconVolume2,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconFlame,
  IconMenu,
  IconX,
  IconCheck,
  IconArrowRight,
  IconSun,
  IconMoon,
  IconTarget,
  IconBell,
  IconMic,
  IconAward,
  IconClose
} from './src/components/VectorIcons';

const { width } = Dimensions.get('window');

// Themes Definition
const themes = {
  dark: {
    isDark: true,
    bg: '#070a13',
    card: '#111827',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    innerCard: '#0d1322',
    inputBg: '#0a0f1d',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    topBarBg: '#070a13',
    bottomBarBg: '#0a0f1d',
    drawerBg: '#0d1322',
    drawerCardBg: '#131b2e',
    statusBarStyle: 'light-content',
    accent: '#38bdf8',
    accentPill: 'rgba(56, 189, 248, 0.15)',
    accentPillBorder: 'rgba(56, 189, 248, 0.35)',
    btnPrimaryBg: '#0284c7',
    btnPrimaryText: '#ffffff',
    formulaBg: '#0a0f1d',
    exampleBg: 'rgba(56, 189, 248, 0.08)',
    exampleBorder: '#38bdf8',
    exampleText: '#e2e8f0',
  },
  light: {
    isDark: false,
    bg: '#f8fafc',
    card: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    innerCard: '#f1f5f9',
    inputBg: '#f8fafc',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    topBarBg: '#ffffff',
    bottomBarBg: '#ffffff',
    drawerBg: '#ffffff',
    drawerCardBg: '#f1f5f9',
    statusBarStyle: 'dark-content',
    accent: '#0284c7',
    accentPill: 'rgba(2, 132, 199, 0.1)',
    accentPillBorder: 'rgba(2, 132, 199, 0.25)',
    btnPrimaryBg: '#0284c7',
    btnPrimaryText: '#ffffff',
    formulaBg: '#f1f5f9',
    exampleBg: 'rgba(2, 132, 199, 0.06)',
    exampleBorder: '#0284c7',
    exampleText: '#1e293b',
  }
};

// Bảng Bậc Thang Cấp Độ Học Thuật & EXP
export const MOBILE_LEVEL_LADDER = [
  { level: 1, minXp: 0, maxXp: 200, title: 'Novice Scholar 🌱', perk: 'Khởi đầu hành trình nạp vốn từ vựng' },
  { level: 2, minXp: 200, maxXp: 500, title: 'Lexical Apprentice 🌿', perk: 'Mở khóa phân tích sâu Collocations' },
  { level: 3, minXp: 500, maxXp: 1000, title: 'Vocabulary Explorer 📘', perk: 'Kích hoạt thử thách Quiz Topic nâng cao' },
  { level: 4, minXp: 1000, maxXp: 2000, title: 'Fluent Strategist ⚡', perk: 'Tối ưu hóa tần suất ghi nhớ SM-2' },
  { level: 5, minXp: 2000, maxXp: 3500, title: 'Vault Master 💎', perk: 'Mở khóa huy hiệu Bậc Thầy Kho Từ Vựng' },
  { level: 6, minXp: 3500, maxXp: 5500, title: 'Eloquent Orator 👑', perk: 'Chuyên gia phản xạ đối thoại & Speaking' },
  { level: 7, minXp: 5500, maxXp: 8500, title: 'Linguistic Sage 🔮', perk: 'Tự động sáng tạo truyện ôn tập cá nhân hóa' },
  { level: 8, minXp: 8500, maxXp: 999999, title: 'Linguistic Grandmaster 🏆', perk: 'Danh hiệu tối thượng - Đại Sư Ngôn Ngữ' }
];

// Dynamic Audio Player for Mobile with Granular Speed & Accent
let globalMobileSpeed = 0.9;
let globalMobileAccent = 'en-US';

const playMobileAudio = (wordText, rate = null, lang = null) => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = lang || globalMobileAccent;
      utterance.rate = Math.max(0.4, Math.min(2.0, rate || globalMobileSpeed));
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
};

export default function App() {
  // Theme State (Default: Light Theme)
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? themes.dark : themes.light;

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  // Navigation: 'home' | 'review' | 'vocab' | 'patterns' | 'reader' | 'ai-lab' | 'add' | 'settings'
  const [currentTab, setCurrentTab] = useState('home');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [words, setWords] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SRS Review State
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Vocab Filter State
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabFilter, setVocabFilter] = useState('all');

  // Quick Add Word State
  const [newWord, setNewWord] = useState('');
  const [newMeaningVi, setNewMeaningVi] = useState('');
  const [newMeaningEn, setNewMeaningEn] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState('noun');
  const [newLevel, setNewLevel] = useState('B2');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Patterns State
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternFormula, setNewPatternFormula] = useState('');
  const [newPatternMeaning, setNewPatternMeaning] = useState('');
  const [newPatternExample, setNewPatternExample] = useState('');
  const [newPatternTone, setNewPatternTone] = useState('Formal');
  const [isAddingPattern, setIsAddingPattern] = useState(false);

  // Reader / Notes State
  const [selectedNote, setSelectedNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTopic, setNewNoteTopic] = useState('General');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // AI Lab State
  const [aiSubTab, setAiSubTab] = useState('parse');
  const [aiSentenceInput, setAiSentenceInput] = useState('');
  const [aiParseResult, setAiParseResult] = useState(null);
  const [aiTargetWord, setAiTargetWord] = useState('resilient');
  const [aiUserSentence, setAiUserSentence] = useState('');
  const [aiCheckResult, setAiCheckResult] = useState(null);
  const [aiStoryResult, setAiStoryResult] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Settings, Audio & Telegram State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [mobileSpeed, setMobileSpeed] = useState(0.9);
  const [mobileAccent, setMobileAccent] = useState('en-US');

  const [alarmQuestionCount, setAlarmQuestionCount] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('linguavault_alarm_q_count') || '3', 10) || 3;
    }
    return 3;
  });

  const handleUpdateAlarmCount = (cnt) => {
    setAlarmQuestionCount(cnt);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('linguavault_alarm_q_count', cnt.toString());
      } catch (e) {}
    }
  };

  const handleUpdateMobileSpeed = (val) => {
    setMobileSpeed(val);
    globalMobileSpeed = val;
  };

  const handleUpdateMobileAccent = (acc) => {
    setMobileAccent(acc);
    globalMobileAccent = acc;
  };

  // Mobile Quiz State
  const [quizTopics, setQuizTopics] = useState([]);
  const [selectedQuizTopic, setSelectedQuizTopic] = useState('All');
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [quizData, setQuizData] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizUserAnswers, setQuizUserAnswers] = useState([]);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizIsAnswered, setQuizIsAnswered] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Mobile Speaking Lab State
  const [speakingPrompts, setSpeakingPrompts] = useState([]);
  const [speakingActiveMode, setSpeakingActiveMode] = useState('read-aloud');
  const [selectedSpeakingPrompt, setSelectedSpeakingPrompt] = useState(null);
  const [speakingSpokenText, setSpeakingSpokenText] = useState('');
  const [isAnalyzingSpeaking, setIsAnalyzingSpeaking] = useState(false);
  const [speakingReadResult, setSpeakingReadResult] = useState(null);
  const [speakingQAResult, setSpeakingQAResult] = useState(null);

  // Server URL Configuration State
  const [serverUrlState, setServerUrlState] = useState(getServerUrl());
  const [serverConnected, setServerConnected] = useState(true);
  const [showServerModal, setShowServerModal] = useState(false);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverTestResult, setServerTestResult] = useState('');

  // Hardcore Alarm Challenge State & Audio Synthesizer
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmQuestions, setAlarmQuestions] = useState([]);
  const [alarmIndex, setAlarmIndex] = useState(0);
  const [alarmAnswered, setAlarmAnswered] = useState(false);
  const [alarmSelectedOpt, setAlarmSelectedOpt] = useState(null);
  const [alarmWrongOpts, setAlarmWrongOpts] = useState([]);
  const [alarmCompleted, setAlarmCompleted] = useState(false);

  // Gamification & AI Mastery Assessment State
  const [gamificationProfile, setGamificationProfile] = useState({ level: 1, totalXp: 180, title: 'Novice Scholar 🌱', progressPercent: 20 });
  const [showLevelLadderModal, setShowLevelLadderModal] = useState(false);
  const [showAIMasteryModal, setShowAIMasteryModal] = useState(false);
  const [aiMasteryReport, setAiMasteryReport] = useState(null);
  const [isLoadingAIMastery, setIsLoadingAIMastery] = useState(false);

  // Advanced Vocab Vault, Edit, Command Palette & Reader States
  const [selectedWordDetail, setSelectedWordDetail] = useState(null);
  const [editingWordData, setEditingWordData] = useState(null);
  const [isUpdatingWord, setIsUpdatingWord] = useState(false);
  const [vocabSortBy, setVocabSortBy] = useState('newest');
  const [vocabTagFilter, setVocabTagFilter] = useState('all');
  const [showCommandPaletteModal, setShowCommandPaletteModal] = useState(false);
  const [commandSearchQuery, setCommandSearchQuery] = useState('');
  const [readerContextSentence, setReaderContextSentence] = useState(null);

  const fetchMobileAIMasteryReport = async () => {
    setIsLoadingAIMastery(true);
    try {
      const res = await mobileApi.getAIMasteryReport();
      if (res?.success) {
        setAiMasteryReport(res);
      }
    } catch (e) {
      console.warn('AI report fetch error:', e);
    } finally {
      setIsLoadingAIMastery(false);
    }
  };

  const playMobileTone = (freq = 980, duration = 0.1) => {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }
      }
    } catch (e) {}
  };

  const startAlarmChallenge = () => {
    // Get configured count or default 3
    let count = 3;
    if (typeof localStorage !== 'undefined') {
      count = parseInt(localStorage.getItem('linguavault_alarm_q_count') || '3', 10) || 3;
    }

    const src = words && words.length >= count ? words : [
      { word: 'resilient', meaning_vi: 'Kiên cường, phục hồi nhanh' },
      { word: 'articulate', meaning_vi: 'Ăn nói lưu loát, mạch lạc' },
      { word: 'meticulous', meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết' },
      { word: 'leverage', meaning_vi: 'Tận dụng, phát huy tối đa đòn bẩy' },
      { word: 'pragmatic', meaning_vi: 'Thực tế, thực dụng và hiệu quả' }
    ];
    const shuffled = [...src].sort(() => 0.5 - Math.random()).slice(0, count);
    const qs = shuffled.map((w, idx) => {
      const others = src.filter(item => item.word !== w.word).map(item => item.meaning_vi).slice(0, 3);
      const opts = [...others, w.meaning_vi].sort(() => 0.5 - Math.random());
      return {
        word: w.word,
        correct: w.meaning_vi,
        options: opts
      };
    });

    playMobileTone(980, 0.2);
    setAlarmQuestions(qs);
    setAlarmIndex(0);
    setAlarmCompleted(false);
    setAlarmAnswered(false);
    setAlarmSelectedOpt(null);
    setAlarmWrongOpts([]);
    setShowAlarmModal(true);
  };

  // Load All App Data
  const loadData = async () => {
    try {
      const health = await mobileApi.checkHealth();
      setServerConnected(health.success);
      setServerTestResult(health.success ? 'online' : 'offline');
      if (health.url) setServerUrlState(health.url);

      const [statsRes, dueRes, wordsRes, patternsRes, notesRes, settingsRes, telegramRes, topicsRes, promptsRes, gamificationRes] = await Promise.all([
        mobileApi.getStats(),
        mobileApi.getDueItems(),
        mobileApi.getWords(),
        mobileApi.getPatterns(),
        mobileApi.getNotes(),
        mobileApi.getSettings(),
        mobileApi.getTelegramSettings(),
        mobileApi.getQuizTopics(),
        mobileApi.getSpeakingPrompts(),
        mobileApi.getGamificationProfile()
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (gamificationRes?.success && gamificationRes.data) setGamificationProfile(gamificationRes.data);
      if (dueRes?.success) {
        const combined = [
          ...(dueRes.data?.words || []),
          ...(dueRes.data?.patterns || [])
        ];
        setDueItems(combined);
      }
      if (wordsRes?.success) setWords(wordsRes.data || []);
      if (patternsRes?.success) setPatterns(patternsRes.data || []);
      if (notesRes?.success) setNotes(notesRes.data || []);
      if (settingsRes?.success && settingsRes.data?.gemini_api_key) {
        setApiKeyInput(settingsRes.data.gemini_api_key);
      }
      if (telegramRes?.success && telegramRes.data) {
        setDailyGoal(telegramRes.data.daily_word_goal || 10);
        setReminderTime(telegramRes.data.telegram_reminder_time || '20:00');
        setBotToken(telegramRes.data.telegram_bot_token || '');
        setChatId(telegramRes.data.telegram_chat_id || '');
        setTelegramEnabled(Boolean(telegramRes.data.telegram_enabled));
      }
      if (topicsRes?.success) {
        setQuizTopics(topicsRes.data || []);
      }
      if (promptsRes?.success && promptsRes.data) {
        setSpeakingPrompts(promptsRes.data);
        const first = promptsRes.data.find(p => p.category === 'read-aloud');
        if (first) setSelectedSpeakingPrompt(first);
      }
    } catch (e) {
      console.warn('Load data error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveServerUrl = async () => {
    setIsTestingServer(true);
    const updated = setServerUrl(serverUrlState);
    const test = await mobileApi.checkHealth(updated);
    setIsTestingServer(false);
    if (test.success) {
      setServerConnected(true);
      setServerTestResult('online');
      Alert.alert('Thành công 🎉', `Đã kết nối thành công tới Server:\n${updated}`);
      setShowServerModal(false);
      setLoading(true);
      loadData();
    } else {
      setServerConnected(false);
      setServerTestResult('offline');
      Alert.alert(
        'Không thể kết nối 🔴',
        `Không tìm thấy Server tại:\n${updated}\n\n💡 Mẹo khắc phục:\n1. Đảm bảo máy tính đang chạy: 'node run-dev.js'\n2. Điện thoại và máy tính cùng kết nối 1 mạng Wi-Fi\n3. Kiểm tra đúng địa chỉ IP máy tính (ví dụ: http://192.168.1.x:5001)`
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ⏰ AUTOMATIC ALARM WATCHER ON MOBILE (Checks every 10s and automatically fires alarm)
  useEffect(() => {
    let lastTriggeredMinute = '';

    const checkAutoAlarm = () => {
      try {
        const now = new Date();
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHH}:${currentMM}`;

        let isAlarmEnabled = true;
        let targetAlarmTime = reminderTime || '20:00';

        if (typeof localStorage !== 'undefined') {
          isAlarmEnabled = localStorage.getItem('linguavault_auto_alarm_enabled') !== 'false';
          targetAlarmTime = localStorage.getItem('linguavault_alarm_time') || reminderTime || '20:00';
        }

        if (isAlarmEnabled && currentTimeStr === targetAlarmTime && lastTriggeredMinute !== currentTimeStr) {
          lastTriggeredMinute = currentTimeStr;
          startAlarmChallenge();
        }
      } catch (e) {}
    };

    const interval = setInterval(checkAutoAlarm, 10000);
    checkAutoAlarm();

    return () => clearInterval(interval);
  }, [reminderTime, words]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateTo = (tab) => {
    setCurrentTab(tab);
    setIsNavDrawerOpen(false);
    if (tab === 'review') {
      setReviewIndex(0);
      setIsFlipped(false);
    }
  };

  // SRS Review Rating (SM-2)
  const handleReviewGrade = async (rating) => {
    const currentItem = dueItems[reviewIndex];
    if (!currentItem) return;

    await mobileApi.submitReview(currentItem.id, currentItem.type || 'word', rating);
    try {
      await mobileApi.addXp(15, 'Ôn tập thẻ Spaced Repetition (SM-2)');
    } catch (e) {}

    if (reviewIndex + 1 < dueItems.length) {
      setReviewIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      Alert.alert('🎉 Xuất Sắc!', 'Bạn đã hoàn thành phiên ôn tập hôm nay (+15 XP/thẻ).');
      loadData();
      setCurrentTab('home');
      setReviewIndex(0);
      setIsFlipped(false);
    }
  };

  // 1-Click Auto Lookup Word
  const handleAutoLookup = async (sample = null) => {
    const target = (sample || newWord).trim();
    if (!target) {
      Alert.alert('Thông báo', 'Vui lòng nhập từ tiếng Anh trước nhé!');
      return;
    }

    if (sample) setNewWord(sample);
    setIsLookingUp(true);

    try {
      const res = await mobileApi.autoLookup(target);
      if (res?.success && res.data) {
        const d = res.data;
        if (d.meaning_vi) setNewMeaningVi(d.meaning_vi);
        if (d.meaning_en) setNewMeaningEn(d.meaning_en);
        if (d.phonetic) setNewPhonetic(d.phonetic);
        if (d.part_of_speech) setNewPartOfSpeech(d.part_of_speech);
        if (d.level) setNewLevel(d.level);
        if (d.examples && d.examples.length > 0) {
          setNewExample(d.examples[0]);
        }
        playMobileAudio(target);
      } else {
        Alert.alert('Từ điển', 'Không tìm thấy từ. Bạn có thể tự nhập nghĩa vào các ô bên dưới.');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLookingUp(false);
    }
  };

  // Save New Word
  const handleSaveWord = async () => {
    if (!newWord.trim() || !newMeaningVi.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Từ tiếng Anh và Nghĩa tiếng Việt.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        word: newWord.trim(),
        meaning_vi: newMeaningVi.trim(),
        meaning_en: newMeaningEn.trim(),
        phonetic: newPhonetic.trim(),
        part_of_speech: newPartOfSpeech,
        level: newLevel,
        examples: newExample.trim() ? [newExample.trim()] : [],
        tags: ['Mobile', 'Daily']
      };

      const res = await mobileApi.createWord(payload);
      if (res?.success) {
        try {
          await mobileApi.addXp(10, `Thêm từ mới "${newWord}" vào kho`);
        } catch (e) {}
        Alert.alert('Thành công', `Đã thêm từ "${newWord}" vào kho lưu trữ! (+10 XP)`);
        setNewWord('');
        setNewMeaningVi('');
        setNewMeaningEn('');
        setNewPhonetic('');
        setNewExample('');
        loadData();
        setCurrentTab('vocab');
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể lưu từ vựng');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Word
  const handleUpdateWord = async () => {
    if (!editingWordData || !editingWordData.word.trim() || !editingWordData.meaning_vi.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền Từ tiếng Anh và Nghĩa tiếng Việt.');
      return;
    }

    setIsUpdatingWord(true);
    try {
      const res = await mobileApi.updateWord(editingWordData.id, editingWordData);
      if (res?.success) {
        Alert.alert('Thành công', `Đã cập nhật từ "${editingWordData.word}"!`);
        setEditingWordData(null);
        setSelectedWordDetail(null);
        loadData();
      } else {
        Alert.alert('Lỗi', res?.error || 'Không thể cập nhật từ vựng');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsUpdatingWord(false);
    }
  };

  // Delete Word
  const handleDeleteWord = (id, wordText) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa từ "${wordText}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await mobileApi.deleteWord(id);
          loadData();
        }
      }
    ]);
  };

  // Save Pattern
  const handleSavePattern = async () => {
    if (!newPatternName.trim() || !newPatternFormula.trim() || !newPatternMeaning.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền Tên mẫu câu, Công thức và Nghĩa tiếng Việt.');
      return;
    }

    try {
      const res = await mobileApi.createPattern({
        name: newPatternName.trim(),
        formula: newPatternFormula.trim(),
        meaning_vi: newPatternMeaning.trim(),
        examples: newPatternExample.trim() ? [newPatternExample.trim()] : [],
        tone: newPatternTone,
        tags: ['Grammar', 'Mobile']
      });

      if (res?.success) {
        Alert.alert('Thành công', 'Đã thêm mẫu câu mới!');
        setNewPatternName('');
        setNewPatternFormula('');
        setNewPatternMeaning('');
        setNewPatternExample('');
        setIsAddingPattern(false);
        loadData();
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  // Delete Pattern
  const handleDeletePattern = (id, name) => {
    Alert.alert('Xác nhận xóa', `Xóa mẫu câu "${name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await mobileApi.deletePattern(id);
          loadData();
        }
      }
    ]);
  };

  // Save Note / Article
  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tiêu đề và Nội dung bài đọc.');
      return;
    }

    try {
      const res = await mobileApi.createNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        topic: newNoteTopic.trim() || 'General'
      });

      if (res?.success) {
        Alert.alert('Thành công', 'Đã lưu bài đọc mới!');
        setNewNoteTitle('');
        setNewNoteContent('');
        setIsAddingNote(false);
        loadData();
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  // Delete Note
  const handleDeleteNote = (id, title) => {
    Alert.alert('Xác nhận xóa', `Xóa bài đọc "${title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await mobileApi.deleteNote(id);
          setSelectedNote(null);
          loadData();
        }
      }
    ]);
  };

  // AI Sentence Parse
  const handleAiParse = async () => {
    if (!aiSentenceInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng dán câu tiếng Anh cần bóc tách.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await mobileApi.parseSentenceAI(aiSentenceInput.trim());
      if (res?.success && res.data) {
        setAiParseResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể phân tích câu');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Sentence Check
  const handleAiCheck = async () => {
    if (!aiUserSentence.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập câu tiếng Anh bạn tự đặt.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await mobileApi.checkSentenceAI(aiTargetWord, aiUserSentence.trim());
      if (res?.success && res.data) {
        setAiCheckResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể chấm câu');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Story Weaver
  const handleAiStory = async () => {
    setIsAiLoading(true);
    try {
      const wordList = words.slice(0, 4).map(w => w.word);
      const res = await mobileApi.generateStoryAI(wordList);
      if (res?.success && res.data) {
        setAiStoryResult(res.data);
      } else {
        Alert.alert('AI Lab', res?.error || 'Không thể sáng tác truyện');
      }
    } catch (e) {
      Alert.alert('Lỗi AI', e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save Settings API Key
  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      const res = await mobileApi.saveSettings({ gemini_api_key: apiKeyInput.trim() });
      if (res?.success) {
        Alert.alert('Thành công', 'Đã lưu Gemini API Key! AI đã sẵn sàng hoạt động.');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingKey(false);
    }
  };

  // Telegram Settings Save
  const handleSaveTelegram = async () => {
    setIsSavingTelegram(true);
    try {
      const res = await mobileApi.saveTelegramSettings({
        daily_word_goal: parseInt(dailyGoal, 10) || 10,
        telegram_reminder_time: reminderTime,
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim(),
        telegram_enabled: telegramEnabled
      });
      if (res?.success) {
        Alert.alert('Thành công', 'Đã lưu cấu hình Mục tiêu & Bot Telegram!');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  // Telegram Test Message
  const handleTestTelegram = async () => {
    if (!botToken || !chatId) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Telegram Bot Token và Chat ID trước!');
      return;
    }

    setIsTestingTelegram(true);
    try {
      const res = await mobileApi.sendTelegramTest({
        telegram_bot_token: botToken.trim(),
        telegram_chat_id: chatId.trim()
      });
      if (res?.success) {
        Alert.alert('🎉 Thành công', 'Đã gửi tin nhắn test tới Telegram của bạn!');
      } else {
        Alert.alert('Lỗi gửi test', res?.error || 'Không thể kết nối Telegram bot');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Mobile Quiz Handlers
  const handleStartMobileQuiz = async () => {
    setIsQuizLoading(true);
    try {
      const res = await mobileApi.generateQuiz({
        topic: selectedQuizTopic,
        count: quizQuestionCount,
        mode: 'mixed'
      });

      if (res?.success && res.data.questions?.length > 0) {
        setQuizData(res.data);
        setQuizIndex(0);
        setQuizUserAnswers([]);
        setQuizSelectedOption(null);
        setQuizIsAnswered(false);
        setQuizResult(null);

        if (res.data.questions[0].type === 'listening') {
          playMobileAudio(res.data.questions[0].word);
        }
      } else {
        Alert.alert('Thông báo', res?.error || 'Không đủ từ vựng để tạo bài Quiz.');
      }
    } catch (e) {
      Alert.alert('Lỗi tạo Quiz', e.message);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleSelectQuizOption = (option) => {
    if (quizIsAnswered || !quizData) return;

    setQuizSelectedOption(option);
    setQuizIsAnswered(true);

    const currentQ = quizData.questions[quizIndex];
    const answerItem = {
      id: currentQ.id,
      word: currentQ.word,
      questionText: currentQ.questionText,
      correctAnswer: currentQ.correctAnswer,
      userAnswer: option
    };

    setQuizUserAnswers(prev => {
      const updated = [...prev];
      updated[quizIndex] = answerItem;
      return updated;
    });
  };

  const handleNextQuizQuestion = async () => {
    if (!quizData) return;

    if (quizIndex + 1 < quizData.questions.length) {
      const nextIdx = quizIndex + 1;
      setQuizIndex(nextIdx);
      setQuizSelectedOption(null);
      setQuizIsAnswered(false);

      if (quizData.questions[nextIdx].type === 'listening') {
        playMobileAudio(quizData.questions[nextIdx].word);
      }
    } else {
      setIsQuizLoading(true);
      try {
        const answersToSubmit = quizData.questions.map((q, idx) => {
          if (quizUserAnswers[idx]) return quizUserAnswers[idx];
          if (idx === quizIndex && quizSelectedOption) {
            return {
              id: q.id,
              word: q.word,
              questionText: q.questionText,
              correctAnswer: q.correctAnswer,
              userAnswer: quizSelectedOption
            };
          }
          return {
            id: q.id,
            word: q.word,
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
            userAnswer: ''
          };
        });

        const res = await mobileApi.submitQuiz(answersToSubmit);
        if (res?.success) {
          try {
            const earnedXp = Math.max(20, (res.data.correctCount || 1) * 20);
            await mobileApi.addXp(earnedXp, `Hoàn thành Quiz (${res.data.correctCount || 1} câu đúng)`);
          } catch (e) {}
          setQuizResult(res.data);
          loadData();
        } else {
          Alert.alert('Lỗi nộp bài', res?.error || 'Vui lòng thử lại');
        }
      } catch (e) {
        Alert.alert('Lỗi nộp bài', e.message);
      } finally {
        setIsQuizLoading(false);
      }
    }
  };

  // Mobile Speaking Lab Handlers
  const handleAnalyzeSpeaking = async () => {
    if (!speakingSpokenText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập hoặc nói câu tiếng Anh của bạn trước khi chấm điểm.');
      return;
    }

    setIsAnalyzingSpeaking(true);
    try {
      if (speakingActiveMode === 'read-aloud') {
        const res = await mobileApi.analyzeReadAloud({
          targetText: selectedSpeakingPrompt?.targetText || '',
          spokenText: speakingSpokenText
        });
        if (res?.success) {
          try {
            await mobileApi.addXp(50, 'Luyện phát âm AI Speaking Lab');
          } catch (e) {}
          setSpeakingReadResult(res.data);
          loadData();
        } else {
          Alert.alert('Lỗi', res?.error || 'Không thể phân tích bài đọc');
        }
      } else {
        const res = await mobileApi.analyzeQASpeaking({
          question: selectedSpeakingPrompt?.question || '',
          topic: selectedSpeakingPrompt?.topic || 'General',
          spokenText: speakingSpokenText
        });
        if (res?.success) {
          try {
            await mobileApi.addXp(50, 'Luyện hội thoại AI Speaking Lab');
          } catch (e) {}
          setSpeakingQAResult(res.data);
          loadData();
        } else {
          Alert.alert('Lỗi', res?.error || 'Không thể chấm điểm câu trả lời');
        }
      }
    } catch (e) {
      Alert.alert('Lỗi chấm điểm', e.message);
    } finally {
      setIsAnalyzingSpeaking(false);
    }
  };

  // Metrics (100% Synced with Database)
  const totalDue = dueItems.length;
  const wordStats = stats?.words || {};
  const streak = stats?.streak || 0;
  const totalCount = words.length > 0 ? words.length : (wordStats.total || 0);
  const masteredCount = words.length > 0
    ? words.filter(w => w.status === 'mastered' || (w.interval >= 6 && w.repetitions >= 3)).length
    : (wordStats.mastered || 0);

  let rank = 'Apprentice (Tập sự)';
  if (masteredCount >= 100) rank = 'Polyglot Master (Bậc thầy)';
  else if (masteredCount >= 30) rank = 'Fluent Scholar (Học giả)';
  else if (masteredCount >= 10) rank = 'Agile Learner (Chuyên cần)';

  // Filtered & Sorted Vocab List
  const filteredWords = words
    .filter(w => {
      const q = vocabSearch.toLowerCase().trim();
      const matchSearch = !q ||
        w.word.toLowerCase().includes(q) ||
        (w.meaning_vi && w.meaning_vi.toLowerCase().includes(q)) ||
        (w.meaning_en && w.meaning_en.toLowerCase().includes(q)) ||
        (w.examples && w.examples.some(ex => ex.toLowerCase().includes(q))) ||
        (w.tags && w.tags.some(tag => tag.toLowerCase().includes(q)));

      if (!matchSearch) return false;

      if (vocabFilter === 'mastered') return w.status === 'mastered' || (w.interval >= 6 && w.repetitions >= 3);
      if (vocabFilter === 'learning') return w.status === 'learning' || w.status === 'new' || w.repetitions === 0;
      if (vocabFilter === 'due') return dueItems.some(d => d.id === w.id);
      if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(vocabFilter)) {
        return (w.level || '').toUpperCase() === vocabFilter;
      }
      if (vocabFilter !== 'all') {
        return (w.tags || []).includes(vocabFilter);
      }
      return true;
    })
    .sort((a, b) => {
      if (vocabSortBy === 'az') return a.word.localeCompare(b.word);
      if (vocabSortBy === 'due') {
        const aDue = dueItems.some(d => d.id === a.id) ? 1 : 0;
        const bDue = dueItems.some(d => d.id === b.id) ? 1 : 0;
        if (aDue !== bDue) return bDue - aDue;
        return (a.interval || 0) - (b.interval || 0);
      }
      if (vocabSortBy === 'level') {
        const levels = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
        return (levels[b.level] || 0) - (levels[a.level] || 0);
      }
      // 'newest' default
      return (b.id || 0) - (a.id || 0);
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.bg} />

      {/* 1. TOP APP BAR */}
      <View style={[styles.topBar, { backgroundColor: theme.topBarBg, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.brandContainer}>
          <TouchableOpacity
            style={[styles.hamburgerBtn, { backgroundColor: theme.drawerCardBg, borderColor: theme.accentPillBorder }]}
            onPress={() => setIsNavDrawerOpen(true)}
            activeOpacity={0.7}
          >
            <IconMenu size={18} color={theme.accent} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>LinguaVault</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>Mobile Pro Hub</Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          {/* SEARCH & COMMAND PALETTE BUTTON */}
          <TouchableOpacity
            onPress={() => setShowCommandPaletteModal(true)}
            style={[styles.iconCircleBtn, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}
          >
            <IconSearch size={15} color={theme.accent} />
          </TouchableOpacity>

          {/* GAMIFICATION LEVEL PILL */}
          <TouchableOpacity
            onPress={() => setShowAIMasteryModal(true)}
            activeOpacity={0.7}
            style={[styles.gamificationTopPill, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.12)', borderColor: theme.accent }]}
          >
            <IconAward size={12} color={theme.accent} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>
              Lv.{gamificationProfile?.level || 1} • {gamificationProfile?.totalXp || 0} XP
            </Text>
          </TouchableOpacity>

          {/* STREAK PILL */}
          <View style={[styles.streakPill, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)' }]}>
            <IconFlame size={13} color="#f59e0b" />
            <Text style={styles.streakText}>{streak}d</Text>
          </View>

          {/* THEME TOGGLE BUTTON */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconCircleBtn, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}
          >
            {isDark ? (
              <IconSun size={15} color="#f59e0b" />
            ) : (
              <IconMoon size={15} color="#0284c7" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN CONTENT BODY */}
      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang đồng bộ kho dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: DASHBOARD / HOME */}
            {currentTab === 'home' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* HERO SRS ACTION CARD */}
                <View style={[styles.heroCard, totalDue > 0 ? styles.heroCardActive : styles.heroCardDone]}>
                  <View style={styles.heroHeaderPill}>
                    <IconZap size={13} color="#ffffff" />
                    <Text style={styles.heroHeaderPillText}>SPACED REPETITION (SM-2)</Text>
                  </View>

                  <Text style={styles.heroTitle}>
                    {totalDue > 0 ? `${totalDue} thẻ cần ôn tập hôm nay` : 'Tuyệt vời! Đã hoàn thành'}
                  </Text>
                  <Text style={styles.heroDesc}>
                    {totalDue > 0
                      ? 'Dành 3 phút ôn đúng thời điểm vàng để chống lại đường cong lãng quên.'
                      : 'Mọi từ vựng đều nằm trong chu kỳ ghi nhớ an toàn.'}
                  </Text>

                  {totalDue > 0 ? (
                    <TouchableOpacity
                      style={styles.heroBtn}
                      onPress={() => navigateTo('review')}
                    >
                      <Text style={styles.heroBtnText}>Bắt Đầu Ôn Tập Ngay</Text>
                      <IconArrowRight size={18} color="#0284c7" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.heroBtnSecondary}
                      onPress={() => navigateTo('add')}
                    >
                      <IconPlus size={16} color="#ffffff" />
                      <Text style={styles.heroBtnSecondaryText}>Thêm Từ Vựng Mới</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* USER LEVEL & PROGRESS CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, gap: 10 }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardSectionLabel, { color: theme.accent }]}>
                      LEVEL {gamificationProfile?.level || 1} • {gamificationProfile?.totalXp || 0} XP
                    </Text>
                    <TouchableOpacity onPress={() => setShowLevelLadderModal(true)}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.accent }}>Bảng Cấp Độ ↗</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginVertical: 2 }}>
                    {gamificationProfile?.title || 'Novice Scholar 🌱'}
                  </Text>

                  <View style={[styles.progressBarBg, { backgroundColor: theme.inputBg, height: 6, borderRadius: 3 }]}>
                    <View style={[styles.progressBarFill, { backgroundColor: theme.accent, width: `${Math.min(100, Math.max(8, gamificationProfile?.progressPercent || 0))}%`, borderRadius: 3 }]} />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.mutedText, { color: theme.textMuted }]}>
                      Tiến độ lên Lv.{(gamificationProfile?.level || 1) + 1}: {gamificationProfile?.progressPercent || 0}%
                    </Text>
                    <Text style={[styles.mutedText, { color: theme.textMuted }]}>
                      Streak: 🔥 {streak} ngày
                    </Text>
                  </View>

                  {/* AI VOCABULARY REPORT BUTTON */}
                  <TouchableOpacity
                    onPress={() => {
                      fetchMobileAIMasteryReport();
                      setShowAIMasteryModal(true);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                      borderWidth: 1,
                      borderColor: '#6366f1',
                      borderRadius: 12,
                      paddingVertical: 10,
                      gap: 6,
                      marginTop: 4
                    }}
                  >
                    <IconSparkles size={16} color="#6366f1" />
                    <Text style={{ color: '#6366f1', fontWeight: '800', fontSize: 13 }}>
                      📊 Báo Cáo Đánh Giá Năng Lực AI
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 4-GRID STATS */}
                <View style={styles.statsGrid}>
                  <TouchableOpacity onPress={() => navigateTo('vocab')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: theme.textPrimary }]}>{totalCount}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Kho Từ Vựng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateTo('vocab')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: '#10b981' }]}>{masteredCount}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Thuần Thục</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateTo('patterns')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: '#a855f7' }]}>{patterns.length}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Mẫu Câu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigateTo('reader')} style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.statBoxNum, { color: '#f59e0b' }]}>{notes.length}</Text>
                    <Text style={[styles.statBoxLabel, { color: theme.textSecondary }]}>Bài Đọc</Text>
                  </TouchableOpacity>
                </View>

                {/* QUICK ACTION ROW */}
                <View style={styles.quickActionRow}>
                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: theme.card, borderColor: '#a855f7' }]}
                    onPress={() => navigateTo('ai-lab')}
                  >
                    <IconSparkles size={20} color="#a855f7" />
                    <Text style={[styles.quickActionTitle, { color: theme.textPrimary }]}>AI English Lab</Text>
                    <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>Bóc tách & Chấm câu</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: theme.card, borderColor: theme.accent }]}
                    onPress={() => navigateTo('reader')}
                  >
                    <IconFileText size={20} color={theme.accent} />
                    <Text style={[styles.quickActionTitle, { color: theme.textPrimary }]}>Smart Reader</Text>
                    <Text style={[styles.quickActionSub, { color: theme.textSecondary }]}>Ghi chú & Bài báo</Text>
                  </TouchableOpacity>
                </View>

                {/* RECENT WORDS PREVIEW */}
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Từ Vựng Gần Đây</Text>
                  <TouchableOpacity onPress={() => navigateTo('vocab')}>
                    <Text style={[styles.linkText, { color: theme.accent }]}>Xem tất cả ({words.length})</Text>
                  </TouchableOpacity>
                </View>

                {words.slice(0, 4).map(item => (
                  <View key={item.id} style={[styles.vocabListItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.vocabItemLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.vocabWordText, { color: theme.textPrimary }]}>{item.word}</Text>
                        <TouchableOpacity onPress={() => playMobileAudio(item.word)}>
                          <IconVolume2 size={16} color={theme.accent} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.vocabPhoneticText, { color: theme.textMuted }]}>{item.phonetic || ''}</Text>
                      <Text style={[styles.vocabMeaningText, { color: theme.accent }]}>{item.meaning_vi}</Text>
                    </View>
                    <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                      <Text style={[styles.levelPillText, { color: theme.accent }]}>{item.level || 'B2'}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* TAB 2: SRS FLASHCARD REVIEW */}
            {currentTab === 'review' && (
              <View style={styles.reviewContainer}>
                {dueItems.length === 0 ? (
                  <View style={styles.centerContainer}>
                    <IconCheck size={48} color="#10b981" />
                    <Text style={[styles.celebrationTitle, { color: theme.textPrimary, marginTop: 14 }]}>Đã Hoàn Thành!</Text>
                    <Text style={[styles.celebrationDesc, { color: theme.textSecondary }]}>Không còn thẻ nào cần ôn tập hôm nay.</Text>
                    <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]} onPress={() => navigateTo('home')}>
                      <Text style={styles.primaryActionBtnText}>Về Trang Chủ</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.reviewProgressRow}>
                      <Text style={[styles.reviewProgressText, { color: theme.accent }]}>
                        Thẻ {reviewIndex + 1} / {dueItems.length}
                      </Text>
                      <TouchableOpacity onPress={() => navigateTo('home')}>
                        <Text style={[styles.reviewCloseBtn, { color: theme.textSecondary }]}>✕ Thoát</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.92}
                      onPress={() => setIsFlipped(!isFlipped)}
                      style={[
                        styles.flashcard,
                        {
                          backgroundColor: isFlipped ? theme.innerCard : theme.card,
                          borderColor: isFlipped ? theme.accent : theme.cardBorder
                        }
                      ]}
                    >
                      {!isFlipped ? (
                        <View style={styles.cardFrontContent}>
                          <View style={styles.cardFrontBadgeRow}>
                            <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                              <Text style={[styles.levelPillText, { color: theme.accent }]}>
                                {dueItems[reviewIndex]?.level || 'B2'}
                              </Text>
                            </View>
                            <TouchableOpacity onPress={() => playMobileAudio(dueItems[reviewIndex]?.word || dueItems[reviewIndex]?.name)}>
                              <IconVolume2 size={22} color={theme.accent} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.cardCenterBody}>
                            <Text style={[styles.cardWordMain, { color: theme.textPrimary }]}>
                              {dueItems[reviewIndex]?.word || dueItems[reviewIndex]?.name}
                            </Text>
                            {dueItems[reviewIndex]?.phonetic && (
                              <Text style={[styles.cardPhonetic, { color: theme.textSecondary }]}>
                                {dueItems[reviewIndex]?.phonetic}
                              </Text>
                            )}
                          </View>

                          <Text style={[styles.cardFooterHint, { color: theme.textMuted }]}>💡 Chạm để lật mặt sau xem nghĩa</Text>
                        </View>
                      ) : (
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.cardBackScroll}>
                          <View style={styles.cardFrontBadgeRow}>
                            <Text style={[styles.backWordTitle, { color: theme.textPrimary }]}>
                              {dueItems[reviewIndex]?.word || dueItems[reviewIndex]?.name}
                            </Text>
                            <TouchableOpacity onPress={() => playMobileAudio(dueItems[reviewIndex]?.word || dueItems[reviewIndex]?.name)}>
                              <IconVolume2 size={22} color={theme.accent} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.backSectionBox}>
                            <Text style={[styles.backSectionLabel, { color: theme.textSecondary }]}>Nghĩa Tiếng Việt:</Text>
                            <Text style={[styles.backMeaningVi, { color: theme.accent }]}>
                              {dueItems[reviewIndex]?.meaning_vi}
                            </Text>
                          </View>

                          {dueItems[reviewIndex]?.meaning_en && (
                            <View style={styles.backSectionBox}>
                              <Text style={[styles.backSectionLabel, { color: theme.textSecondary }]}>Định nghĩa tiếng Anh:</Text>
                              <Text style={[styles.backMeaningEn, { color: theme.textSecondary }]}>
                                {dueItems[reviewIndex]?.meaning_en}
                              </Text>
                            </View>
                          )}

                          {dueItems[reviewIndex]?.examples && dueItems[reviewIndex]?.examples.length > 0 && (
                            <View style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: theme.exampleBorder }]}>
                              <Text style={[styles.exampleText, { color: theme.exampleText }]}>
                                "{dueItems[reviewIndex]?.examples[0]}"
                              </Text>
                            </View>
                          )}
                        </ScrollView>
                      )}
                    </TouchableOpacity>

                    {isFlipped ? (
                      <View style={styles.ratingBtnGrid}>
                        <TouchableOpacity
                          style={[styles.ratingBtn, { backgroundColor: '#ef4444' }]}
                          onPress={() => handleReviewGrade('again')}
                        >
                          <Text style={styles.ratingBtnText}>Quên</Text>
                          <Text style={styles.ratingBtnSub}>1 ngày</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.ratingBtn, { backgroundColor: '#f59e0b' }]}
                          onPress={() => handleReviewGrade('hard')}
                        >
                          <Text style={styles.ratingBtnText}>Khó</Text>
                          <Text style={styles.ratingBtnSub}>3 ngày</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.ratingBtn, { backgroundColor: '#0284c7' }]}
                          onPress={() => handleReviewGrade('good')}
                        >
                          <Text style={styles.ratingBtnText}>Nhớ tốt</Text>
                          <Text style={styles.ratingBtnSub}>4 ngày</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.ratingBtn, { backgroundColor: '#10b981' }]}
                          onPress={() => handleReviewGrade('easy')}
                        >
                          <Text style={styles.ratingBtnText}>Dễ</Text>
                          <Text style={styles.ratingBtnSub}>7+ ngày</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.tapToRevealBtn, { backgroundColor: theme.btnPrimaryBg }]}
                        onPress={() => setIsFlipped(true)}
                      >
                        <Text style={styles.tapToRevealBtnText}>Chạm Để Xem Đáp Án</Text>
                        <IconArrowRight size={18} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            )}

            {/* TAB 3: VOCABULARY VAULT */}
            {currentTab === 'vocab' && (
              <View style={styles.tabContainer}>
                {/* Search Bar */}
                <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <IconSearch size={16} color={theme.textMuted} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.textPrimary }]}
                    placeholder="Tìm từ vựng, nghĩa tiếng Việt, ví dụ..."
                    placeholderTextColor={theme.textMuted}
                    value={vocabSearch}
                    onChangeText={setVocabSearch}
                  />
                  {vocabSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setVocabSearch('')}>
                      <IconX size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Tag Pills (Horizontal Scroll) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {[
                    { id: 'all', label: `Tất cả (${words.length})` },
                    { id: 'mastered', label: `💎 Thuần thục (${masteredCount})` },
                    { id: 'learning', label: `🌱 Đang học (${totalCount - masteredCount})` },
                    { id: 'due', label: `⚡ Cần ôn (${totalDue})` },
                    { id: 'B1', label: 'B1 Intermediate' },
                    { id: 'B2', label: 'B2 Upper' },
                    { id: 'C1', label: 'C1 Advanced' },
                    { id: 'C2', label: 'C2 Master' }
                  ].map(tab => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.filterChip,
                        { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingHorizontal: 12 },
                        vocabFilter === tab.id && { backgroundColor: theme.accentPill, borderColor: theme.accent }
                      ]}
                      onPress={() => setVocabFilter(tab.id)}
                    >
                      <Text style={[styles.filterChipText, { color: theme.textSecondary }, vocabFilter === tab.id && { color: theme.accent, fontWeight: '700' }]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Sort Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted }}>
                    {filteredWords.length} từ vựng
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {[
                      { id: 'newest', label: 'Mới nhất' },
                      { id: 'az', label: 'A-Z' },
                      { id: 'due', label: 'Cần ôn' },
                      { id: 'level', label: 'Cấp độ' }
                    ].map(sort => (
                      <TouchableOpacity
                        key={sort.id}
                        onPress={() => setVocabSortBy(sort.id)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          backgroundColor: vocabSortBy === sort.id ? (isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.12)') : 'transparent',
                          borderWidth: 1,
                          borderColor: vocabSortBy === sort.id ? theme.accent : 'transparent'
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '700', color: vocabSortBy === sort.id ? theme.accent : theme.textMuted }}>
                          {sort.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, gap: 8 }}>
                  {filteredWords.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Text style={{ fontSize: 13, color: theme.textMuted }}>Không tìm thấy từ vựng nào phù hợp bộ lọc.</Text>
                    </View>
                  ) : (
                    filteredWords.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.vocabListItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                        onPress={() => setSelectedWordDetail(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.vocabItemLeft}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.vocabWordText, { color: theme.textPrimary }]}>{item.word}</Text>
                              <TouchableOpacity onPress={() => playMobileAudio(item.word)}>
                                <IconVolume2 size={16} color={theme.accent} />
                              </TouchableOpacity>
                              <View style={[styles.levelPill, { backgroundColor: theme.accentPill, paddingHorizontal: 6, paddingVertical: 1 }]}>
                                <Text style={[styles.levelPillText, { color: theme.accent, fontSize: 10 }]}>{item.level || 'B2'}</Text>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteWord(item.id, item.word)}>
                              <IconTrash size={15} color="#ef4444" />
                            </TouchableOpacity>
                          </View>

                          <Text style={[styles.vocabPhoneticText, { color: theme.textMuted }]}>{item.phonetic || ''}</Text>
                          <Text style={[styles.vocabMeaningText, { color: theme.accent }]}>{item.meaning_vi}</Text>

                          {item.examples && item.examples.length > 0 && (
                            <Text style={[styles.vocabExampleSub, { color: theme.textSecondary }]} numberOfLines={2}>
                              "{item.examples[0]}"
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* TAB 4: PATTERNS HUB */}
            {currentTab === 'patterns' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Mẫu Câu & Cấu Trúc Ngữ Pháp</Text>
                  <TouchableOpacity onPress={() => setIsAddingPattern(!isAddingPattern)}>
                    <Text style={[styles.linkText, { color: theme.accent }]}>{isAddingPattern ? 'Đóng form' : '+ Thêm mẫu'}</Text>
                  </TouchableOpacity>
                </View>

                {isAddingPattern && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Thêm Mẫu Câu Mới</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8 }]}
                      placeholder="Tên cấu trúc (ví dụ: No sooner had...)"
                      placeholderTextColor={theme.textMuted}
                      value={newPatternName}
                      onChangeText={setNewPatternName}
                    />
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8 }]}
                      placeholder="Công thức (ví dụ: S + V + ...)"
                      placeholderTextColor={theme.textMuted}
                      value={newPatternFormula}
                      onChangeText={setNewPatternFormula}
                    />
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8 }]}
                      placeholder="Nghĩa tiếng Việt..."
                      placeholderTextColor={theme.textMuted}
                      value={newPatternMeaning}
                      onChangeText={setNewPatternMeaning}
                    />
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8 }]}
                      placeholder="Ví dụ mẫu..."
                      placeholderTextColor={theme.textMuted}
                      value={newPatternExample}
                      onChangeText={setNewPatternExample}
                    />
                    <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 12 }]} onPress={handleSavePattern}>
                      <Text style={styles.primaryActionBtnText}>Lưu Mẫu Câu</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {patterns.map(p => (
                  <View key={p.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.vocabWordText, { color: theme.textPrimary }]}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.levelPill, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                          <Text style={[styles.levelPillText, { color: '#a855f7' }]}>{p.tone || 'Formal'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeletePattern(p.id, p.name)}>
                          <IconTrash size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={[styles.formulaBox, { backgroundColor: theme.formulaBg }]}>
                      <Text style={[styles.formulaText, { color: theme.textPrimary }]}>{p.formula}</Text>
                    </View>
                    <Text style={[styles.vocabMeaningText, { color: theme.accent }]}>{p.meaning_vi}</Text>
                    {p.examples && p.examples.length > 0 && (
                      <View style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: theme.exampleBorder, marginTop: 8 }]}>
                        <Text style={[styles.exampleText, { color: theme.exampleText }]}>"{p.examples[0]}"</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            {/* TAB: INTERACTIVE QUIZ HUB */}
            {currentTab === 'quiz' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* 1. QUIZ RESULT SCREEN */}
                {quizResult ? (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, alignItems: 'center', paddingVertical: 24 }]}>
                    <View style={[styles.heroIconBox, { backgroundColor: quizResult.score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', width: 64, height: 64, borderRadius: 32 }]}>
                      <Text style={{ fontSize: 28 }}>{quizResult.score >= 80 ? '🏆' : '🎯'}</Text>
                    </View>
                    <Text style={[styles.heroTitle, { color: theme.textPrimary, marginTop: 12 }]}>
                      {quizResult.score >= 80 ? 'Xuất Sắc! Hoàn Thành' : 'Hoàn Thành Bài Tập!'}
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
                      Bạn trả lời đúng {quizResult.correctCount} / {quizResult.totalQuestions} câu hỏi
                    </Text>

                    {/* Stats Row */}
                    <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 }}>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1 }]}>
                        <Text style={[styles.statBoxLabel, { color: theme.textMuted }]}>Điểm Số</Text>
                        <Text style={[styles.statBoxNumber, { color: theme.accent }]}>{quizResult.score}%</Text>
                      </View>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1 }]}>
                        <Text style={[styles.statBoxLabel, { color: theme.textMuted }]}>Kinh Nghiệm</Text>
                        <Text style={[styles.statBoxNumber, { color: '#f59e0b' }]}>+{quizResult.xpEarned} XP</Text>
                      </View>
                    </View>

                    {/* Breakdown */}
                    <View style={{ width: '100%', marginTop: 20 }}>
                      <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontSize: 15, marginBottom: 10 }]}>
                        Chi Tiết Câu Trả Lời:
                      </Text>
                      {quizResult.results.map((item, idx) => (
                        <View 
                          key={idx} 
                          style={[
                            styles.vocabListItem, 
                            { 
                              backgroundColor: theme.innerCard, 
                              borderColor: theme.cardBorder, 
                              borderLeftColor: item.isCorrect ? '#10b981' : '#ef4444',
                              borderLeftWidth: 4,
                              marginBottom: 8
                            }
                          ]}
                        >
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontWeight: '800', color: theme.textPrimary, fontSize: 15 }}>{item.word}</Text>
                            <Text style={{ fontSize: 14 }}>{item.isCorrect ? '✅' : '❌'}</Text>
                          </View>
                          <Text style={{ fontSize: 13, color: item.isCorrect ? '#10b981' : '#ef4444', marginTop: 4 }}>
                            Bạn chọn: {item.userAnswer}
                          </Text>
                          {!item.isCorrect && (
                            <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '600', marginTop: 2 }}>
                              Đáp án đúng: {item.correctAnswer}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>

                    {/* Action Buttons */}
                    <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]}
                        onPress={handleStartMobileQuiz}
                      >
                        <Text style={styles.primaryActionBtnText}>🔄 Làm Lại Bài Quiz Này</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder }]}
                        onPress={() => { setQuizData(null); setQuizResult(null); }}
                      >
                        <Text style={[styles.primaryActionBtnText, { color: theme.textPrimary }]}>📚 Chọn Topic Khác</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : quizData ? (
                  /* 2. PLAYING ACTIVE QUESTION */
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontWeight: '800', color: theme.accent, fontSize: 14 }}>
                        CÂU {quizIndex + 1} / {quizData.questions.length}
                      </Text>
                      <View style={{ backgroundColor: theme.innerCard, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>🏷️ {quizData.topic}</Text>
                      </View>
                    </View>

                    {/* Question Box */}
                    {(() => {
                      const currentQ = quizData.questions[quizIndex];
                      return (
                        <>
                          <View style={[styles.innerCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, alignItems: 'center', paddingVertical: 24 }]}>
                            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, textAlign: 'center' }}>
                              {currentQ.promptSubtitle}
                            </Text>

                            {currentQ.type === 'listening' ? (
                              <TouchableOpacity
                                style={{
                                  width: 68,
                                  height: 68,
                                  borderRadius: 34,
                                  backgroundColor: theme.accent,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginVertical: 10
                                }}
                                onPress={() => playMobileAudio(currentQ.word)}
                              >
                                <IconVolume2 size={32} color="#ffffff" />
                              </TouchableOpacity>
                            ) : (
                              <>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textPrimary, textAlign: 'center', lineHeight: 30 }}>
                                  {currentQ.questionText}
                                </Text>
                                {currentQ.phonetic && currentQ.type !== 'reverse_en' && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                    <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: 'monospace' }}>{currentQ.phonetic}</Text>
                                    <TouchableOpacity onPress={() => playMobileAudio(currentQ.word)}>
                                      <IconVolume2 size={16} color={theme.accent} />
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </>
                            )}
                          </View>

                          {/* 4 Options */}
                          <View style={{ gap: 10, marginTop: 16 }}>
                            {currentQ.options.map((option, idx) => {
                              const isSelected = option === quizSelectedOption;
                              const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

                              let btnBg = theme.innerCard;
                              let btnBorder = theme.cardBorder;
                              let textColor = theme.textPrimary;

                              if (quizIsAnswered) {
                                if (isCorrect) {
                                  btnBg = 'rgba(16, 185, 129, 0.2)';
                                  btnBorder = '#10b981';
                                  textColor = '#10b981';
                                } else if (isSelected) {
                                  btnBg = 'rgba(239, 68, 68, 0.2)';
                                  btnBorder = '#ef4444';
                                  textColor = '#ef4444';
                                }
                              }

                              return (
                                <TouchableOpacity
                                  key={idx}
                                  style={[
                                    styles.vocabListItem,
                                    {
                                      backgroundColor: btnBg,
                                      borderColor: btnBorder,
                                      borderWidth: 1.5,
                                      paddingVertical: 14,
                                      paddingHorizontal: 16,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between'
                                    }
                                  ]}
                                  onPress={() => handleSelectQuizOption(option)}
                                  disabled={quizIsAnswered}
                                >
                                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor, flex: 1 }}>
                                    {option}
                                  </Text>
                                  {quizIsAnswered && isCorrect && (
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>✓</Text>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {/* Next Button */}
                          {quizIsAnswered && (
                            <TouchableOpacity
                              style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 20 }]}
                              onPress={handleNextQuizQuestion}
                            >
                              <Text style={styles.primaryActionBtnText}>
                                {quizIndex + 1 < quizData.questions.length ? 'Câu Tiếp Theo ➔' : 'Xem Kết Quả 📊'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </>
                      );
                    })()}
                  </View>
                ) : (
                  /* 3. LOBBY SCREEN (CHOOSE TOPIC) */
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                      <View style={[styles.heroBadge, { backgroundColor: theme.accentPill }]}>
                        <Text style={[styles.heroBadgeText, { color: theme.accent }]}>🎯 INTERACTIVE QUIZ HUB</Text>
                      </View>
                      <Text style={[styles.heroTitle, { color: theme.textPrimary, fontSize: 20, textAlign: 'center', marginTop: 8 }]}>
                        Luyện Quiz Trắc Nghiệm
                      </Text>
                      <Text style={[styles.heroSubtitle, { color: theme.textSecondary, textAlign: 'center', fontSize: 13 }]}>
                        Phản xạ từ vựng và củng cố trí nhớ theo từng chủ đề
                      </Text>
                    </View>

                    {/* Choose Topic */}
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 8 }]}>
                      1. Chọn Chủ Đề (Topic):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                      {quizTopics.map(t => (
                        <TouchableOpacity
                          key={t.name}
                          style={[
                            styles.filterChip,
                            { backgroundColor: selectedQuizTopic === t.name ? theme.accent : theme.innerCard, borderColor: theme.cardBorder }
                          ]}
                          onPress={() => setSelectedQuizTopic(t.name)}
                        >
                          <Text style={[styles.filterChipText, { color: selectedQuizTopic === t.name ? '#ffffff' : theme.textSecondary, fontWeight: selectedQuizTopic === t.name ? '800' : '500' }]}>
                            {t.name} ({t.count})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Question Count */}
                    <Text style={[styles.inputLabel, { color: theme.textPrimary, fontWeight: '800', marginBottom: 8 }]}>
                      2. Số Lượng Câu Hỏi:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                      {[5, 10, 15].map(cnt => (
                        <TouchableOpacity
                          key={cnt}
                          style={[
                            styles.filterChip,
                            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: quizQuestionCount === cnt ? theme.accentPill : theme.innerCard, borderColor: quizQuestionCount === cnt ? theme.accent : theme.cardBorder }
                          ]}
                          onPress={() => setQuizQuestionCount(cnt)}
                        >
                          <Text style={{ fontWeight: '800', color: quizQuestionCount === cnt ? theme.accent : theme.textPrimary, fontSize: 14 }}>
                            {cnt} câu
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Start Button */}
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg }]}
                      onPress={handleStartMobileQuiz}
                      disabled={isQuizLoading}
                    >
                      {isQuizLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.primaryActionBtnText}>🚀 Bắt Đầu Làm Bài Quiz</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}

            {/* TAB: AI SPEAKING & PRONUNCIATION LAB */}
            {currentTab === 'speaking' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Mode Selector */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.drawerCardBg, borderRadius: 12, padding: 4, marginBottom: 14 }}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: speakingActiveMode === 'read-aloud' ? theme.btnPrimaryBg : 'transparent', borderWidth: 0 }
                    ]}
                    onPress={() => {
                      setSpeakingActiveMode('read-aloud');
                      setSpeakingReadResult(null);
                      setSpeakingQAResult(null);
                      const m = speakingPrompts.find(p => p.category === 'read-aloud');
                      if (m) setSelectedSpeakingPrompt(m);
                    }}
                  >
                    <Text style={{ fontWeight: '800', color: speakingActiveMode === 'read-aloud' ? '#ffffff' : theme.textSecondary, fontSize: 12 }}>
                      🗣️ 1. Đọc Đoạn Văn
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: speakingActiveMode === 'qa' ? theme.btnPrimaryBg : 'transparent', borderWidth: 0 }
                    ]}
                    onPress={() => {
                      setSpeakingActiveMode('qa');
                      setSpeakingReadResult(null);
                      setSpeakingQAResult(null);
                      const m = speakingPrompts.find(p => p.category === 'qa');
                      if (m) setSelectedSpeakingPrompt(m);
                    }}
                  >
                    <Text style={{ fontWeight: '800', color: speakingActiveMode === 'qa' ? '#ffffff' : theme.textSecondary, fontSize: 12 }}>
                      🎙️ 2. Hỏi Đáp Speaking
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Prompt Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {speakingPrompts.filter(p => p.category === speakingActiveMode).map(p => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => {
                          setSelectedSpeakingPrompt(p);
                          setSpeakingReadResult(null);
                          setSpeakingQAResult(null);
                        }}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: selectedSpeakingPrompt?.id === p.id ? theme.accentPill : theme.card,
                            borderColor: selectedSpeakingPrompt?.id === p.id ? theme.accent : theme.cardBorder
                          }
                        ]}
                      >
                        <Text style={{ fontWeight: '700', color: selectedSpeakingPrompt?.id === p.id ? theme.accent : theme.textPrimary, fontSize: 12 }}>
                          {p.topic}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Target Prompt Box */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>
                      {speakingActiveMode === 'read-aloud' ? 'Văn Bản Cần Đọc' : 'Câu Hỏi Khảo Thí'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => playMobileAudio(speakingActiveMode === 'read-aloud' ? selectedSpeakingPrompt?.targetText : selectedSpeakingPrompt?.question)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accentPill, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                    >
                      <IconVolume2 size={14} color={theme.accent} />
                      <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>Nghe Mẫu 🔊</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary, lineHeight: 24 }}>
                    {speakingActiveMode === 'read-aloud' ? selectedSpeakingPrompt?.targetText : selectedSpeakingPrompt?.question}
                  </Text>

                  {selectedSpeakingPrompt?.tips && speakingActiveMode === 'read-aloud' && (
                    <View style={{ backgroundColor: theme.innerCard, padding: 8, borderRadius: 8, marginTop: 10 }}>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>💡 {selectedSpeakingPrompt.tips}</Text>
                    </View>
                  )}
                </View>

                {/* Input / Spoken transcript box */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 12 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Nói hoặc nhập câu trả lời tiếng Anh của bạn:
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, minHeight: 70 }]}
                    placeholder={speakingActiveMode === 'read-aloud' ? 'Nhập hoặc nói bài đọc của bạn...' : 'Nói câu trả lời của bạn vào đây...'}
                    placeholderTextColor={theme.textMuted}
                    value={speakingSpokenText}
                    onChangeText={setSpeakingSpokenText}
                    multiline
                  />

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 14 }]}
                    onPress={handleAnalyzeSpeaking}
                    disabled={isAnalyzingSpeaking}
                  >
                    {isAnalyzingSpeaking ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryActionBtnText}>✨ Chấm Điểm & Phân Tích Giọng Nói ➔</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Results View: Read-Aloud */}
                {speakingReadResult && speakingActiveMode === 'read-aloud' && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 14 }]}>
                    <View style={{ alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, color: theme.textMuted, fontWeight: '700' }}>TỔNG ĐIỂM PHÁT ÂM</Text>
                      <Text style={{ fontSize: 32, fontWeight: '900', color: theme.accent, marginTop: 2 }}>
                        {speakingReadResult.overallScore}%
                      </Text>
                    </View>

                    {/* Criteria stats */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1, padding: 8 }]}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>Độ Chuẩn</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#10b981' }}>{speakingReadResult.accuracyScore}%</Text>
                      </View>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1, padding: 8 }]}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>Trôi Chảy</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#f59e0b' }}>{speakingReadResult.fluencyScore}%</Text>
                      </View>
                      <View style={[styles.statBoxCard, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, flex: 1, padding: 8 }]}>
                        <Text style={{ fontSize: 10, color: theme.textMuted }}>Hoàn Chỉnh</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#a855f7' }}>{speakingReadResult.completenessScore}%</Text>
                      </View>
                    </View>

                    {/* Word-by-word diff */}
                    <Text style={{ fontSize: 13, fontWeight: '800', color: theme.textPrimary, marginBottom: 8 }}>
                      🔍 Phân Tích Từng Từ (Chạm để nghe phát âm):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {speakingReadResult.wordsAnalysis?.map((w, idx) => {
                        let badgeBg = 'rgba(16, 185, 129, 0.15)';
                        let textColor = '#10b981';
                        if (w.status === 'mispronounced') {
                          badgeBg = 'rgba(245, 158, 11, 0.15)';
                          textColor = '#f59e0b';
                        } else if (w.status === 'missing') {
                          badgeBg = 'rgba(239, 68, 68, 0.15)';
                          textColor = '#ef4444';
                        }

                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => playMobileAudio(w.word)}
                            style={{ backgroundColor: badgeBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                          >
                            <Text style={{ fontWeight: '700', fontSize: 13, color: textColor }}>{w.word}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Phonetic Tips */}
                    {speakingReadResult.phoneticTips?.map((tip, idx) => (
                      <Text key={idx} style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
                        ✓ {tip}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Results View: Q&A Assessment */}
                {speakingQAResult && speakingActiveMode === 'qa' && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginTop: 14 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>Kết Quả Phỏng Vấn</Text>
                      <View style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14 }}>Band {speakingQAResult.overallBand}</Text>
                      </View>
                    </View>

                    {/* 4 criteria breakdown */}
                    <View style={{ gap: 8, marginBottom: 14 }}>
                      {Object.entries(speakingQAResult.criteria || {}).map(([k, v]) => (
                        <View key={k} style={{ backgroundColor: theme.innerCard, padding: 10, borderRadius: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '800', fontSize: 12, color: theme.textPrimary, textTransform: 'capitalize' }}>{k}</Text>
                            <Text style={{ fontWeight: '800', fontSize: 12, color: theme.accent }}>Band {v.band}</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>{v.feedback}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Band 8.5 Model Answer */}
                    {speakingQAResult.modelAnswerBand85 && (
                      <View style={{ backgroundColor: theme.innerCard, padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: theme.accent }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ fontWeight: '800', color: theme.accent, fontSize: 13 }}>Câu Trả Lời Mẫu Band 8.5+:</Text>
                          <TouchableOpacity onPress={() => playMobileAudio(speakingQAResult.modelAnswerBand85)}>
                            <IconVolume2 size={16} color={theme.accent} />
                          </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.textPrimary, fontStyle: 'italic', lineHeight: 18 }}>
                          "{speakingQAResult.modelAnswerBand85}"
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}

            {/* TAB 5: SMART READER */}
            {currentTab === 'reader' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Smart Reader & Bài Đọc</Text>
                  <TouchableOpacity onPress={() => setIsAddingNote(!isAddingNote)}>
                    <Text style={[styles.linkText, { color: theme.accent }]}>{isAddingNote ? 'Đóng form' : '+ Tạo bài mới'}</Text>
                  </TouchableOpacity>
                </View>

                {isAddingNote && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Thêm Tài Liệu / Bài Đọc Mới</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8 }]}
                      placeholder="Tiêu đề bài viết..."
                      placeholderTextColor={theme.textMuted}
                      value={newNoteTitle}
                      onChangeText={setNewNoteTitle}
                    />
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8 }]}
                      placeholder="Chủ đề (Tech, IELTS, Daily...)"
                      placeholderTextColor={theme.textMuted}
                      value={newNoteTopic}
                      onChangeText={setNewNoteTopic}
                    />
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 8, height: 120 }]}
                      placeholder="Dán nội dung bài đọc tiếng Anh tại đây..."
                      placeholderTextColor={theme.textMuted}
                      value={newNoteContent}
                      onChangeText={setNewNoteContent}
                      multiline
                    />
                    <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 12 }]} onPress={handleSaveNote}>
                      <Text style={styles.primaryActionBtnText}>Lưu Bài Đọc</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedNote ? (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => setSelectedNote(null)}>
                        <Text style={[styles.linkText, { color: theme.accent }]}>← Quay lại danh sách</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteNote(selectedNote.id, selectedNote.title)}>
                        <IconTrash size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.heroTitle, { color: theme.textPrimary, marginTop: 12, fontSize: 20 }]}>{selectedNote.title}</Text>
                    <Text style={[styles.mutedText, { color: theme.textMuted }]}>Chủ đề: {selectedNote.topic || 'General'}</Text>
                    <Text style={[styles.cardMeaningEn, { marginTop: 14, fontSize: 15, lineHeight: 24, color: theme.textPrimary }]}>
                      {selectedNote.content}
                    </Text>
                  </View>
                ) : (
                  notes.map(n => (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                      onPress={() => setSelectedNote(n)}
                    >
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.vocabWordText, { color: theme.textPrimary }]}>{n.title}</Text>
                        <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                          <Text style={[styles.levelPillText, { color: theme.accent }]}>{n.topic || 'General'}</Text>
                        </View>
                      </View>
                      <Text style={[styles.vocabExampleSub, { color: theme.textSecondary }]} numberOfLines={2}>{n.content}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            {/* TAB 6: AI ENGLISH LAB */}
            {currentTab === 'ai-lab' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }, aiSubTab === 'parse' && { backgroundColor: theme.accentPill, borderColor: theme.accent }]}
                    onPress={() => setAiSubTab('parse')}
                  >
                    <Text style={[styles.filterChipText, { color: theme.textSecondary }, aiSubTab === 'parse' && { color: theme.accent, fontWeight: '700' }]}>
                      Bóc Tách Câu
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }, aiSubTab === 'check' && { backgroundColor: theme.accentPill, borderColor: theme.accent }]}
                    onPress={() => setAiSubTab('check')}
                  >
                    <Text style={[styles.filterChipText, { color: theme.textSecondary }, aiSubTab === 'check' && { color: theme.accent, fontWeight: '700' }]}>
                      Chấm & Sửa
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: theme.card, borderColor: theme.cardBorder }, aiSubTab === 'story' && { backgroundColor: theme.accentPill, borderColor: theme.accent }]}
                    onPress={() => setAiSubTab('story')}
                  >
                    <Text style={[styles.filterChipText, { color: theme.textSecondary }, aiSubTab === 'story' && { color: theme.accent, fontWeight: '700' }]}>
                      Sáng Tác Truyện
                    </Text>
                  </TouchableOpacity>
                </View>

                {aiSubTab === 'parse' && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>AI Bóc Tách Câu & Trích Xuất Từ Vựng</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Dán câu tiếng Anh để AI phân tích và dịch tự nhiên.</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 10, height: 70 }]}
                      placeholder="Dán câu tiếng Anh..."
                      placeholderTextColor={theme.textMuted}
                      value={aiSentenceInput}
                      onChangeText={setAiSentenceInput}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                      onPress={handleAiParse}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Bóc Tách Câu Bằng AI</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {aiParseResult && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={[styles.cardSectionLabel, { color: theme.textSecondary }]}>Bản dịch tự nhiên:</Text>
                        <Text style={[styles.backMeaningVi, { color: theme.accent }]}>{aiParseResult.translation_vi}</Text>
                        <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>Từ vựng trích xuất:</Text>
                        {aiParseResult.extracted_words?.map((w, idx) => (
                          <View key={idx} style={[styles.vocabListItem, { backgroundColor: theme.innerCard, borderColor: theme.cardBorder, marginTop: 8 }]}>
                            <View style={styles.vocabItemLeft}>
                              <Text style={[styles.vocabWordText, { color: theme.textPrimary }]}>{w.word}</Text>
                              <Text style={[styles.vocabMeaningText, { color: theme.accent }]}>{w.meaning_vi}</Text>
                            </View>
                            <TouchableOpacity
                              style={[styles.levelPill, { backgroundColor: theme.btnPrimaryBg }]}
                              onPress={() => {
                                setNewWord(w.word);
                                setNewMeaningVi(w.meaning_vi);
                                navigateTo('add');
                              }}
                            >
                              <Text style={[styles.levelPillText, { color: '#ffffff' }]}>+ Lưu</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {aiSubTab === 'check' && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>AI Chấm & Sửa Câu Tự Đặt</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>Viết câu với từ vựng để AI nhận xét và gợi ý câu chuẩn bản xứ.</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 10 }]}
                      placeholder="Từ mục tiêu (ví dụ: resilient)"
                      placeholderTextColor={theme.textMuted}
                      value={aiTargetWord}
                      onChangeText={setAiTargetWord}
                    />
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 10, height: 70 }]}
                      placeholder="Câu tiếng Anh của bạn..."
                      placeholderTextColor={theme.textMuted}
                      value={aiUserSentence}
                      onChangeText={setAiUserSentence}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                      onPress={handleAiCheck}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Chấm & Sửa Câu</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {aiCheckResult && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={[styles.statBoxNum, { color: '#10b981' }]}>Điểm: {aiCheckResult.score}/100</Text>
                        <Text style={[styles.backMeaningEn, { color: theme.textSecondary }]}>{aiCheckResult.feedback_vi}</Text>
                        <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>Cách diễn đạt bản xứ (Native):</Text>
                        {aiCheckResult.native_alternatives?.map((alt, idx) => (
                          <View key={idx} style={[styles.exampleBox, { backgroundColor: theme.exampleBg, borderLeftColor: theme.exampleBorder }]}>
                            <Text style={[styles.exampleText, { color: theme.exampleText }]}>"{alt}"</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {aiSubTab === 'story' && (
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Sáng Tác Truyện Ngắn Chống Quên</Text>
                    <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>AI tạo truyện 1 phút từ các từ bạn cần ôn hôm nay.</Text>
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { marginTop: 12, backgroundColor: '#a855f7' }]}
                      onPress={handleAiStory}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <IconSparkles size={16} color="#ffffff" />
                          <Text style={styles.primaryActionBtnText}>Sáng Tác Truyện Mới</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {aiStoryResult && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{aiStoryResult.title}</Text>
                        <Text style={[styles.backMeaningEn, { color: theme.textSecondary, marginTop: 8, fontSize: 15, lineHeight: 22 }]}>
                          {aiStoryResult.story_en}
                        </Text>
                        <Text style={[styles.cardSectionLabel, { color: theme.textSecondary, marginTop: 12 }]}>Bản dịch song ngữ:</Text>
                        <Text style={[styles.backMeaningVi, { color: theme.accent, fontSize: 15, fontWeight: '500' }]}>
                          {aiStoryResult.story_vi}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}

            {/* TAB 7: SETTINGS */}
            {currentTab === 'settings' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* THEME MODE SETTING CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Giao Diện Ứng Dụng (Theme Mode)</Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Tùy chọn chế độ hiển thị Dark Mode (Tối mờ) hoặc Light Mode (Sáng thanh lịch).
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      style={[
                        styles.themeOptionBtn,
                        { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder },
                        !isDark && { borderColor: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.12)' }
                      ]}
                      onPress={() => setIsDark(false)}
                    >
                      <IconSun size={20} color={!isDark ? '#0284c7' : theme.textSecondary} />
                      <Text style={[styles.themeOptionText, { color: !isDark ? '#0284c7' : theme.textSecondary }]}>
                        Light Mode (Sáng)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.themeOptionBtn,
                        { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder },
                        isDark && { borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' }
                      ]}
                      onPress={() => setIsDark(true)}
                    >
                      <IconMoon size={20} color={isDark ? '#38bdf8' : theme.textSecondary} />
                      <Text style={[styles.themeOptionText, { color: isDark ? '#38bdf8' : theme.textSecondary }]}>
                        Dark Mode (Tối)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* DAILY GOAL & TELEGRAM BOT SETTING CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IconBell size={18} color={theme.accent} />
                    <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Mục Tiêu & Bot Telegram Cảnh Báo</Text>
                  </View>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Đặt mục tiêu tối thiểu mỗi ngày. Bot Telegram sẽ tự động gửi tin nhắn nhắc nhở bảo vệ chuỗi Streak 🔥 nếu chưa hoàn thành trước giờ hẹn!
                  </Text>

                  {/* Daily Goal Chips */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>🎯 Mục tiêu số từ mỗi ngày:</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {[5, 10, 15, 20].map(cnt => (
                      <TouchableOpacity
                        key={cnt}
                        onPress={() => setDailyGoal(cnt)}
                        style={[
                          styles.filterChip,
                          { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dailyGoal === cnt ? theme.btnPrimaryBg : theme.drawerCardBg, borderColor: theme.cardBorder }
                        ]}
                      >
                        <Text style={{ fontWeight: '800', color: dailyGoal === cnt ? '#ffffff' : theme.textPrimary, fontSize: 13 }}>
                          {cnt} từ
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Reminder Time */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>⏰ Giờ nhắc nhở mỗi ngày:</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                    placeholder="20:00"
                    placeholderTextColor={theme.textMuted}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                  />

                  {/* Bot Token */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>🔑 Telegram Bot Token (@BotFather):</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                    placeholder="123456789:ABCdef..."
                    placeholderTextColor={theme.textMuted}
                    value={botToken}
                    onChangeText={setBotToken}
                    secureTextEntry
                  />

                  {/* Chat ID */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>💬 Telegram Chat ID (@userinfobot):</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 4 }]}
                    placeholder="VD: 987654321"
                    placeholderTextColor={theme.textMuted}
                    value={chatId}
                    onChangeText={setChatId}
                  />

                  {/* Toggle Notification */}
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}
                    onPress={() => setTelegramEnabled(!telegramEnabled)}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: telegramEnabled ? theme.accent : theme.cardBorder,
                      backgroundColor: telegramEnabled ? theme.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {telegramEnabled && <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 14 }}>
                      Bật thông báo tự động qua Telegram
                    </Text>
                  </TouchableOpacity>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, flex: 1 }]}
                      onPress={handleTestTelegram}
                      disabled={isTestingTelegram}
                    >
                      {isTestingTelegram ? (
                        <ActivityIndicator size="small" color={theme.accent} />
                      ) : (
                        <Text style={[styles.primaryActionBtnText, { color: theme.accent, fontSize: 13 }]}>🔔 Gửi Test Thử</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, flex: 1.2 }]}
                      onPress={handleSaveTelegram}
                      disabled={isSavingTelegram}
                    >
                      {isSavingTelegram ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={[styles.primaryActionBtnText, { fontSize: 13 }]}>Lưu Cài Đặt</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* HARDCORE ALARM QUESTION COUNT SETTING */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IconAward size={18} color="#ef4444" />
                    <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Báo Thức Kỷ Luật Thép</Text>
                  </View>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Số câu trắc nghiệm Active Recall bắt buộc phải giải đúng để tắt chuông báo thức.
                  </Text>

                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                    🎯 Số câu hỏi thử thách: <Text style={{ color: '#ef4444', fontWeight: '800' }}>{alarmQuestionCount} câu</Text>
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    {[3, 5, 10].map(cnt => (
                      <TouchableOpacity
                        key={cnt}
                        onPress={() => handleUpdateAlarmCount(cnt)}
                        style={[
                          styles.filterChip,
                          {
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alarmQuestionCount === cnt ? '#ef4444' : theme.drawerCardBg,
                            borderColor: alarmQuestionCount === cnt ? '#ef4444' : theme.cardBorder,
                            paddingVertical: 10
                          }
                        ]}
                      >
                        <Text style={{ fontWeight: '800', color: alarmQuestionCount === cnt ? '#ffffff' : theme.textPrimary, fontSize: 13 }}>
                          {cnt} câu
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* AUDIO SPEED & ACCENT SETTINGS CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <IconVolume2 size={18} color={theme.accent} />
                    <Text style={[styles.formTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Âm Thanh & Tốc Độ Phát Âm</Text>
                  </View>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Tùy chỉnh tốc độ đọc chi tiết phù hợp với trình độ nghe hiểu và luyện Shadowing.
                  </Text>

                  {/* Speed Presets */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                    ⚡ Tốc độ hiện tại: <Text style={{ color: theme.accent, fontWeight: '800' }}>{mobileSpeed.toFixed(2)}x</Text>
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    {[0.6, 0.75, 0.85, 1.0, 1.25].map(spd => (
                      <TouchableOpacity
                        key={spd}
                        onPress={() => handleUpdateMobileSpeed(spd)}
                        style={[
                          styles.filterChip,
                          { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Math.abs(mobileSpeed - spd) < 0.01 ? theme.btnPrimaryBg : theme.drawerCardBg, borderColor: theme.cardBorder }
                        ]}
                      >
                        <Text style={{ fontWeight: '800', color: Math.abs(mobileSpeed - spd) < 0.01 ? '#ffffff' : theme.textPrimary, fontSize: 12 }}>
                          {spd}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Accent Selector */}
                  <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 12 }]}>🗣️ Chất giọng phát âm:</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleUpdateMobileAccent('en-US')}
                      style={[
                        styles.filterChip,
                        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: mobileAccent === 'en-US' ? theme.accentPill : theme.drawerCardBg, borderColor: mobileAccent === 'en-US' ? theme.accent : theme.cardBorder }
                      ]}
                    >
                      <Text style={{ fontWeight: '700', color: mobileAccent === 'en-US' ? theme.accent : theme.textPrimary, fontSize: 13 }}>
                        🇺🇸 Anh - Mỹ (US)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleUpdateMobileAccent('en-GB')}
                      style={[
                        styles.filterChip,
                        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: mobileAccent === 'en-GB' ? theme.accentPill : theme.drawerCardBg, borderColor: mobileAccent === 'en-GB' ? theme.accent : theme.cardBorder }
                      ]}
                    >
                      <Text style={{ fontWeight: '700', color: mobileAccent === 'en-GB' ? theme.accent : theme.textPrimary, fontSize: 13 }}>
                        🇬🇧 Anh - Anh (UK)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Test Playback */}
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, marginTop: 14 }]}
                    onPress={() => playMobileAudio('LinguaVault empowers you to master English pronunciation.', mobileSpeed, mobileAccent)}
                  >
                    <Text style={[styles.primaryActionBtnText, { color: theme.accent, fontSize: 13 }]}>
                      🔊 Nghe Thử Tốc Độ Này ({mobileSpeed.toFixed(2)}x)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* AI CONFIG CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Cài Đặt & Cấu Hình AI</Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Dán Google Gemini API Key miễn phí (0đ) để mở khóa tính năng AI phân tích chuyên sâu.
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, marginTop: 12 }]}
                    placeholder="Dán Gemini API Key (AIzaSy...)"
                    placeholderTextColor={theme.textMuted}
                    value={apiKeyInput}
                    onChangeText={setApiKeyInput}
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 14 }]}
                    onPress={handleSaveApiKey}
                    disabled={isSavingKey}
                  >
                    {isSavingKey ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryActionBtnText}>Lưu Cài Đặt</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* BACKUP & RESTORE CARD */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>📦 Sao Lưu & Khôi Phục Dữ Liệu</Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Xuất file sao lưu JSON hoặc đồng bộ dữ liệu giữa Web và Thiết bị Di động.
                  </Text>
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, marginTop: 12 }]}
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        window.open(mobileApi.exportDataUrl(), '_blank');
                      } else {
                        Alert.alert('Sao Lưu', `Tải file sao lưu tại: ${mobileApi.exportDataUrl()}`);
                      }
                    }}
                  >
                    <Text style={[styles.primaryActionBtnText, { color: theme.accent, fontSize: 13 }]}>
                      💾 Xuất File Sao Lưu JSON (Local DB)
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.cardSectionLabel, { color: theme.textSecondary }]}>HỆ THỐNG LINGUAVAULT LOCAL-FIRST</Text>
                  <Text style={[styles.mutedText, { color: theme.textMuted, marginTop: 6, lineHeight: 18 }]}>
                    • Server API: {serverUrlState} ({serverConnected ? 'Online 🟢' : 'Offline 🔴'}){'\n'}
                    • Database: SQLite (Native, 0đ Cloud){'\n'}
                    • Spaced Repetition: SuperMemo SM-2 Engine{'\n'}
                    • AI Assistant: Google Gemini 2.0 Free Tier (0đ)
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* TAB 8: QUICK ADD WORD */}
            {currentTab === 'add' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Thêm Từ Nhanh (1-Click Auto-Fill)</Text>
                  <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                    Gõ từ tiếng Anh rồi bấm Auto-Fill để tự động lấy phiên âm và nghĩa.
                  </Text>

                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Từ tiếng Anh *</Text>
                    <View style={styles.inputWithBtnRow}>
                      <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, flex: 1, fontWeight: '700', fontSize: 16 }]}
                        placeholder="Ví dụ: articulate, resilient..."
                        placeholderTextColor={theme.textMuted}
                        value={newWord}
                        onChangeText={setNewWord}
                      />
                      <TouchableOpacity
                        style={[styles.autoFillBtn, { backgroundColor: theme.btnPrimaryBg }]}
                        onPress={() => handleAutoLookup()}
                        disabled={isLookingUp}
                      >
                        {isLookingUp ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.autoFillBtnText}>Auto-Fill</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.sampleChipsRow}>
                      <Text style={[styles.sampleChipsLabel, { color: theme.textMuted }]}>Thử từ mẫu:</Text>
                      {['resilient', 'articulate', 'pragmatic', 'leverage'].map(sample => (
                        <TouchableOpacity
                          key={sample}
                          onPress={() => handleAutoLookup(sample)}
                          style={[styles.sampleChip, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}
                        >
                          <Text style={[styles.sampleChipText, { color: theme.accent }]}>+{sample}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formRowTwo}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phiên âm (IPA)</Text>
                      <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                        placeholder="/.../"
                        placeholderTextColor={theme.textMuted}
                        value={newPhonetic}
                        onChangeText={setNewPhonetic}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Trình độ</Text>
                      <TextInput
                        style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                        placeholder="B2"
                        placeholderTextColor={theme.textMuted}
                        value={newLevel}
                        onChangeText={setNewLevel}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nghĩa tiếng Việt *</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, fontWeight: '700' }]}
                      placeholder="Nghĩa tiếng Việt tự nhiên..."
                      placeholderTextColor={theme.textMuted}
                      value={newMeaningVi}
                      onChangeText={setNewMeaningVi}
                    />
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Định nghĩa tiếng Anh</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, height: 60 }]}
                      placeholder="English definition..."
                      placeholderTextColor={theme.textMuted}
                      value={newMeaningEn}
                      onChangeText={setNewMeaningEn}
                      multiline
                    />
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Câu ví dụ thực tế</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary, height: 60 }]}
                      placeholder="Nhập câu ví dụ thực tế..."
                      placeholderTextColor={theme.textMuted}
                      value={newExample}
                      onChangeText={setNewExample}
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, { backgroundColor: theme.btnPrimaryBg, marginTop: 20 }]}
                    onPress={handleSaveWord}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryActionBtnText}>Lưu Vào Kho Từ (Save)</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* 3. PRO MAX BOTTOM TAB BAR */}
      <View style={[styles.bottomTabBar, { backgroundColor: theme.bottomBarBg, borderTopColor: theme.cardBorder }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('home')}
        >
          <IconHome size={20} color={currentTab === 'home' ? theme.accent : theme.textMuted} />
          <Text style={[styles.tabLabel, { color: currentTab === 'home' ? theme.accent : theme.textMuted }]}>Trang Chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('review')}
        >
          <View style={{ position: 'relative' }}>
            <IconZap size={20} color={currentTab === 'review' ? theme.accent : theme.textMuted} />
            {totalDue > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalDue}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, { color: currentTab === 'review' ? theme.accent : theme.textMuted }]}>Ôn Tập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateTo('add')}
        >
          <IconPlus size={20} color={currentTab === 'add' ? theme.accent : theme.textMuted} />
          <Text style={[styles.tabLabel, { color: currentTab === 'add' ? theme.accent : theme.textMuted }]}>Thêm Từ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setIsNavDrawerOpen(true)}
        >
          <IconMenu size={20} color={theme.textMuted} />
          <Text style={[styles.tabLabel, { color: theme.textMuted }]}>Tất Cả</Text>
        </TouchableOpacity>
      </View>

      {/* 4. ULTRA-PREMIUM PRO MAX SIDE DRAWER (APPLE-STYLE NAVIGATION HUB) */}
      <Modal
        visible={isNavDrawerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNavDrawerOpen(false)}
      >
        <TouchableOpacity
          style={styles.drawerBackdrop}
          activeOpacity={1}
          onPress={() => setIsNavDrawerOpen(false)}
        >
          <View style={[styles.drawerSidebar, { backgroundColor: theme.drawerBg, borderRightColor: theme.cardBorder }]} onStartShouldSetResponder={() => true}>
            {/* Drawer Header with User Rank Banner */}
            <View style={[styles.drawerHeaderBox, { borderBottomColor: theme.cardBorder }]}>
              <View style={styles.drawerUserInfo}>
                <View style={[styles.drawerAvatar, { backgroundColor: theme.accent }]}>
                  <Text style={styles.drawerAvatarText}>LV</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerUserName, { color: theme.textPrimary }]}>LinguaVault Pro</Text>
                  <Text style={[styles.drawerUserRank, { color: theme.accent }]}>{rank}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsNavDrawerOpen(false)}
                style={[styles.drawerCloseCircle, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}
              >
                <IconX size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Streak & XP Stats Banner */}
            <View style={[styles.drawerStatsBar, { backgroundColor: theme.drawerCardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.drawerStatCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <IconFlame size={14} color="#f59e0b" />
                  <Text style={styles.drawerStatNum}>{streak}d</Text>
                </View>
                <Text style={[styles.drawerStatLabel, { color: theme.textMuted }]}>Daily Streak</Text>
              </View>
              <View style={[styles.drawerStatDivider, { backgroundColor: theme.cardBorder }]}>
              </View>
              <View style={styles.drawerStatCol}>
                <Text style={[styles.drawerStatNum, { color: '#10b981' }]}>{masteredCount}</Text>
                <Text style={[styles.drawerStatLabel, { color: theme.textMuted }]}>Thuần Thục</Text>
              </View>
              <View style={[styles.drawerStatDivider, { backgroundColor: theme.cardBorder }]}>
              </View>
              <View style={styles.drawerStatCol}>
                <Text style={[styles.drawerStatNum, { color: theme.accent }]}>{totalCount}</Text>
                <Text style={[styles.drawerStatLabel, { color: theme.textMuted }]}>Kho Từ</Text>
              </View>
            </View>

            {/* Navigation Sections */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.drawerScrollArea}>
              {/* SECTION 1: HỌC TẬP & ÔN TẬP */}
              <Text style={[styles.drawerSectionTitle, { color: theme.textMuted }]}>KHÔNG GIAN HỌC TẬP</Text>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'home' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('home')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.drawerCardBg }]}>
                  <IconHome size={18} color={currentTab === 'home' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: currentTab === 'home' ? theme.accent : theme.textPrimary }]}>
                    Dashboard
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Tổng quan & Tiến độ ghi nhớ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'review' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('review')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.accentPill }]}>
                  <IconZap size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'review' ? theme.accent : theme.textPrimary }]}>
                      Ôn Tập SRS
                    </Text>
                    {totalDue > 0 && (
                      <View style={[styles.levelPill, { backgroundColor: '#ef4444' }]}>
                        <Text style={[styles.levelPillText, { color: '#ffffff' }]}>{totalDue}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Flashcard chống quên (SM-2)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'vocab' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('vocab')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.drawerCardBg }]}>
                  <IconBookOpen size={18} color={currentTab === 'vocab' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'vocab' ? theme.accent : theme.textPrimary }]}>
                      Kho Từ Vựng
                    </Text>
                    <Text style={[styles.drawerItemCount, { color: theme.textSecondary }]}>{totalCount}</Text>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Quản lý từ vựng & Collocations</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'patterns' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('patterns')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.drawerCardBg }]}>
                  <IconLayers size={18} color={currentTab === 'patterns' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'patterns' ? theme.accent : theme.textPrimary }]}>
                      Mẫu Câu & Cấu Trúc
                    </Text>
                    <Text style={[styles.drawerItemCount, { color: theme.textSecondary }]}>{patterns.length}</Text>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Ngữ pháp theo sắc thái tone</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'quiz' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('quiz')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.accentPill }]}>
                  <IconTarget size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'quiz' ? theme.accent : theme.textPrimary }]}>
                      🎯 Quiz Theo Topic
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: '#10b981' }]}>
                      <Text style={[styles.levelPillText, { color: '#ffffff' }]}>Mới</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Trắc nghiệm, phản xạ & điền từ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'speaking' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('speaking')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.accentPill }]}>
                  <IconMic size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'speaking' ? theme.accent : theme.textPrimary }]}>
                      🎙️ AI Speaking Lab
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: '#0284c7' }]}>
                      <Text style={[styles.levelPillText, { color: '#ffffff' }]}>AI</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Chấm phát âm & Hỏi đáp đối thoại</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'reader' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('reader')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.drawerCardBg }]}>
                  <IconFileText size={18} color={currentTab === 'reader' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'reader' ? theme.accent : theme.textPrimary }]}>
                      Smart Reader
                    </Text>
                    <Text style={[styles.drawerItemCount, { color: theme.textSecondary }]}>{notes.length}</Text>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Ghi chú & đọc bài báo tiếng Anh</Text>
                </View>
              </TouchableOpacity>

              {/* SECTION 2: AI ENGLISH LAB */}
              <Text style={[styles.drawerSectionTitle, { color: theme.textMuted, marginTop: 18 }]}>TRỢ LÝ AI (GEMINI 0đ)</Text>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'ai-lab' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('ai-lab')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <IconSparkles size={18} color="#a855f7" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.drawerItemTitle, { color: currentTab === 'ai-lab' ? theme.accent : theme.textPrimary }]}>
                      AI English Lab
                    </Text>
                    <View style={[styles.levelPill, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Text style={[styles.levelPillText, { color: '#a855f7' }]}>Free 0đ</Text>
                    </View>
                  </View>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Bóc tách câu, Chấm sửa & Truyện</Text>
                </View>
              </TouchableOpacity>

              {/* SECTION 3: TIỆN ÍCH & CÀI ĐẶT */}
              <Text style={[styles.drawerSectionTitle, { color: theme.textMuted, marginTop: 18 }]}>HỆ THỐNG & CÀI ĐẶT</Text>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'add' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('add')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.drawerCardBg }]}>
                  <IconPlus size={18} color={currentTab === 'add' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: currentTab === 'add' ? theme.accent : theme.textPrimary }]}>
                    Thêm Nhanh Từ Mới
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>1-Click Auto-Fill từ điển</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.drawerItem, currentTab === 'settings' && { backgroundColor: theme.accentPill, borderWidth: 1, borderColor: theme.accentPillBorder }]}
                onPress={() => navigateTo('settings')}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: theme.drawerCardBg }]}>
                  <IconSettings size={18} color={currentTab === 'settings' ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: currentTab === 'settings' ? theme.accent : theme.textPrimary }]}>
                    Cài Đặt & AI Key
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>Google Gemini Key & Local DB</Text>
                </View>
              </TouchableOpacity>

              {/* Server URL Config in Drawer */}
              <TouchableOpacity
                style={[styles.drawerItem, { marginTop: 6, backgroundColor: theme.drawerCardBg }]}
                onPress={() => {
                  setIsNavDrawerOpen(false);
                  setShowServerModal(true);
                }}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: serverConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                  <IconZap size={18} color={serverConnected ? '#10b981' : '#ef4444'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: theme.textPrimary }]}>
                    Cấu Hình IP Máy Chủ API
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>
                    {serverUrlState} ({serverConnected ? 'Đã kết nối' : 'Chưa kết nối'})
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Quick Theme Switcher in Drawer */}
              <TouchableOpacity
                style={[styles.drawerItem, { marginTop: 6, backgroundColor: theme.drawerCardBg }]}
                onPress={toggleTheme}
              >
                <View style={[styles.drawerItemIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
                  {isDark ? (
                    <IconSun size={18} color="#f59e0b" />
                  ) : (
                    <IconMoon size={18} color="#0284c7" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemTitle, { color: theme.textPrimary }]}>
                    {isDark ? 'Chuyển sang Giao diện Sáng (Light)' : 'Chuyển sang Giao diện Tối (Dark)'}
                  </Text>
                  <Text style={[styles.drawerItemDesc, { color: theme.textMuted }]}>
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={[styles.drawerFooterBox, { borderTopColor: theme.cardBorder }]}>
              <Text style={[styles.drawerFooterText, { color: theme.textMuted }]}>LinguaVault Pro Max • Local-First</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SERVER URL CONFIGURATION MODAL */}
      <Modal
        visible={showServerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.cardBorder }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary }}>⚙️ Kết Nối Máy Chủ API</Text>
              <TouchableOpacity onPress={() => setShowServerModal(false)}>
                <IconX size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 14, lineHeight: 19 }}>
              Nhập địa chỉ IP máy tính đang chạy Server hoặc đường dẫn Cloud/ngrok để điện thoại kết nối và đồng bộ dữ liệu:
            </Text>

            <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, marginBottom: 6, letterSpacing: 0.5 }}>
              ĐỊA CHỈ SERVER (PORT 5001):
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.inputBg,
                color: theme.textPrimary,
                borderWidth: 1,
                borderColor: theme.cardBorder,
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 12
              }}
              placeholder="http://192.168.1.x:5001"
              placeholderTextColor={theme.textMuted}
              value={serverUrlState}
              onChangeText={setServerUrlState}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Quick Suggestion IP Chips */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textMuted, marginBottom: 6 }}>
              GỢI Ý NHANH:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {['http://192.168.110.47:5001', 'http://localhost:5001', 'http://127.0.0.1:5001'].map(ip => (
                <TouchableOpacity
                  key={ip}
                  onPress={() => setServerUrlState(ip)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: theme.drawerCardBg,
                    borderWidth: 1,
                    borderColor: serverUrlState === ip ? theme.accent : theme.cardBorder
                  }}
                >
                  <Text style={{ fontSize: 11, color: serverUrlState === ip ? theme.accent : theme.textSecondary, fontWeight: '600' }}>
                    {ip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowServerModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: theme.drawerCardBg,
                  borderWidth: 1,
                  borderColor: theme.cardBorder
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveServerUrl}
                disabled={isTestingServer}
                style={{
                  flex: 2,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: theme.accent,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                {isTestingServer ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <IconCheck size={16} color="#ffffff" />
                )}
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>
                  {isTestingServer ? 'Đang Kiểm Tra...' : 'Lưu & Kết Nối'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* HARDCORE ALARM CHALLENGE MODAL ON MOBILE */}
      <Modal
        visible={showAlarmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.card, borderRadius: 24, padding: 22, borderWidth: 2, borderColor: '#ef4444' }}>
            {/* Urgent Red Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFlame size={20} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ef4444' }}>🚨 BÁO THỨC KỶ LUẬT THÉP</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Bắt buộc giải đúng {alarmQuestions.length} câu Quiz để tắt báo thức!</Text>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#fef08a' }}>🔒 CẤM HOÃN</Text>
              </View>
            </View>

            {!alarmCompleted ? (
              alarmQuestions.length > 0 && alarmQuestions[alarmIndex] ? (
                <View style={{ gap: 12 }}>
                  {/* Progress Indicator */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>
                      CÂU HỎI {alarmIndex + 1} / {alarmQuestions.length}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {alarmQuestions.map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 24,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: i < alarmIndex ? '#10b981' : i === alarmIndex ? '#ef4444' : theme.cardBorder
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Word Card */}
                  <View style={{ backgroundColor: theme.drawerCardBg, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, letterSpacing: 1 }}>TỪ VỰNG CẦN GIẢI MÃ</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textPrimary, marginVertical: 4 }}>
                      {alarmQuestions[alarmIndex].word.toUpperCase()}
                    </Text>
                  </View>

                  {/* Options */}
                  <View style={{ gap: 8 }}>
                    {alarmQuestions[alarmIndex].options.map((opt, idx) => {
                      const isSelected = alarmSelectedOpt === opt;
                      const isWrong = alarmWrongOpts.includes(opt);
                      const isRight = isSelected && opt === alarmQuestions[alarmIndex].correct;

                      let bg = theme.drawerCardBg;
                      let border = theme.cardBorder;
                      let textColor = theme.textPrimary;

                      if (isRight) {
                        bg = 'rgba(16, 185, 129, 0.2)';
                        border = '#10b981';
                        textColor = '#10b981';
                      } else if (isWrong) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        border = '#ef4444';
                        textColor = '#ef4444';
                      }

                      return (
                        <TouchableOpacity
                          key={idx}
                          disabled={alarmAnswered || isWrong}
                          onPress={() => {
                            if (alarmAnswered || isWrong) return;

                            const isCorrect = opt.trim().toLowerCase() === alarmQuestions[alarmIndex].correct.trim().toLowerCase();

                            if (isCorrect) {
                              setAlarmSelectedOpt(opt);
                              setAlarmAnswered(true);
                              playMobileTone(1046.5, 0.15);
                              setTimeout(() => {
                                if (alarmIndex + 1 < alarmQuestions.length) {
                                  setAlarmIndex(prev => prev + 1);
                                  setAlarmAnswered(false);
                                  setAlarmSelectedOpt(null);
                                  setAlarmWrongOpts([]);
                                } else {
                                  playMobileTone(1200, 0.3);
                                  setAlarmCompleted(true);
                                }
                              }, 500);
                            } else {
                              playMobileTone(220, 0.25);
                              setAlarmWrongOpts(prev => [...prev, opt]);
                              setAlarmSelectedOpt(opt);
                              setAlarmAnswered(true);
                              setTimeout(() => {
                                setAlarmSelectedOpt(null);
                                setAlarmAnswered(false);
                              }, 500);
                            }
                          }}
                          style={{
                            padding: 12,
                            borderRadius: 12,
                            backgroundColor: bg,
                            borderWidth: 1.5,
                            borderColor: border,
                            opacity: isWrong ? 0.6 : 1
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null
            ) : (
              /* Success Screen */
              <View style={{ alignItems: 'center', paddingVertical: 10, gap: 12 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCheck size={32} color="#10b981" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, textAlign: 'center' }}>
                  🎉 CHÚC MỪNG BẠN ĐÃ GIẢI MÃ THÀNH CÔNG!
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', lineHeight: 17 }}>
                  Chuông báo thức đã được tắt. Chuỗi Streak 🔥 của bạn đã an toàn!
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await mobileApi.addXp(30, 'Giải mã Báo Thức Kỷ Luật Thép');
                    } catch (e) {}
                    setShowAlarmModal(false);
                    setAlarmCompleted(false);
                    setAlarmAnswered(false);
                    setAlarmIndex(0);
                    loadData();
                  }}
                  style={{
                    width: '100%',
                    paddingVertical: 14,
                    borderRadius: 14,
                    backgroundColor: '#10b981',
                    alignItems: 'center',
                    marginTop: 6
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff' }}>✅ Tắt Báo Thức & Hoàn Thành (+30 XP)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 9. AI VOCABULARY MASTERY ASSESSMENT REPORT MODAL */}
      <Modal
        visible={showAIMasteryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIMasteryModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '88%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconSparkles size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>Báo Cáo Đánh Giá AI</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Khảo thí CEFR & Trí nhớ SM-2</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={fetchMobileAIMasteryReport}
                  disabled={isLoadingAIMastery}
                  style={{ padding: 6 }}
                >
                  <IconRefresh size={16} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowAIMasteryModal(false)}
                  style={{ padding: 6 }}
                >
                  <IconClose size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {isLoadingAIMastery ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center' }}>
                  Giám khảo AI đang phân tích toàn bộ kho từ vựng và chu kỳ trí nhớ của bạn...
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {/* 1. Score & Estimated CEFR Level */}
                <View style={{
                  backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.2)',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>
                      TRÌNH ĐỘ CEFR ƯỚC TÍNH
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary, marginVertical: 2 }}>
                      {aiMasteryReport?.aiAssessment?.estimatedCefrLevel || 'B2 Upper-Intermediate'}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                      Đạt {totalCount} từ • Lv.{gamificationProfile?.level || 1} ({gamificationProfile?.title || 'Novice Scholar'})
                    </Text>
                  </View>

                  <View style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: theme.card,
                    borderWidth: 2.5,
                    borderColor: theme.accent,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: theme.accent }}>
                      {aiMasteryReport?.aiAssessment?.overallScore || 80}
                    </Text>
                    <Text style={{ fontSize: 8, fontWeight: '700', color: theme.textMuted }}>ĐIỂM AI</Text>
                  </View>
                </View>

                {/* 2. 3-Tier SM-2 Memory Matrix */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#10b981' }}>💎 MASTERED</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}>
                      {aiMasteryReport?.metrics?.masteredCount ?? masteredCount} từ
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>Thuộc sâu</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#38bdf8' }}>🌿 FAMILIAR</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}>
                      {aiMasteryReport?.metrics?.familiarCount ?? Math.max(0, totalCount - masteredCount)} từ
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>Đang nhớ</Text>
                  </View>

                  <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#f59e0b' }}>🌱 LEARNING</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginTop: 2 }}>
                      {aiMasteryReport?.metrics?.learningCount ?? 0} từ
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.textMuted }}>Cần ôn</Text>
                  </View>
                </View>

                {/* 3. Qualitative AI Summary */}
                <View style={{ backgroundColor: theme.drawerCardBg, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>
                    📝 NHẬN XÉT CỦA GIÁM KHẢO AI:
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textPrimary, lineHeight: 18, fontStyle: 'italic' }}>
                    "{aiMasteryReport?.aiAssessment?.evaluationSummary || `Vốn từ vựng của bạn đang phát triển vững chắc với ${totalCount} từ. Nền tảng CEFR B2 đầy tiềm năng!`}"
                  </Text>
                </View>

                {/* 4. Strengths & Action Plan */}
                {aiMasteryReport?.aiAssessment?.actionPlan && (
                  <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.08)' : 'rgba(2, 132, 199, 0.05)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent }}>
                      🚀 LỘ TRÌNH 3 BƯỚC TIẾP THEO:
                    </Text>
                    {aiMasteryReport.aiAssessment.actionPlan.map((step, idx) => (
                      <Text key={idx} style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 16 }}>
                        <b>{idx + 1}.</b> {step}
                      </Text>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setShowAIMasteryModal(false)}
                  style={{ backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 4 }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Đóng Báo Cáo</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 10. LEVEL PROGRESSION LADDER MODAL */}
      <Modal
        visible={showLevelLadderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLevelLadderModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '85%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconAward size={18} color={theme.accent} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>Bậc Thang Cấp Độ Học Thuật</Text>
                  <Text style={{ fontSize: 10, color: theme.textSecondary }}>Hệ thống Gamification & Danh hiệu</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowLevelLadderModal(false)}
                style={{ padding: 6 }}
              >
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Current Highlight */}
            <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: isDark ? 'rgba(2, 132, 199, 0.3)' : 'rgba(2, 132, 199, 0.2)', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent }}>CẤP ĐỘ HIỆN TẠI</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginVertical: 2 }}>
                Level {gamificationProfile?.level || 1}: {gamificationProfile?.title || 'Novice Scholar 🌱'}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                Tổng tích lũy: <b>{gamificationProfile?.totalXp || 0} XP</b> • Tiến độ: {gamificationProfile?.progressPercent || 0}%
              </Text>
            </View>

            {/* Ladder list */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {MOBILE_LEVEL_LADDER.map(item => {
                const isCurrent = item.level === (gamificationProfile?.level || 1);
                const isUnlocked = (gamificationProfile?.totalXp || 0) >= item.minXp;

                return (
                  <View
                    key={item.level}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: isCurrent ? (isDark ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)') : theme.drawerCardBg,
                      borderWidth: isCurrent ? 1.5 : 1,
                      borderColor: isCurrent ? theme.accent : theme.cardBorder,
                      opacity: isUnlocked ? 1 : 0.6
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: isCurrent ? theme.accent : (isUnlocked ? theme.inputBg : theme.drawerCardBg), alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: isCurrent ? '#ffffff' : (isUnlocked ? theme.accent : theme.textMuted) }}>
                          {item.level}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
                          {item.title} {isCurrent ? '⭐' : ''}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.textSecondary }} numberOfLines={1}>
                          {item.perk}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 11, fontWeight: '700', color: isUnlocked ? theme.textPrimary : theme.textMuted, marginLeft: 8 }}>
                      {item.minXp} XP
                    </Text>
                  </View>
                );
              })}

              <TouchableOpacity
                onPress={() => setShowLevelLadderModal(false)}
                style={{ backgroundColor: theme.accent, paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 8 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Đóng</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 11. WORD DETAILS MODAL */}
      <Modal
        visible={!!selectedWordDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedWordDetail(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '88%' }}>
            {selectedWordDetail && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>
                      {selectedWordDetail.word}
                    </Text>
                    <TouchableOpacity onPress={() => playMobileAudio(selectedWordDetail.word)}>
                      <IconVolume2 size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                      <Text style={[styles.levelPillText, { color: theme.accent }]}>{selectedWordDetail.level || 'B2'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => setSelectedWordDetail(null)} style={{ padding: 6 }}>
                    <IconClose size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {selectedWordDetail.phonetic && (
                    <Text style={{ fontSize: 14, color: theme.textMuted, fontStyle: 'italic' }}>
                      {selectedWordDetail.phonetic} {selectedWordDetail.part_of_speech ? `• (${selectedWordDetail.part_of_speech})` : ''}
                    </Text>
                  )}

                  <View style={{ backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.08)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: isDark ? 'rgba(2, 132, 199, 0.25)' : 'rgba(2, 132, 199, 0.15)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>NGHĨA TIẾNG VIỆT</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.textPrimary, marginTop: 2 }}>
                      {selectedWordDetail.meaning_vi}
                    </Text>
                    {selectedWordDetail.meaning_en ? (
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
                        {selectedWordDetail.meaning_en}
                      </Text>
                    ) : null}
                  </View>

                  {/* Collocations */}
                  {selectedWordDetail.collocations && selectedWordDetail.collocations.length > 0 && (
                    <View style={{ backgroundColor: theme.drawerCardBg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#a855f7', textTransform: 'uppercase', marginBottom: 6 }}>
                        ✨ CỤM TỪ ĐI KÈM (COLLOCATIONS)
                      </Text>
                      {selectedWordDetail.collocations.map((col, idx) => (
                        <Text key={idx} style={{ fontSize: 13, color: theme.textPrimary, marginVertical: 2 }}>
                          • <b>{typeof col === 'string' ? col : col.phrase}</b> {typeof col === 'object' && col.meaning ? `— ${col.meaning}` : ''}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Examples */}
                  {selectedWordDetail.examples && selectedWordDetail.examples.length > 0 && (
                    <View style={{ backgroundColor: theme.drawerCardBg, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.accent, textTransform: 'uppercase', marginBottom: 6 }}>
                        💬 CÂU VÍ DỤ THỰC TẾ
                      </Text>
                      {selectedWordDetail.examples.map((ex, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginVertical: 3 }}>
                          <TouchableOpacity onPress={() => playMobileAudio(ex)} style={{ marginTop: 2 }}>
                            <IconVolume2 size={14} color={theme.accent} />
                          </TouchableOpacity>
                          <Text style={{ fontSize: 13, color: theme.textPrimary, flex: 1, lineHeight: 18 }}>
                            "{ex}"
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* SM-2 Retention Metrics */}
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 9, color: theme.textMuted }}>KHOẢNG CÁCH</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: theme.accent }}>{selectedWordDetail.interval || 0} ngày</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 9, color: theme.textMuted }}>LẦN LẶP</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#10b981' }}>{selectedWordDetail.repetitions || 0}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.drawerCardBg, padding: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder }}>
                      <Text style={{ fontSize: 9, color: theme.textMuted }}>ĐỘ DỄ (EF)</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#f59e0b' }}>{selectedWordDetail.ease_factor || 2.5}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingWordData({ ...selectedWordDetail });
                        setSelectedWordDetail(null);
                      }}
                      style={{ flex: 1, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    >
                      <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 13 }}>✏️ Chỉnh Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        const targetId = selectedWordDetail.id;
                        const targetWord = selectedWordDetail.word;
                        setSelectedWordDetail(null);
                        handleDeleteWord(targetId, targetWord);
                      }}
                      style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444', paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>🗑️ Xóa Từ</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 12. EDIT WORD MODAL */}
      <Modal
        visible={!!editingWordData}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingWordData(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '88%' }}>
            {editingWordData && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                    ✏️ Chỉnh Sửa: {editingWordData.word}
                  </Text>
                  <TouchableOpacity onPress={() => setEditingWordData(null)} style={{ padding: 6 }}>
                    <IconClose size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Từ tiếng Anh *</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      value={editingWordData.word}
                      onChangeText={(val) => setEditingWordData({ ...editingWordData, word: val })}
                    />
                  </View>

                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nghĩa tiếng Việt *</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      value={editingWordData.meaning_vi}
                      onChangeText={(val) => setEditingWordData({ ...editingWordData, meaning_vi: val })}
                    />
                  </View>

                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phiên âm (IPA)</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      value={editingWordData.phonetic || ''}
                      onChangeText={(val) => setEditingWordData({ ...editingWordData, phonetic: val })}
                    />
                  </View>

                  <View>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Định nghĩa tiếng Anh</Text>
                    <TextInput
                      style={[styles.textInput, { backgroundColor: theme.inputBg, borderColor: theme.cardBorder, color: theme.textPrimary }]}
                      value={editingWordData.meaning_en || ''}
                      onChangeText={(val) => setEditingWordData({ ...editingWordData, meaning_en: val })}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                      onPress={() => setEditingWordData(null)}
                      style={{ flex: 1, backgroundColor: theme.drawerCardBg, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    >
                      <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleUpdateWord}
                      disabled={isUpdatingWord}
                      style={{ flex: 1.5, backgroundColor: theme.btnPrimaryBg, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                    >
                      {isUpdatingWord ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{ color: '#ffffff', fontWeight: '800' }}>Lưu Thay Đổi</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 13. COMMAND PALETTE & GLOBAL SEARCH MODAL */}
      <Modal
        visible={showCommandPaletteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCommandPaletteModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.cardBorder, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 10, marginBottom: 12 }}>
              <IconSearch size={18} color={theme.accent} />
              <TextInput
                style={{ flex: 1, fontSize: 15, color: theme.textPrimary, fontWeight: '600' }}
                placeholder="Tra cứu từ, cấu trúc, bài đọc, phím tắt..."
                placeholderTextColor={theme.textMuted}
                value={commandSearchQuery}
                onChangeText={setCommandSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowCommandPaletteModal(false)} style={{ padding: 4 }}>
                <IconClose size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {/* Quick Actions Shortcuts */}
              {!commandSearchQuery && (
                <View style={{ gap: 4, marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>PHÍM TẮT ĐIỀU HƯỚNG</Text>
                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => { setShowCommandPaletteModal(false); navigateTo('review'); }}
                  >
                    <IconZap size={16} color={theme.accent} />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Ôn tập Thẻ Spaced Repetition (SM-2)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => { setShowCommandPaletteModal(false); navigateTo('quiz'); }}
                  >
                    <IconTarget size={16} color="#10b981" />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Làm Bài Quiz Trắc Nghiệm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => { setShowCommandPaletteModal(false); navigateTo('speaking'); }}
                  >
                    <IconSparkles size={16} color="#a855f7" />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Luyện AI Speaking & Pronunciation</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    onPress={() => { setShowCommandPaletteModal(false); fetchMobileAIMasteryReport(); setShowAIMasteryModal(true); }}
                  >
                    <IconAward size={16} color="#f59e0b" />
                    <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 13 }}>Xem Báo Cáo Đánh Giá Năng Lực AI</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Matched Words */}
              {commandSearchQuery.trim() ? (
                <>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: theme.accent, textTransform: 'uppercase' }}>KHO TỪ VỰNG</Text>
                  {words
                    .filter(w => w.word.toLowerCase().includes(commandSearchQuery.toLowerCase()) || (w.meaning_vi && w.meaning_vi.toLowerCase().includes(commandSearchQuery.toLowerCase())))
                    .slice(0, 5)
                    .map(w => (
                      <TouchableOpacity
                        key={w.id}
                        onPress={() => {
                          setShowCommandPaletteModal(false);
                          setSelectedWordDetail(w);
                        }}
                        style={{ padding: 10, borderRadius: 10, backgroundColor: theme.drawerCardBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <View>
                          <Text style={{ fontWeight: '700', color: theme.textPrimary, fontSize: 14 }}>{w.word}</Text>
                          <Text style={{ fontSize: 11, color: theme.accent }}>{w.meaning_vi}</Text>
                        </View>
                        <View style={[styles.levelPill, { backgroundColor: theme.accentPill }]}>
                          <Text style={[styles.levelPillText, { color: theme.accent, fontSize: 10 }]}>{w.level || 'B2'}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburgerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  gamificationTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
  },
  streakText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12,
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  tabContainer: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // HERO CARD
  heroCard: {
    borderRadius: 22,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  heroCardActive: {
    backgroundColor: '#0284c7',
  },
  heroCardDone: {
    backgroundColor: '#059669',
  },
  heroHeaderPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroHeaderPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
  heroBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  heroBtnText: {
    color: '#0284c7',
    fontWeight: '800',
    fontSize: 15,
  },
  heroBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  heroBtnSecondaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },

  // CARD GENERIC
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  rankFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mutedText: {
    fontSize: 12,
  },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  statBoxNum: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statBoxLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // QUICK ACTIONS
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  quickActionSub: {
    fontSize: 11,
  },

  // SECTION HEADER
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // VOCAB LIST ITEM
  vocabListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  vocabItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  vocabWordText: {
    fontSize: 17,
    fontWeight: '800',
  },
  vocabPhoneticText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginVertical: 2,
  },
  vocabMeaningText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  vocabExampleSub: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // PATTERNS
  formulaBox: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  formulaText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },

  // REVIEW SCREEN
  reviewContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  reviewProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewProgressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCloseBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  flashcard: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    marginVertical: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  cardFrontContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardFrontBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCenterBody: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  cardWordMain: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  cardPhonetic: {
    fontSize: 16,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  cardFooterHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  cardBackScroll: {
    flex: 1,
  },
  backWordTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  backSectionBox: {
    marginTop: 14,
  },
  backSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  backMeaningVi: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },
  backMeaningEn: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  exampleBox: {
    borderLeftWidth: 3,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  tapToRevealBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tapToRevealBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  ratingBtnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 2,
  },
  ratingBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  ratingBtnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },

  // CELEBRATION
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  celebrationDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },

  // SEARCH & FILTERS
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // FORM INPUTS
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  autoFillBtn: {
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoFillBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  sampleChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  sampleChipsLabel: {
    fontSize: 11,
  },
  sampleChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // STREAMLINED BOTTOM TAB BAR
  bottomTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  // ULTRA-PREMIUM APPLE-STYLE SIDE DRAWER
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
  },
  drawerSidebar: {
    width: Math.min(320, width * 0.82),
    height: '100%',
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 20,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  drawerHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  drawerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  drawerUserRank: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  drawerCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  drawerStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 14,
    borderWidth: 1,
  },
  drawerStatCol: {
    alignItems: 'center',
  },
  drawerStatNum: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '800',
  },
  drawerStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerStatDivider: {
    width: 1,
    height: 20,
  },
  drawerScrollArea: {
    flex: 1,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  drawerItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  drawerItemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  drawerItemCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  drawerFooterBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
  drawerFooterText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
