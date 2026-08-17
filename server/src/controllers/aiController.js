import { parseSentenceAI, checkSentenceAI, generateStoryAI } from '../services/aiService.js';
import { db } from '../db/database.js';

export const aiController = {
  // 1. Smart Sentence Parser & Vocab Extractor
  parseSentence: async (req, res) => {
    try {
      const { sentence, apiKey } = req.body;
      if (!sentence) {
        return res.status(400).json({ success: false, error: 'Thiếu câu tiếng Anh cần phân tích' });
      }

      // Check key in settings if not in body
      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const result = await parseSentenceAI(sentence, key);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Check and Correct User's Custom Sentence
  checkSentence: async (req, res) => {
    try {
      const { targetItem, userSentence, apiKey } = req.body;
      if (!targetItem || !userSentence) {
        return res.status(400).json({ success: false, error: 'Thiếu từ vựng hoặc câu bạn tự viết' });
      }

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      const result = await checkSentenceAI({ targetItem, userSentence }, key);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Generate Daily Review Story from Due Words
  generateStory: async (req, res) => {
    try {
      const { words, apiKey } = req.body;

      let key = apiKey;
      if (!key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('gemini_api_key');
        if (row) key = row.value;
      }

      let wordsList = words;
      if (!wordsList || wordsList.length === 0) {
        // Fetch up to 6 words due today
        const today = new Date().toISOString().split('T')[0];
        const stmt = db.prepare('SELECT word FROM words WHERE due_date <= ? LIMIT 6');
        wordsList = stmt.all(today).map(w => w.word);
      }

      const result = await generateStoryAI(wordsList, key);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Save/Get Settings (Gemini API Key)
  getSettings: (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM settings');
      const rows = stmt.all();
      const settings = {};
      rows.forEach(r => settings[r.key] = r.value);
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  saveSettings: (req, res) => {
    try {
      const { gemini_api_key, gemini_model, speech_voice, review_daily_goal } = req.body;
      const stmt = db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      if (gemini_api_key !== undefined) stmt.run('gemini_api_key', gemini_api_key.trim());
      if (gemini_model !== undefined) stmt.run('gemini_model', gemini_model.trim());
      if (speech_voice !== undefined) stmt.run('speech_voice', speech_voice);
      if (review_daily_goal !== undefined) stmt.run('review_daily_goal', String(review_daily_goal));

      res.json({ success: true, message: 'Đã lưu cài đặt' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
