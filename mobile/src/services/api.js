// Dynamic Server URL for Simulator & Physical Devices
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5001`;
  }
  // Default Mac LAN IP for physical mobile phone over Wi-Fi
  return 'http://192.168.110.47:5001';
};

export const SERVER_URL = getBackendUrl();

export const mobileApi = {
  // 1. Stats & SRS
  getStats: async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/srs/stats`);
      return await res.json();
    } catch (e) {
      console.warn('API error:', e);
      return { success: false, data: {} };
    }
  },

  getDueItems: async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/srs/due`);
      return await res.json();
    } catch (e) {
      console.warn('API error:', e);
      return { success: false, data: { words: [], patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/srs/review`, {
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
      const res = await fetch(`${SERVER_URL}/api/vocab`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createWord: async (data) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/vocab`, {
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
      const res = await fetch(`${SERVER_URL}/api/vocab/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  autoLookup: async (word) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/vocab/lookup?word=${encodeURIComponent(word)}`);
      return await res.json();
    } catch (e) {
      return { success: false };
    }
  },

  // 3. Patterns (Mẫu câu)
  getPatterns: async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/patterns`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createPattern: async (data) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/patterns`, {
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
      const res = await fetch(`${SERVER_URL}/api/patterns/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 4. Notes / Smart Reader
  getNotes: async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/notes`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  createNote: async (data) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/notes`, {
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
      const res = await fetch(`${SERVER_URL}/api/notes/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 5. AI Services
  parseSentenceAI: async (sentence) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/ai/parse-sentence`, {
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
      const res = await fetch(`${SERVER_URL}/api/ai/check-sentence`, {
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
      const res = await fetch(`${SERVER_URL}/api/ai/generate-story`, {
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
      const res = await fetch(`${SERVER_URL}/api/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveSettings: async (data) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/settings`, {
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
      const res = await fetch(`${SERVER_URL}/api/quiz/topics`);
      return await res.json();
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  generateQuiz: async (params = { topic: 'All', count: 5, mode: 'mixed' }) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/quiz/generate`, {
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
      const res = await fetch(`${SERVER_URL}/api/quiz/submit`, {
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
      const res = await fetch(`${SERVER_URL}/api/telegram/settings`);
      return await res.json();
    } catch (e) {
      return { success: false, data: {} };
    }
  },

  saveTelegramSettings: async (data) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/telegram/settings`, {
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
      const res = await fetch(`${SERVER_URL}/api/telegram/test`, {
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
