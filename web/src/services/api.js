const API_BASE = 'http://localhost:5001/api';

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
  }
};
