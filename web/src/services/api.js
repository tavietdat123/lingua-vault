const API_BASE = typeof window !== 'undefined' 
  ? `http://${window.location.hostname}:5001/api` 
  : 'http://localhost:5001/api';

export const api = {
  // Vocabulary
  getWords: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/vocab?${query}`);
      return await res.json();
    } catch (e) {
      console.warn('API fetch error:', e);
      return { success: false, data: [] };
    }
  },

  getWordById: async (id) => {
    const res = await fetch(`${API_BASE}/vocab/${id}`);
    return res.json();
  },

  createWord: async (data) => {
    const res = await fetch(`${API_BASE}/vocab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateWord: async (id, data) => {
    const res = await fetch(`${API_BASE}/vocab/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteWord: async (id) => {
    const res = await fetch(`${API_BASE}/vocab/${id}`, { method: 'DELETE' });
    return res.json();
  },

  autoLookup: async (word) => {
    const res = await fetch(`${API_BASE}/vocab/lookup?word=${encodeURIComponent(word)}`);
    return res.json();
  },

  // Sentence Patterns
  getPatterns: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/patterns?${query}`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createPattern: async (data) => {
    const res = await fetch(`${API_BASE}/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePattern: async (id, data) => {
    const res = await fetch(`${API_BASE}/patterns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deletePattern: async (id) => {
    const res = await fetch(`${API_BASE}/patterns/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Notes & Smart Reader
  getNotes: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/notes?${query}`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createNote: async (data) => {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateNote: async (id, data) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteNote: async (id) => {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // SRS Spaced Repetition
  getDueItems: async () => {
    try {
      const res = await fetch(`${API_BASE}/srs/due`);
      return await res.json();
    } catch (e) {
      return { success: false, data: { words: [], patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    const res = await fetch(`${API_BASE}/srs/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, rating })
    });
    return res.json();
  },

  getStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/srs/stats`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // AI Service
  parseSentenceAI: async (sentence) => {
    const res = await fetch(`${API_BASE}/ai/parse-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence })
    });
    return res.json();
  },

  checkSentenceAI: async (targetItem, userSentence) => {
    const res = await fetch(`${API_BASE}/ai/check-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetItem, userSentence })
    });
    return res.json();
  },

  generateStoryAI: async (words = []) => {
    const res = await fetch(`${API_BASE}/ai/generate-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words })
    });
    return res.json();
  },

  // Settings & Backup
  getSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  exportDataUrl: () => `${API_BASE}/backup/export`,

  importData: async (data) => {
    const res = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    return res.json();
  },

  // Quiz Hub
  getQuizTopics: async () => {
    try {
      const res = await fetch(`${API_BASE}/quiz/topics`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  generateQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed' }) => {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  submitQuiz: async (answers = []) => {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    return res.json();
  },

  // Telegram Bot & Daily Goal
  getTelegramSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/telegram/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveTelegramSettings: async (data) => {
    const res = await fetch(`${API_BASE}/telegram/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  sendTelegramTest: async (data) => {
    const res = await fetch(`${API_BASE}/telegram/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  triggerTelegramReminder: async () => {
    const res = await fetch(`${API_BASE}/telegram/trigger-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  triggerTelegramAlarm: async () => {
    const res = await fetch(`${API_BASE}/telegram/trigger-alarm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  triggerTelegramDueReminder: async () => {
    const res = await fetch(`${API_BASE}/telegram/trigger-due-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  getDailyProgress: async () => {
    try {
      const res = await fetch(`${API_BASE}/telegram/progress`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  // AI Speaking Lab & Pronunciation Assessment
  getSpeakingPrompts: async (category = null) => {
    try {
      const url = category ? `${API_BASE}/speaking/prompts?category=${category}` : `${API_BASE}/speaking/prompts`;
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  analyzeReadAloud: async (data) => {
    const res = await fetch(`${API_BASE}/speaking/analyze-read-aloud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  analyzeQASpeaking: async (data) => {
    const res = await fetch(`${API_BASE}/speaking/analyze-qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
