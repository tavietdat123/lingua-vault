import { db } from '../db/database.js';
import crypto from 'node:crypto';

export const noteController = {
  // 1. Get all notes
  getAllNotes: (req, res) => {
    try {
      const { search, topic } = req.query;
      let query = 'SELECT * FROM notes WHERE 1=1';
      const params = [];

      if (search) {
        query += ' AND (title LIKE ? OR content LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term);
      }

      if (topic && topic !== 'all') {
        query += ' AND topic = ?';
        params.push(topic);
      }

      query += ' ORDER BY created_at DESC';

      const stmt = db.prepare(query);
      let notes = stmt.all(...params);

      notes = notes.map(n => ({
        ...n,
        tags: JSON.parse(n.tags || '[]'),
        linked_words: JSON.parse(n.linked_words || '[]')
      }));

      res.json({ success: true, data: notes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get single note
  getNoteById: (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
      const note = stmt.get(id);

      if (!note) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy ghi chú / tài liệu' });
      }

      note.tags = JSON.parse(note.tags || '[]');
      note.linked_words = JSON.parse(note.linked_words || '[]');

      res.json({ success: true, data: note });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Create note
  createNote: (req, res) => {
    try {
      const {
        title,
        content,
        topic = 'General',
        tags = [],
        linked_words = []
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Tiêu đề và nội dung là bắt buộc' });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO notes (
          id, title, content, topic, tags, linked_words, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      stmt.run(
        id,
        title.trim(),
        content,
        topic,
        JSON.stringify(tags),
        JSON.stringify(linked_words),
        now,
        now
      );

      res.status(201).json({ success: true, data: { id, title, topic } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Update note
  updateNote: (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, topic, tags = [], linked_words = [] } = req.body;
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE notes SET
          title = ?, content = ?, topic = ?, tags = ?, linked_words = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        title.trim(),
        content,
        topic || 'General',
        JSON.stringify(tags),
        JSON.stringify(linked_words),
        now,
        id
      );

      res.json({ success: true, message: 'Cập nhật ghi chú thành công' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 5. Delete note
  deleteNote: (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
      stmt.run(id);
      res.json({ success: true, message: 'Đã xóa ghi chú' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
