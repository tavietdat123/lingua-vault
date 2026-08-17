import { db } from '../db/database.js';

export const backupController = {
  // 1. Export entire Vault to JSON
  exportData: (req, res) => {
    try {
      const words = db.prepare('SELECT * FROM words').all().map(w => ({
        ...w,
        collocations: JSON.parse(w.collocations || '[]'),
        examples: JSON.parse(w.examples || '[]'),
        tags: JSON.parse(w.tags || '[]')
      }));

      const patterns = db.prepare('SELECT * FROM patterns').all().map(p => ({
        ...p,
        examples: JSON.parse(p.examples || '[]'),
        tags: JSON.parse(p.tags || '[]')
      }));

      const notes = db.prepare('SELECT * FROM notes').all().map(n => ({
        ...n,
        tags: JSON.parse(n.tags || '[]'),
        linked_words: JSON.parse(n.linked_words || '[]')
      }));

      const study_logs = db.prepare('SELECT * FROM study_logs').all();

      const backup = {
        app: 'LinguaVault',
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        data: {
          words,
          patterns,
          notes,
          study_logs
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=lingua_vault_backup_${new Date().toISOString().split('T')[0]}.json`);
      res.json(backup);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Import and restore data from JSON
  importData: (req, res) => {
    try {
      const { data } = req.body;
      if (!data) {
        return res.status(400).json({ success: false, error: 'Dữ liệu sao lưu không hợp lệ' });
      }

      const { words = [], patterns = [], notes = [], study_logs = [] } = data;

      // Import words
      const insertWord = db.prepare(`
        INSERT INTO words (
          id, word, phonetic, audio_url, part_of_speech, meaning_vi, meaning_en,
          collocations, examples, tags, level, repetition, interval, ease_factor,
          due_date, status, last_reviewed_at, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          word = excluded.word,
          phonetic = excluded.phonetic,
          audio_url = excluded.audio_url,
          meaning_vi = excluded.meaning_vi,
          meaning_en = excluded.meaning_en,
          collocations = excluded.collocations,
          examples = excluded.examples,
          tags = excluded.tags,
          updated_at = excluded.updated_at
      `);

      for (const w of words) {
        insertWord.run(
          w.id,
          w.word,
          w.phonetic || '',
          w.audio_url || '',
          w.part_of_speech || 'noun',
          w.meaning_vi || '',
          w.meaning_en || '',
          JSON.stringify(w.collocations || []),
          JSON.stringify(w.examples || []),
          JSON.stringify(w.tags || []),
          w.level || 'B1',
          w.repetition || 0,
          w.interval || 0,
          w.ease_factor || 2.5,
          w.due_date || new Date().toISOString().split('T')[0],
          w.status || 'new',
          w.last_reviewed_at || null,
          w.created_at || new Date().toISOString(),
          w.updated_at || new Date().toISOString()
        );
      }

      // Import patterns
      const insertPattern = db.prepare(`
        INSERT INTO patterns (
          id, name, formula, explanation, meaning_vi, tone,
          examples, tags, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          formula = excluded.formula,
          explanation = excluded.explanation,
          meaning_vi = excluded.meaning_vi,
          tone = excluded.tone,
          examples = excluded.examples,
          tags = excluded.tags,
          updated_at = excluded.updated_at
      `);

      for (const p of patterns) {
        insertPattern.run(
          p.id,
          p.name,
          p.formula,
          p.explanation || '',
          p.meaning_vi || '',
          p.tone || 'Neutral',
          JSON.stringify(p.examples || []),
          JSON.stringify(p.tags || []),
          p.repetition || 0,
          p.interval || 0,
          p.ease_factor || 2.5,
          p.due_date || new Date().toISOString().split('T')[0],
          p.status || 'new',
          p.created_at || new Date().toISOString(),
          p.updated_at || new Date().toISOString()
        );
      }

      // Import notes
      const insertNote = db.prepare(`
        INSERT INTO notes (id, title, content, topic, tags, linked_words, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          topic = excluded.topic,
          tags = excluded.tags,
          linked_words = excluded.linked_words,
          updated_at = excluded.updated_at
      `);

      for (const n of notes) {
        insertNote.run(
          n.id,
          n.title,
          n.content,
          n.topic || 'General',
          JSON.stringify(n.tags || []),
          JSON.stringify(n.linked_words || []),
          n.created_at || new Date().toISOString(),
          n.updated_at || new Date().toISOString()
        );
      }

      res.json({
        success: true,
        message: `Đã khôi phục thành công: ${words.length} từ vựng, ${patterns.length} cấu trúc, ${notes.length} ghi chú`
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
