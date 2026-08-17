import { db } from '../db/database.js';
import { calculateNextSRS } from '../services/srsAlgorithm.js';
import crypto from 'node:crypto';

export const srsController = {
  // 1. Get all items due for review today
  getDueItems: (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Due words
      const wordsStmt = db.prepare(`
        SELECT * FROM words
        WHERE due_date <= ? OR due_date IS NULL
        ORDER BY status ASC, repetition ASC
      `);
      let words = wordsStmt.all(today);
      words = words.map(w => ({
        ...w,
        type: 'word',
        collocations: JSON.parse(w.collocations || '[]'),
        examples: JSON.parse(w.examples || '[]'),
        tags: JSON.parse(w.tags || '[]')
      }));

      // Due patterns
      const patternsStmt = db.prepare(`
        SELECT * FROM patterns
        WHERE due_date <= ? OR due_date IS NULL
        ORDER BY status ASC, repetition ASC
      `);
      let patterns = patternsStmt.all(today);
      patterns = patterns.map(p => ({
        ...p,
        type: 'pattern',
        examples: JSON.parse(p.examples || '[]'),
        tags: JSON.parse(p.tags || '[]')
      }));

      res.json({
        success: true,
        data: {
          today,
          due_words_count: words.length,
          due_patterns_count: patterns.length,
          total_due: words.length + patterns.length,
          words,
          patterns
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Submit SRS Review for a Word or Pattern
  submitReview: (req, res) => {
    try {
      const { id, type = 'word', rating = 'good' } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, error: 'Thiếu ID của thẻ ôn tập' });
      }

      const table = type === 'pattern' ? 'patterns' : 'words';
      const getStmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
      const item = getStmt.get(id);

      if (!item) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy thẻ để ôn tập' });
      }

      // Calculate next SRS interval
      const nextSRS = calculateNextSRS({
        repetition: item.repetition,
        interval: item.interval,
        easeFactor: item.ease_factor
      }, rating);

      // Update in DB
      const updateStmt = db.prepare(`
        UPDATE ${table} SET
          repetition = ?,
          interval = ?,
          ease_factor = ?,
          due_date = ?,
          status = ?,
          last_reviewed_at = ?,
          updated_at = ?
        WHERE id = ?
      `);

      const now = new Date().toISOString();
      updateStmt.run(
        nextSRS.repetition,
        nextSRS.interval,
        nextSRS.easeFactor,
        nextSRS.dueDate,
        nextSRS.status,
        now,
        now,
        id
      );

      // Update today's study log (for daily streak tracking)
      const today = now.split('T')[0];
      const logStmt = db.prepare('SELECT * FROM study_logs WHERE date = ?');
      const log = logStmt.get(today);

      if (log) {
        const updateLog = db.prepare(`
          UPDATE study_logs SET
            reviews_count = reviews_count + 1
          WHERE date = ?
        `);
        updateLog.run(today);
      } else {
        const logId = crypto.randomUUID();
        const insertLog = db.prepare(`
          INSERT INTO study_logs (id, date, reviews_count, new_words_count, duration_seconds, created_at)
          VALUES (?, ?, 1, 0, 0, ?)
        `);
        insertLog.run(logId, today, now);
      }

      res.json({
        success: true,
        message: 'Đã ghi nhận kết quả ôn tập',
        data: nextSRS
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Get Overview Stats & Daily Streak
  getStats: (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Total words & status count
      const wordsCountStmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered,
          SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing,
          SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as learning,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
          SUM(CASE WHEN due_date <= ? THEN 1 ELSE 0 END) as due_today
        FROM words
      `);
      const wordStats = wordsCountStmt.get(today);

      // Patterns stats
      const patternsCountStmt = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered,
          SUM(CASE WHEN due_date <= ? THEN 1 ELSE 0 END) as due_today
        FROM patterns
      `);
      const patternStats = patternsCountStmt.get(today);

      // Notes count
      const notesCountStmt = db.prepare('SELECT COUNT(*) as total FROM notes');
      const noteStats = notesCountStmt.get();

      // Calculate Daily Streak from study_logs
      const logsStmt = db.prepare('SELECT date, reviews_count FROM study_logs ORDER BY date DESC LIMIT 30');
      const logs = logsStmt.all();

      let streak = 0;
      let checkDate = new Date();

      for (let i = 0; i < 30; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const logForDay = logs.find(l => l.date === dateStr);

        if (logForDay && logForDay.reviews_count > 0) {
          streak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // If haven't reviewed today yet, check yesterday to keep streak alive
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      res.json({
        success: true,
        data: {
          words: {
            total: wordStats.total || 0,
            mastered: wordStats.mastered || 0,
            reviewing: wordStats.reviewing || 0,
            learning: wordStats.learning || 0,
            new: wordStats.new_count || 0,
            due_today: wordStats.due_today || 0
          },
          patterns: {
            total: patternStats.total || 0,
            mastered: patternStats.mastered || 0,
            due_today: patternStats.due_today || 0
          },
          notes: {
            total: noteStats.total || 0
          },
          total_due_today: (wordStats.due_today || 0) + (patternStats.due_today || 0),
          streak,
          recent_logs: logs
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
