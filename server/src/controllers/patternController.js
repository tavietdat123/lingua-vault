import { db } from '../db/database.js';
import crypto from 'node:crypto';

export const patternController = {
  // 1. Get all sentence patterns
  getAllPatterns: (req, res) => {
    try {
      const { search, tone, tag } = req.query;
      let query = 'SELECT * FROM patterns WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (name LIKE ? OR formula LIKE ? OR meaning_vi LIKE ? OR explanation LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      if (tone && tone !== 'all') {
        query += ' AND tone = ?';
        params.push(tone);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = db.prepare(query);
      let patterns = stmt.all(...params);

      patterns = patterns.map(p => ({
        ...p,
        examples: JSON.parse(p.examples || '[]'),
        tags: JSON.parse(p.tags || '[]')
      }));

      if (tag && tag !== 'all') {
        patterns = patterns.filter(p => p.tags.includes(tag));
      }

      res.json({ success: true, data: patterns });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get pattern by ID
  getPatternById: (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('SELECT * FROM patterns WHERE id = ?');
      const pattern = stmt.get(id);

      if (!pattern) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mẫu câu' });
      }

      pattern.examples = JSON.parse(pattern.examples || '[]');
      pattern.tags = JSON.parse(pattern.tags || '[]');

      res.json({ success: true, data: pattern });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Create pattern
  createPattern: (req, res) => {
    try {
      const {
        name,
        formula,
        explanation,
        meaning_vi,
        tone = 'Neutral',
        examples = [],
        tags = []
      } = req.body;

      if (!name || !formula || !meaning_vi) {
        return res.status(400).json({ success: false, error: 'Tên, công thức và nghĩa tiếng Việt là bắt buộc' });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const stmt = db.prepare(`
        INSERT INTO patterns (
          id, name, formula, explanation, meaning_vi, tone,
          examples, tags, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 0, 0, 2.5,
          ?, 'new', ?, ?
        )
      `);

      stmt.run(
        id,
        name.trim(),
        formula.trim(),
        explanation || '',
        meaning_vi.trim(),
        tone,
        JSON.stringify(examples),
        JSON.stringify(tags),
        today,
        now,
        now
      );

      res.status(201).json({ success: true, data: { id, name, formula, status: 'new' } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Update pattern
  updatePattern: (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        formula,
        explanation,
        meaning_vi,
        tone,
        examples = [],
        tags = []
      } = req.body;

      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE patterns SET
          name = ?, formula = ?, explanation = ?, meaning_vi = ?,
          tone = ?, examples = ?, tags = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        name.trim(),
        formula.trim(),
        explanation || '',
        meaning_vi.trim(),
        tone || 'Neutral',
        JSON.stringify(examples),
        JSON.stringify(tags),
        now,
        id
      );

      res.json({ success: true, message: 'Cập nhật mẫu câu thành công' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Delete pattern
  deletePattern: (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM patterns WHERE id = ?');
      stmt.run(id);
      res.json({ success: true, message: 'Đã xóa mẫu câu' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
