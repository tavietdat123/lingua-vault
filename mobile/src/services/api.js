// Dynamic Server URL for Simulator, LAN Wi-Fi & Remote Cloud Tunnel
let currentServerUrl = 'http://192.168.110.47:5001';

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

export const mobileApi = {
  // Health & Connection Ping Test
  checkHealth: async (testUrl = null) => {
    const base = testUrl ? setServerUrl(testUrl) : getServerUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${base}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      return { success: true, data, url: base };
    } catch (e) {
      return { success: false, error: e.message, url: base };
    }
  },

  // 1. Stats & SRS
  getStats: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/srs/stats`);
      return await res.json();
    } catch (e) {
      console.warn('API error:', e);
      return { success: false, data: {} };
    }
  },

  getDueItems: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/srs/due`);
      return await res.json();
    } catch (e) {
      console.warn('API error:', e);
      return { success: false, data: { words: [], patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/srs/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, rating })
      });
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  // 2. Vocabulary
  getWords: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/vocab`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createWord: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/vocab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deleteWord: async (id) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/vocab/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  autoLookup: async (word) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/vocab/lookup?word=${encodeURIComponent(word)}`);
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  // 3. Patterns (Mẫu câu)
  getPatterns: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/patterns`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createPattern: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deletePattern: async (id) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/patterns/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 4. Notes / Smart Reader
  getNotes: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/notes`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createNote: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deleteNote: async (id) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/notes/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 5. AI Services
  parseSentenceAI: async (sentence) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/ai/parse-sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  checkSentenceAI: async (targetItem, userSentence) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/ai/check-sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetItem, userSentence })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  generateStoryAI: async (words = []) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/ai/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 6. Settings & API Key
  getSettings: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveSettings: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 7. Quiz Hub
  getQuizTopics: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/quiz/topics`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  generateQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed' }) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  submitQuiz: async (answers = []) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 8. Telegram & Daily Goals
  getTelegramSettings: async () => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/telegram/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveTelegramSettings: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/telegram/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  sendTelegramTest: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 9. AI Speaking Lab
  getSpeakingPrompts: async (category = null) => {
    try {
      const base = getServerUrl();
      const url = category ? `${base}/api/speaking/prompts?category=${category}` : `${base}/api/speaking/prompts`;
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  analyzeReadAloud: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/speaking/analyze-read-aloud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  analyzeQASpeaking: async (data) => {
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/api/speaking/analyze-qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
