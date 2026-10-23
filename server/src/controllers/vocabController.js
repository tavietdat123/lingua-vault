import { db, removeVietnameseTones } from '../db/database.js';
import crypto from 'node:crypto';
import { lookupDictionary } from '../services/dictionaryService.js';
import { gamificationService } from '../services/gamificationService.js';

export const vocabController = {
  // 1. Get all words with backend search, filtering, and pagination
  getAllWords: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { search, tag, status, level, topic_id } = req.query;
      const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : null;
      const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit, 10)) : null;

      let whereClause = `WHERE (user_id = ? OR user_id IS NULL OR user_id = 'admin_master_user_id')`;
      const params = [userId];

      if (search && search.trim()) {
        const q = search.trim();
        const term = `%${q}%`;
        const qClean = removeVietnameseTones(q);
        const termClean = `%${qClean}%`;
        whereClause += ` AND (
          word LIKE ? OR meaning_vi LIKE ? OR meaning_en LIKE ? OR phonetic LIKE ? 
          OR collocations LIKE ? OR examples LIKE ? OR tags LIKE ?
          OR unaccent(word) LIKE ? OR unaccent(meaning_vi) LIKE ? OR unaccent(meaning_en) LIKE ?
          OR unaccent(collocations) LIKE ? OR unaccent(examples) LIKE ? OR unaccent(tags) LIKE ?
        )`;
        params.push(term, term, term, term, term, term, term, termClean, termClean, termClean, termClean, termClean, termClean);
      }

      if (status && status !== 'all') {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (level && level !== 'all') {
        whereClause += ' AND level = ?';
        params.push(level);
      }

      if (topic_id && topic_id !== 'all') {
        whereClause += ' AND topic_id = ?';
        params.push(topic_id);
      }

      if (tag && tag !== 'all') {
        whereClause += ' AND (tags LIKE ? OR topic_id = ?)';
        params.push(`%"${tag}"%`, tag);
      }

      // Total count calculation
      const countSql = `SELECT COUNT(*) as count FROM words ${whereClause}`;
      const countStmt = db.prepare(countSql);
      const { count: total } = countStmt.get(...params);

      // Data fetch query
      let dataSql = `SELECT * FROM words ${whereClause} ORDER BY created_at DESC`;
      const dataParams = [...params];

      if (limit) {
        const currentPage = page || 1;
        const offset = (currentPage - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        dataParams.push(limit, offset);
      }

      const stmt = db.prepare(dataSql);
      let words = stmt.all(...dataParams);

      // Parse JSON fields
      words = words.map(w => ({
        ...w,
        topic_id: w.topic_id || 'daily',
        collocations: JSON.parse(w.collocations || '[]'),
        examples: JSON.parse(w.examples || '[]'),
        tags: JSON.parse(w.tags || '[]')
      }));

      const currentPage = page || 1;
      const currentLimit = limit || total;
      const totalPages = limit ? Math.max(1, Math.ceil(total / limit)) : 1;

      res.json({
        success: true,
        data: words,
        total,
        pagination: {
          page: currentPage,
          limit: currentLimit,
          total,
          totalPages
        }
      });
    } catch (err) {
      console.error('[VocabController getAllWords Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get single word by ID
  getWordById: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        SELECT * FROM words 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      const word = stmt.get(id, userId, userId);

      if (!word) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy từ vựng' });
      }

      word.topic_id = word.topic_id || 'daily';
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
      const userId = req.user?.id || 'admin_master_user_id';
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
        level = 'B1',
        topic_id = 'daily'
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
          due_date, status, created_at, updated_at, topic_id, user_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 0, 0, 2.5,
          ?, 'new', ?, ?, ?, ?
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
        now,
        topic_id || 'daily',
        userId
      );

      // Gamification: Reward +10 XP for adding new word
      let xpResult = null;
      try {
        xpResult = gamificationService.addXp(userId, 10, `Thêm từ mới: ${word.trim()}`);
      } catch (e) {}

      res.status(201).json({ success: true, data: { id, word, meaning_vi, topic_id: topic_id || 'daily', status: 'new' }, gamification: xpResult });
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
        level,
        topic_id
      } = req.body;

      const now = new Date().toISOString();

      const userId = req.user?.id || 'admin_master_user_id';
      const existingWord = db.prepare(`
        SELECT * FROM words 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `).get(id, userId, userId);

      if (!existingWord) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy từ vựng' });
      }

      const finalTopicId = topic_id !== undefined ? topic_id : (existingWord.topic_id || 'daily');

      const stmt = db.prepare(`
        UPDATE words SET
          word = ?, phonetic = ?, audio_url = ?, part_of_speech = ?,
          meaning_vi = ?, meaning_en = ?, collocations = ?, examples = ?,
          tags = ?, level = ?, updated_at = ?, topic_id = ?
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);

      stmt.run(
        word ? word.trim() : existingWord.word,
        phonetic !== undefined ? phonetic : existingWord.phonetic,
        audio_url !== undefined ? audio_url : existingWord.audio_url,
        part_of_speech || existingWord.part_of_speech || 'noun',
        meaning_vi ? meaning_vi.trim() : existingWord.meaning_vi,
        meaning_en !== undefined ? meaning_en : existingWord.meaning_en,
        JSON.stringify(collocations !== undefined ? collocations : JSON.parse(existingWord.collocations || '[]')),
        JSON.stringify(examples !== undefined ? examples : JSON.parse(existingWord.examples || '[]')),
        JSON.stringify(tags !== undefined ? tags : JSON.parse(existingWord.tags || '[]')),
        level || existingWord.level || 'B1',
        now,
        finalTopicId,
        id,
        userId,
        userId
      );

      res.json({ 
        success: true, 
        message: 'Cập nhật từ vựng thành công',
        data: { id, word: word?.trim() || existingWord.word, meaning_vi: meaning_vi?.trim() || existingWord.meaning_vi, level: level || existingWord.level, topic_id: finalTopicId }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Delete word
  deleteWord: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        DELETE FROM words 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      stmt.run(id, userId, userId);
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
