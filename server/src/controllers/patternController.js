import { db, removeVietnameseTones } from '../db/database.js';
import crypto from 'node:crypto';
import { callGemini, safeParseJson } from '../services/aiService.js';

export const patternController = {
  // 1. Get all sentence patterns with backend search, filtering, and pagination
  getAllPatterns: (req, res) => {
    try {
      const userId = req.user?.id || 'admin_master_user_id';
      const { search, category, tone } = req.query;
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
          name LIKE ? OR formula LIKE ? OR meaning_vi LIKE ? OR explanation LIKE ? OR examples LIKE ?
          OR unaccent(name) LIKE ? OR unaccent(formula) LIKE ? OR unaccent(meaning_vi) LIKE ? 
          OR unaccent(explanation) LIKE ? OR unaccent(examples) LIKE ?
        )`;
        params.push(term, term, term, term, term, termClean, termClean, termClean, termClean, termClean);
      }

      if (category && category !== 'all') {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      if (tone && tone !== 'all') {
        whereClause += ' AND tone = ?';
        params.push(tone);
      }

      // Total count calculation
      const countSql = `SELECT COUNT(*) as count FROM patterns ${whereClause}`;
      const countStmt = db.prepare(countSql);
      const { count: total } = countStmt.get(...params);

      // Data query
      let dataSql = `SELECT * FROM patterns ${whereClause} ORDER BY created_at DESC`;
      const dataParams = [...params];

      if (limit) {
        const currentPage = page || 1;
        const offset = (currentPage - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        dataParams.push(limit, offset);
      }

      const stmt = db.prepare(dataSql);
      let patterns = stmt.all(...dataParams);

      patterns = patterns.map(p => ({
        ...p,
        category: p.category || 'emphasis',
        examples: JSON.parse(p.examples || '[]'),
        tags: JSON.parse(p.tags || '[]')
      }));

      const currentPage = page || 1;
      const currentLimit = limit || total;
      const totalPages = limit ? Math.max(1, Math.ceil(total / limit)) : 1;

      res.json({
        success: true,
        data: patterns,
        total,
        pagination: {
          page: currentPage,
          limit: currentLimit,
          total,
          totalPages
        }
      });
    } catch (err) {
      console.error('[PatternController getAllPatterns Error]:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Get pattern by ID
  getPatternById: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        SELECT * FROM patterns 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      const pattern = stmt.get(id, userId, userId);

      if (!pattern) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mẫu câu' });
      }

      pattern.category = pattern.category || 'emphasis';
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
      const userId = req.user?.id || 'admin_master_user_id';
      const {
        name,
        formula,
        explanation,
        meaning_vi,
        category = 'emphasis',
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
          id, name, formula, explanation, meaning_vi, category, tone,
          examples, tags, repetition, interval, ease_factor,
          due_date, status, created_at, updated_at, user_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, 0, 0, 2.5,
          ?, 'new', ?, ?, ?
        )
      `);

      stmt.run(
        id,
        name.trim(),
        formula.trim(),
        explanation || '',
        meaning_vi.trim(),
        category || 'emphasis',
        tone,
        JSON.stringify(examples),
        JSON.stringify(tags),
        today,
        now,
        now,
        userId
      );

      res.status(201).json({ success: true, data: { id, name, formula, category, status: 'new' } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Update pattern
  updatePattern: (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'admin_master_user_id';
      const existing = db.prepare(`
        SELECT * FROM patterns 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `).get(id, userId, userId);

      if (!existing) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy mẫu câu' });
      }

      const {
        name = existing.name,
        formula = existing.formula,
        explanation = existing.explanation,
        meaning_vi = existing.meaning_vi,
        category = existing.category || 'emphasis',
        tone = existing.tone || 'Neutral',
        examples = (req.body.examples !== undefined ? req.body.examples : JSON.parse(existing.examples || '[]')),
        tags = (req.body.tags !== undefined ? req.body.tags : JSON.parse(existing.tags || '[]'))
      } = req.body;

      const now = new Date().toISOString();

      const stmt = db.prepare(`
        UPDATE patterns SET
          name = ?, formula = ?, explanation = ?, meaning_vi = ?,
          category = ?, tone = ?, examples = ?, tags = ?, updated_at = ?
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);

      stmt.run(
        String(name || '').trim(),
        String(formula || '').trim(),
        explanation || '',
        String(meaning_vi || '').trim(),
        category || 'emphasis',
        tone || 'Neutral',
        typeof examples === 'string' ? examples : JSON.stringify(examples),
        typeof tags === 'string' ? tags : JSON.stringify(tags),
        now,
        id,
        userId,
        userId
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
      const userId = req.user?.id || 'admin_master_user_id';
      const stmt = db.prepare(`
        DELETE FROM patterns 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL OR ? = 'admin_master_user_id')
      `);
      stmt.run(id, userId, userId);
      res.json({ success: true, message: 'Đã xóa mẫu câu' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 6. Analyze sample sentence with AI to extract grammatical pattern
  analyzePattern: async (req, res) => {
    try {
      const { sentence } = req.body || {};
      if (!sentence || typeof sentence !== 'string' || !sentence.trim()) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp câu mẫu tiếng Anh để AI phân tích.' });
      }

      const cleanSentence = sentence.trim();

      const prompt = `
Bạn là chuyên gia ngôn ngữ học và giảng viên tiếng Anh cao cấp.
Nhiệm vụ của bạn: Hãy phân tích kỹ lưỡng câu mẫu tiếng Anh dưới đây và trích xuất cấu trúc ngữ pháp / mẫu câu (sentence pattern) chi tiết, dễ hiểu, chuẩn xác nhất cho người học.

Câu mẫu cần phân tích:
"${cleanSentence}"

Yêu cầu xuất ra JSON hợp lệ (không kèm bất kỳ markdown hay text thừa nào bên ngoài JSON) với cấu trúc sau:
{
  "name": "Tên cấu trúc câu rõ ràng, chuyên nghiệp (ví dụ: Cấu trúc Đảo ngữ với Hardly... when / Cấu trúc It is high time / Cấu trúc Not only... but also)",
  "formula": "Công thức chuẩn hóa, rõ ràng (ví dụ: Hardly + had + S + V3/ed + when + S + V2/ed)",
  "meaning_vi": "Nghĩa tiếng Việt súc tích, tự nhiên (ví dụ: Vừa mới... thì đã... / Đã đến lúc phải làm gì)",
  "explanation": "Giải thích chi tiết và cực kỳ dễ hiểu gồm: 1. Ý nghĩa & Bối cảnh dùng thực tế; 2. Quy tắc chia động từ / vị trí từ; 3. Lưu ý bẫy ngữ pháp hay gặp và mẹo nhớ nhanh.",
  "category": "Chọn đúng 1 mã phân loại phù hợp nhất trong danh sách sau: [cause_effect, purpose, condition, concession, comparison, exception, emphasis, advice, speculation, opinion, addition, example, clarification, transition, sequence, conclusion, request, definition]",
  "tone": "Chọn 1 sắc thái: [Formal, Academic, Informal, Casual, Neutral, Literary]",
  "examples": [
    "Ví dụ 1 (tiếng Anh) - Bản dịch tiếng Việt",
    "Ví dụ 2 (tiếng Anh) - Bản dịch tiếng Việt"
  ]
}
`;

      const raw = await callGemini(prompt);
      const parsed = safeParseJson(raw);

      if (!parsed || !parsed.name || !parsed.formula) {
        throw new Error('AI không trích xuất được cấu trúc phù hợp từ câu mẫu này.');
      }

      const validCategories = [
        'cause_effect', 'purpose', 'condition', 'concession', 'comparison', 
        'exception', 'emphasis', 'advice', 'speculation', 'opinion', 
        'addition', 'example', 'clarification', 'transition', 'sequence', 
        'conclusion', 'request', 'definition'
      ];
      const category = validCategories.includes(parsed.category) ? parsed.category : 'emphasis';

      const validTones = ['Formal', 'Academic', 'Informal', 'Casual', 'Neutral', 'Literary'];
      const tone = validTones.includes(parsed.tone) ? parsed.tone : 'Formal';

      const examples = Array.isArray(parsed.examples) && parsed.examples.length > 0
        ? parsed.examples
        : [cleanSentence];

      return res.json({
        success: true,
        data: {
          name: parsed.name,
          formula: parsed.formula,
          meaning_vi: parsed.meaning_vi || '',
          explanation: parsed.explanation || '',
          category,
          tone,
          examples
        }
      });
    } catch (err) {
      console.error('[PatternController analyzePattern Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Lỗi khi phân tích câu mẫu bằng AI'
      });
    }
  }
};
