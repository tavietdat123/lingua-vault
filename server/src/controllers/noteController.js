import { db, removeVietnameseTones } from '../db/database.js';
import crypto from 'node:crypto';

export const noteController = {
  // 1. Get all notes with backend search, filtering, and pagination
  getAllNotes: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { search, topic } = req.query;
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
          title LIKE ? OR content LIKE ?
          OR unaccent(title) LIKE ? OR unaccent(content) LIKE ?
        )`;
        params.push(term, term, termClean, termClean);
      }

      if (topic && topic !== 'all') {
        whereClause += ' AND topic = ?';
        params.push(topic);
      }

      // Total count calculation
      const countSql = `SELECT COUNT(*) as count FROM notes ${whereClause}`;
      const countStmt = db.prepare(countSql);
      const { count: total } = countStmt.get(...params);

      // Data query
      let dataSql = `SELECT * FROM notes ${whereClause} ORDER BY created_at DESC`;
      const dataParams = [...params];

      if (limit) {
        const currentPage = page || 1;
        const offset = (currentPage - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        dataParams.push(limit, offset);
      }

      const stmt = db.prepare(dataSql);
      let notes = stmt.all(...dataParams);

      notes = notes.map(n => ({
        ...n,
        tags: JSON.parse(n.tags || '[]'),
        linked_words: JSON.parse(n.linked_words || '[]')
      }));

      const currentPage = page || 1;
      const currentLimit = limit || total;
      const totalPages = limit ? Math.max(1, Math.ceil(total / limit)) : 1;

      res.json({
        success: true,
        data: notes,
        total,
        pagination: {
          page: currentPage,
          limit: currentLimit,
          total,
          totalPages
        }
      });
    } catch (err) {
      console.error('[NoteController getAllNotes Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get single note
  getNoteById: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        SELECT * FROM notes 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      const note = stmt.get(id, userId, userId);

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
      const userId = req.user?.id || 'admin_master_user_id';
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
          id, title, content, topic, tags, linked_words, created_at, updated_at, user_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
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
        now,
        userId
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
      const userId = req.user?.id || 'admin_master_user_id';
      const { title, content, topic, tags = [], linked_words = [] } = req.body;
      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE notes SET
          title = ?, content = ?, topic = ?, tags = ?, linked_words = ?, updated_at = ?
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);

      stmt.run(
        title.trim(),
        content,
        topic || 'General',
        JSON.stringify(tags),
        JSON.stringify(linked_words),
        now,
        id,
        userId,
        userId
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
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        DELETE FROM notes 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      stmt.run(id, userId, userId);
      res.json({ success: true, message: 'Đã xóa ghi chú' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
