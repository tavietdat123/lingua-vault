import { db } from "../db/database.js";
import crypto from "node:crypto";

export const patternCategoryController = {
  // 1. Get all pattern categories with dynamic patterns count
  getAllCategories: (req, res) => {
    try {
      const categories = db.prepare("SELECT * FROM pattern_categories ORDER BY created_at ASC").all();
      
      const countStmt = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM patterns 
        GROUP BY category
      `);
      const counts = countStmt.all();
      const countMap = {};
      counts.forEach(c => {
        if (c.category) countMap[c.category] = c.count;
      });

      const enriched = categories.map(c => ({
        ...c,
        patterns_count: countMap[c.id] || 0
      }));

      res.json({ success: true, data: enriched });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 2. Create new category
  createCategory: (req, res) => {
    try {
      const { name, emoji = "🧩", color = "#8b5cf6", description = "" } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: "Tên chức năng là bắt buộc" });
      }

      const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) || crypto.randomUUID().slice(0, 8);

      const existing = db.prepare("SELECT id FROM pattern_categories WHERE id = ? OR name = ?").get(id, name.trim());
      if (existing) {
        return res.status(400).json({ success: false, error: "Chức năng này đã tồn tại" });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO pattern_categories (id, name, emoji, color, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, name.trim(), emoji || "🧩", color || "#8b5cf6", description.trim(), now, now);

      res.status(201).json({
        success: true,
        message: "Tạo chức năng diễn đạt thành công",
        data: { id, name: name.trim(), emoji: emoji || "🧩", color: color || "#8b5cf6", description: description.trim(), patterns_count: 0 }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 3. Update category
  updateCategory: (req, res) => {
    try {
      const { id } = req.params;
      const { name, emoji, color, description } = req.body;

      const category = db.prepare("SELECT * FROM pattern_categories WHERE id = ?").get(id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Không tìm thấy chức năng" });
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE pattern_categories SET
          name = ?,
          emoji = ?,
          color = ?,
          description = ?,
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        name ? name.trim() : category.name,
        emoji || category.emoji,
        color || category.color,
        description !== undefined ? description.trim() : category.description,
        now,
        id
      );

      res.json({
        success: true,
        message: "Cập nhật chức năng thành công",
        data: { ...category, name: name || category.name, emoji: emoji || category.emoji, color: color || category.color, description: description !== undefined ? description : category.description }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // 4. Delete category
  deleteCategory: (req, res) => {
    try {
      const { id } = req.params;

      const category = db.prepare("SELECT * FROM pattern_categories WHERE id = ?").get(id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Không tìm thấy chức năng" });
      }

      // Reassign patterns to fallback "emphasis" category
      db.prepare('UPDATE patterns SET category = "emphasis" WHERE category = ?').run(id);

      db.prepare("DELETE FROM pattern_categories WHERE id = ?").run(id);

      res.json({ success: true, message: "Đã xóa chức năng diễn đạt và cập nhật mẫu câu liên quan" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
