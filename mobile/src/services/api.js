// Dynamic Server URL for Simulator, LAN Wi-Fi & Remote Cloud Tunnel
const defaultHost = (typeof window !== 'undefined' && window.location && window.location.hostname) 
  ? window.location.hostname 
  : 'localhost';

export const CANDIDATE_SERVERS = [
  `http://${defaultHost}:5001`,
  'http://localhost:5001',
  'http://127.0.0.1:5001',
  'http://192.168.110.47:5001',
  'http://10.0.2.2:5001'
];

let currentServerUrl = `http://${defaultHost}:5001`;

// Load saved server URL from storage if available
if (typeof localStorage !== 'undefined') {
  try {
    const saved = localStorage.getItem('linguavault_server_url');
    if (saved) currentServerUrl = saved;
  } catch (e) {}
}

export const getServerUrl = () => currentServerUrl;

export const setServerUrl = (url) => {
  if (!url) return currentServerUrl;
  let formatted = url.trim().replace(/\/+$/, '');
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = 'http://' + formatted;
  }
  currentServerUrl = formatted;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('linguavault_server_url', formatted);
    } catch (e) {}
  }
  return currentServerUrl;
};

// Safe Fast Fetch with Timeout (Default 3 seconds)
export const safeFetch = async (url, options = {}, timeoutMs = 3000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

// Auto-healing API requester
export const requestApi = async (endpoint, options = {}, timeoutMs = 3000) => {
  // 1. Try with current configured server
  try {
    const res = await safeFetch(`${currentServerUrl}${endpoint}`, options, timeoutMs);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Current server failed, scan candidate servers
  }

  // 2. Scan candidate servers rapidly
  for (const candidate of CANDIDATE_SERVERS) {
    if (candidate === currentServerUrl) continue;
    try {
      const res = await safeFetch(`${candidate}${endpoint}`, options, 1200);
      if (res.ok) {
        setServerUrl(candidate);
        return await res.json();
      }
    } catch (e) {}
  }

  throw new Error('Không thể kết nối đến máy chủ LinguaVault');
};

export const mobileApi = {
  // 0. Connection & Server Health
  checkHealth: async () => {
    try {
      const data = await requestApi('/api/health', {}, 1500);
      return { success: true, data, url: currentServerUrl };
    } catch (e) {
      return { success: false, error: e.message, url: currentServerUrl };
    }
  },

  // 1. Vocabulary (Kho từ vựng)
  getWords: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/vocab${query ? `?${query}` : ''}`);
    } catch (e) {
      console.warn('API fetch error (getWords):', e);
      return { success: false, data: [] };
    }
  },

  getWordById: async (id) => {
    return await requestApi(`/api/vocab/${id}`);
  },

  createWord: async (data) => {
    return await requestApi('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateWord: async (id, data) => {
    return await requestApi(`/api/vocab/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deleteWord: async (id) => {
    return await requestApi(`/api/vocab/${id}`, { method: 'DELETE' });
  },

  autoLookup: async (word) => {
    return await requestApi(`/api/vocab/lookup?word=${encodeURIComponent(word)}`);
  },

  // 2. Sentence Patterns (Mẫu câu)
  getPatterns: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/patterns${query ? `?${query}` : ''}`);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getPatternById: async (id) => {
    return await requestApi(`/api/patterns/${id}`);
  },

  createPattern: async (data) => {
    return await requestApi('/api/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updatePattern: async (id, data) => {
    return await requestApi(`/api/patterns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deletePattern: async (id) => {
    return await requestApi(`/api/patterns/${id}`, { method: 'DELETE' });
  },

  // 3. Notes & Smart Reader (Ghi chú & Bài đọc)
  getNotes: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await requestApi(`/api/notes${query ? `?${query}` : ''}`);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getNoteById: async (id) => {
    return await requestApi(`/api/notes/${id}`);
  },

  createNote: async (data) => {
    return await requestApi('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateNote: async (id, data) => {
    return await requestApi(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  deleteNote: async (id) => {
    return await requestApi(`/api/notes/${id}`, { method: 'DELETE' });
  },

  // 4. SRS Spaced Repetition (Ôn tập & Thống kê chuỗi ngày)
  getDueItems: async () => {
    try {
      return await requestApi('/api/srs/due');
    } catch (e) {
      return { success: false, data: { words: [], patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    return await requestApi('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, rating })
    });
  },

  getStats: async () => {
    try {
      return await requestApi('/api/srs/stats');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // 5. AI Service (Gemini Lab)
  parseSentenceAI: async (sentence) => {
    return await requestApi('/api/ai/parse-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence })
    });
  },

  checkSentenceAI: async (targetItem, userSentence) => {
    return await requestApi('/api/ai/check-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetItem, userSentence })
    });
  },

  generateStoryAI: async (words = []) => {
    return await requestApi('/api/ai/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    });
  },

  // 6. Settings & Backup / Restore
  getSettings: async () => {
    try {
      return await requestApi('/api/settings');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveSettings: async (data) => {
    return await requestApi('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  exportDataUrl: () => `${currentServerUrl}/api/backup/export`,

  importData: async (data) => {
    return await requestApi('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
  },

  // 7. Interactive Quiz Hub
  getQuizTopics: async () => {
    try {
      return await requestApi('/api/quiz/topics');
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  generateQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed' }) => {
    return await requestApi('/api/quiz/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  submitQuiz: async (answers = []) => {
    return await requestApi('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
  },

  // 8. Telegram Bot & Daily Goal
  getTelegramSettings: async () => {
    try {
      return await requestApi('/api/telegram/settings');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveTelegramSettings: async (data) => {
    return await requestApi('/api/telegram/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  sendTelegramTest: async (data) => {
    return await requestApi('/api/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  triggerTelegramReminder: async () => {
    return await requestApi('/api/telegram/trigger-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  triggerTelegramAlarm: async () => {
    return await requestApi('/api/telegram/trigger-alarm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  triggerTelegramDueReminder: async () => {
    return await requestApi('/api/telegram/trigger-due-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  getDailyProgress: async () => {
    try {
      return await requestApi('/api/telegram/progress');
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // 9. AI Speaking Lab & Pronunciation Assessment
  getSpeakingPrompts: async (category = null) => {
    try {
      const endpoint = category ? `/api/speaking/prompts?category=${category}` : '/api/speaking/prompts';
      return await requestApi(endpoint);
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  analyzeReadAloud: async (data) => {
    return await requestApi('/api/speaking/analyze-read-aloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  analyzeQASpeaking: async (data) => {
    return await requestApi('/api/speaking/analyze-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // 10. Gamification (EXP & Level) & AI Mastery Assessment Report
  getGamificationProfile: async () => {
    try {
      return await requestApi('/api/gamification/profile');
    } catch (e) {
      return { success: false, data: { level: 1, totalXp: 0, title: 'Novice Scholar 🌱', progressPercent: 0 } };
    }
  },

  addXp: async (amount, reason) => {
    try {
      return await requestApi('/api/gamification/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason })
      });
    } catch (e) {
      return { success: false };
    }
  },

  getAIMasteryReport: async () => {
    return await requestApi('/api/ai/mastery-report');
  }
};
