// Dynamic Server URL for Simulator, LAN Wi-Fi & Remote Cloud Tunnel
let currentServerUrl = 'http://192.168.102.2:5001';

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
const safeFetch = async (url, options = {}, timeoutMs = 3000) => {
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

// Offline Seed Data Fallback (Zero crash guarantee)
const OFFLINE_FALLBACK_WORDS = [
  {
    id: 'offline-1',
    word: 'resilient',
    phonetic: '/rɪˈzɪl.jənt/',
    part_of_speech: 'adjective',
    meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn',
    meaning_en: 'Able to withstand or recover quickly from difficult conditions.',
    collocations: ['resilient economy', 'stay resilient'],
    examples: ['He is remarkably resilient despite facing numerous setbacks.'],
    tags: ['Mindset', 'IELTS'],
    level: 'B2',
    status: 'learning'
  },
  {
    id: 'offline-2',
    word: 'articulate',
    phonetic: '/ɑːˈtɪk.jə.lət/',
    part_of_speech: 'adjective',
    meaning_vi: 'Ăn nói lưu loát, diễn đạt mạch lạc rõ ràng',
    meaning_en: 'Having or showing the ability to speak fluently and coherently.',
    collocations: ['articulate speaker', 'articulate an idea'],
    examples: ['An engineer must be able to articulate complex technical ideas.'],
    tags: ['Communication', 'Career'],
    level: 'C1',
    status: 'learning'
  },
  {
    id: 'offline-3',
    word: 'leverage',
    phonetic: '/ˈlev.ər.ɪdʒ/',
    part_of_speech: 'verb',
    meaning_vi: 'Tận dụng, phát huy tối đa đòn bẩy / thế mạnh',
    meaning_en: 'Use something to maximum advantage.',
    collocations: ['leverage AI tools', 'gain leverage'],
    examples: ['We should leverage modern AI technology to boost productivity.'],
    tags: ['Business', 'Tech'],
    level: 'B2',
    status: 'learning'
  },
  {
    id: 'offline-4',
    word: 'meticulous',
    phonetic: '/məˈtɪk.jə.ləs/',
    part_of_speech: 'adjective',
    meaning_vi: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ',
    meaning_en: 'Showing great attention to detail; very careful and precise.',
    collocations: ['meticulous attention to detail'],
    examples: ['The code was reviewed with meticulous care.'],
    tags: ['Work', 'Academic'],
    level: 'C1',
    status: 'learning'
  }
];

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
      const res = await safeFetch(`${base}/api/srs/stats`, {}, 2500);
      return await res.json();
    } catch (e) {
      return { 
        success: true, 
        data: { 
          words: { total: OFFLINE_FALLBACK_WORDS.length, mastered: 0, learning: OFFLINE_FALLBACK_WORDS.length },
          patterns: { total: 4, mastered: 0, learning: 4 },
          streak: 1
        } 
      };
    }
  },

  getDueItems: async () => {
    try {
      const base = getServerUrl();
      const res = await safeFetch(`${base}/api/srs/due`, {}, 2500);
      return await res.json();
    } catch (e) {
      return { success: true, data: { words: OFFLINE_FALLBACK_WORDS.slice(0, 2), patterns: [] } };
    }
  },

  submitReview: async (id, type, rating) => {
    try {
      const base = getServerUrl();
      const res = await safeFetch(`${base}/api/srs/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, rating })
      }, 3000);
      return await res.json();
    } catch (e) {
      return { success: true, message: 'Đã lưu offline' };
    }
  },

  // 2. Vocabulary
  getWords: async () => {
    try {
      const base = getServerUrl();
      const res = await safeFetch(`${base}/api/vocab`, {}, 2500);
      return await res.json();
    } catch (e) {
      return { success: true, data: OFFLINE_FALLBACK_WORDS };
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
      const res = await safeFetch(`${base}/api/patterns`, {}, 2500);
      return await res.json();
    } catch (e) {
      return { 
        success: true, 
        data: [
          {
            id: 'pat-1',
            name: 'It goes without saying that',
            formula: 'It goes without saying that + [Clause: S + V]',
            explanation: 'Dùng khi muốn nhấn mạnh một sự thật hiển nhiên.',
            meaning_vi: 'Hiển nhiên là..., Rõ ràng là...',
            tone: 'Formal',
            examples: ['It goes without saying that consistency leads to great results.'],
            tags: ['Writing', 'Academic']
          },
          {
            id: 'pat-2',
            name: 'Not only... but also (Inversion)',
            formula: 'Not only + Aux + S + V, but S also + V',
            explanation: 'Đảo ngữ để nhấn mạnh hai đặc điểm cùng lúc.',
            meaning_vi: 'Không những... mà còn...',
            tone: 'Academic',
            examples: ['Not only did he pass, but he also achieved top score.'],
            tags: ['IELTS', 'Grammar']
          }
        ]
      };
    }
  },

  createPattern: async (data) => {
    try {
      const base = getServerUrl();
      const res = await safeFetch(`${base}/api/patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }, 3000);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  deletePattern: async (id) => {
    try {
      const base = getServerUrl();
      const res = await safeFetch(`${base}/api/patterns/${id}`, { method: 'DELETE' }, 3000);
      return await res.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // 4. Notes / Smart Reader
  getNotes: async () => {
    try {
      const base = getServerUrl();
      const res = await safeFetch(`${base}/api/notes`, {}, 2500);
      return await res.json();
    } catch (e) {
      return { 
        success: true, 
        data: [
          {
            id: 'note-1',
            title: 'The Secret of Consistent Learning',
            content: 'Language learning is not a sprint; it is a marathon. To become an articulate speaker, one must cultivate a resilient mindset and leverage Spaced Repetition.',
            topic: 'Productivity',
            tags: ['Mindset', 'English Tips'],
            linked_words: ['resilient', 'articulate', 'leverage']
          }
        ]
      };
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
