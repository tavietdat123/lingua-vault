import { db } from '../db/database.js';
import crypto from 'node:crypto';
import { lookupDictionary } from '../services/dictionaryService.js';

export const vocabController = {
  // 1. Get all words with search & filtering
  getAllWords: (req, res) => {
    try {
      const { search, tag, status, level } = req.query;
      let query = 'SELECT * FROM words WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (word LIKE ? OR meaning_vi LIKE ? OR meaning_en LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term);
      }

      if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
      }

      if (level && level !== 'all') {
        query += ' AND level = ?';
        params.push(level);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = db.prepare(query);
      let words = stmt.all(...params);

      // Parse JSON fields
      words = words.map(w => ({
        ...w,
        collocations: JSON.parse(w.collocations || '[]'),
        examples: JSON.parse(w.examples || '[]'),
        tags: JSON.parse(w.tags || '[]')
      }));

      // Filter by tag if provided
      if (tag && tag !== 'all') {
        words = words.filter(w => w.tags.includes(tag));
      }

      res.json({ success: true, data: words });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get single word by ID
  getWordById: (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('SELECT * FROM words WHERE id = ?');
      const word = stmt.get(id);

      if (!word) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy từ vựng' });
      }

      word.collocations = JSON.parse(word.collocations || '[]');
      word.examples = JSON.parse(word.examples || '[]');
      word.tags = JSON.parse(word.tags || '[]');

      res.json({ success: true, data: word });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Create new word
  createWord: (req, res) => {
    try {
      const {
        word,
        phonetic,
        audio_url,
        part_of_speech,
        meaning_vi,
        meaning_en,
        collocations = [],
        examples = [],
        tags = [],
        level = 'B1'
      } = req.body;

      if (!word || !meaning_vi) {
        return res.status(400).json({ success: false, error: 'Từ tiếng Anh và Nghĩa tiếng Việt là bắt buộc' });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const stmt = db.prepare(`
        INSERT INTO words (
          id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
          collocations, examples, tags, level, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 0, 0, 2.5,
          ?, 'new', ?, ?
        )
      `);

      stmt.run(
        id,
        word.trim(),
        phonetic || '',
        audio_url || '',
        part_of_speech || 'noun',
        meaning_vi.trim(),
        meaning_en || '',
        JSON.stringify(collocations),
        JSON.stringify(examples),
        JSON.stringify(tags),
        level,
        today,
        now,
        now
      );

      res.status(201).json({ success: true, data: { id, word, meaning_vi, status: 'new' } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Update word
  updateWord: (req, res) => {
    try {
      const { id } = req.params;
      const {
        word,
        phonetic,
        audio_url,
        part_of_speech,
        meaning_vi,
        meaning_en,
        collocations = [],
        examples = [],
        tags = [],
        level
      } = req.body;

      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE words SET
          word = ?, phonetic = ?, audio_url = ?, part_of_speech = ?,
          meaning_vi = ?, meaning_en = ?, collocations = ?, examples = ?,
          tags = ?, level = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        word.trim(),
        phonetic || '',
        audio_url || '',
        part_of_speech || 'noun',
        meaning_vi.trim(),
        meaning_en || '',
        JSON.stringify(collocations),
        JSON.stringify(examples),
        JSON.stringify(tags),
        level || 'B1',
        now,
        id
      );

      res.json({ 
        success: true, 
        message: 'Cập nhật từ vựng thành công',
        data: { id, word: word.trim(), meaning_vi: meaning_vi.trim(), level: level || 'B1' }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Delete word
  deleteWord: (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM words WHERE id = ?');
      stmt.run(id);
      res.json({ success: true, message: 'Đã xóa từ vựng' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. Fast Auto-lookup Dictionary API
  autoLookup: async (req, res) => {
    try {
      const { word } = req.query;
      if (!word) {
        return res.status(400).json({ success: false, error: 'Thiếu từ cần tra cứu' });
      }

      const result = await lookupDictionary(word);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
