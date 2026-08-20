import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'lingua_vault.db');
export const db = new DatabaseSync(DB_PATH);
export const getDb = () => db;

export function initializeDatabase() {
  // 1. Words Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      phonetic TEXT,
      audio_url TEXT,
      part_of_speech TEXT,
      meaning_vi TEXT NOT NULL,
      meaning_en TEXT,
      collocations TEXT DEFAULT '[]',
      examples TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      level TEXT DEFAULT 'B1',
      repetition INTEGER DEFAULT 0,
      interval INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT,
      status TEXT DEFAULT 'new',
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Sentence Patterns Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      formula TEXT NOT NULL,
      explanation TEXT,
      meaning_vi TEXT NOT NULL,
      category TEXT DEFAULT 'emphasis',
      tone TEXT DEFAULT 'Neutral',
      examples TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      repetition INTEGER DEFAULT 0,
      interval INTEGER DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      due_date TEXT,
      status TEXT DEFAULT 'new',
      last_reviewed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2b. Sentence Pattern Communicative Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pattern_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '🧩',
      color TEXT DEFAULT '#8b5cf6',
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 3. Notes & Reading Materials Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      topic TEXT DEFAULT 'General',
      tags TEXT DEFAULT '[]',
      linked_words TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 4. Study Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_logs (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      reviews_count INTEGER DEFAULT 0,
      new_words_count INTEGER DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 5. Settings Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 6. User Gamification Profile Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      total_xp INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      title TEXT DEFAULT 'Novice Scholar 🌱',
      streak_record INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // 7. Topics / Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT DEFAULT '📁',
      color TEXT DEFAULT '#0284c7',
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 8. Quiz History & Saved AI Quizzes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_history (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT DEFAULT 'vocab',
      is_ai INTEGER DEFAULT 1,
      topic TEXT DEFAULT 'All',
      category TEXT DEFAULT 'all',
      level TEXT DEFAULT 'all',
      mode TEXT DEFAULT 'mixed',
      questions TEXT NOT NULL,
      total_questions INTEGER DEFAULT 5,
      best_score INTEGER,
      attempts_count INTEGER DEFAULT 0,
      last_attempt_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 9. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT DEFAULT '🧑‍🎓',
      role TEXT DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 10. AI Speaking History & Submissions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS speaking_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'admin_master_user_id',
      type TEXT DEFAULT 'read_aloud',
      prompt_title TEXT,
      target_text TEXT,
      spoken_text TEXT,
      score INTEGER,
      feedback_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);

  // 11. Per-User Settings Table (API Keys, Telegram, Daily Goals)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      gemini_model TEXT DEFAULT 'gemini-3.6-flash',
      gemini_api_key TEXT DEFAULT '',
      daily_goal INTEGER DEFAULT 10,
      alarm_time TEXT DEFAULT '08:00',
      telegram_bot_token TEXT DEFAULT '',
      telegram_chat_id TEXT DEFAULT '',
      telegram_enabled INTEGER DEFAULT 0,
      telegram_due_reminder INTEGER DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);

  // Migration: Ensure words table has topic_id & user_id column
  try {
    db.exec(`ALTER TABLE words ADD COLUMN topic_id TEXT DEFAULT 'daily';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE words ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE patterns ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE notes ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE study_logs ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  try {
    db.exec(`ALTER TABLE quiz_history ADD COLUMN user_id TEXT DEFAULT 'admin_master_user_id';`);
  } catch (e) {}

  // Migration: Ensure user_profile table has user_id column
  try {
    db.exec(`ALTER TABLE user_profile ADD COLUMN user_id TEXT;`);
  } catch (e) {}

  // Performance Indexes for Multi-Tenant Querying
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
      CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_quiz_history_user ON quiz_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_speaking_history_user ON speaking_history(user_id);
    `);
  } catch (e) {}

  // Pre-populate Default Curated Topics if table is empty
  const topicsCount = db.prepare('SELECT COUNT(*) as count FROM topics').get();
  if (!topicsCount || topicsCount.count === 0) {
    const defaultTopics = [
      { id: 'work', name: 'Công việc & Sự nghiệp', emoji: '💼', color: '#0284c7', description: 'Từ vựng đàm phán, phỏng vấn, email công việc và quản lý dự án' },
      { id: 'tech', name: 'Công nghệ & Kỹ thuật', emoji: '💻', color: '#8b5cf6', description: 'Thuật ngữ IT, lập trình, trí tuệ nhân tạo và chuyển đổi số' },
      { id: 'ielts', name: 'Học thuật & IELTS', emoji: '🎓', color: '#ec4899', description: 'Từ vựng Band 7.0-8.5+, bài luận học thuật và viết thư' },
      { id: 'daily', name: 'Giao tiếp Hàng ngày', emoji: '☕', color: '#10b981', description: 'Từ ngữ đời sống, giao tiếp tự nhiên, quán xá và sinh hoạt' },
      { id: 'travel', name: 'Du lịch & Văn hóa', emoji: '✈️', color: '#f59e0b', description: 'Hàng không, khách sạn, ẩm thực và khám phá thế giới' },
      { id: 'mindset', name: 'Tâm lý & Tư duy', emoji: '🧠', color: '#06b6d4', description: 'Phát triển bản thân, triết học, tư duy phản biện và cảm xúc' }
    ];

    const now = new Date().toISOString();
    const insertTopic = db.prepare(`
      INSERT INTO topics (id, name, emoji, color, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of defaultTopics) {
      insertTopic.run(t.id, t.name, t.emoji, t.color, t.description, now, now);
    }
  }

  // Pre-populate Default Master Admin User if users table is empty
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!usersCount || usersCount.count === 0) {
    const now = new Date().toISOString();
    
    // Default Master Admin User (admin / 123456)
    const { hash, salt } = hashPassword('123456');
    const adminId = 'admin_master_user_id';
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, salt, full_name, avatar_url, role, created_at, updated_at)
      VALUES (?, 'admin', 'admin@linguavault.local', ?, ?, 'Lingua Master', '👑', 'admin', ?, ?)
    `).run(adminId, hash, salt, now, now);
  }

  // Initialize default user profile if empty
  const profileExists = db.prepare("SELECT id FROM user_profile WHERE id = 'default_user' OR user_id = 'admin_master_user_id'").get();
  if (!profileExists) {
    db.prepare(`
      INSERT INTO user_profile (id, user_id, total_xp, current_level, title, streak_record, updated_at)
      VALUES ('default_user', 'admin_master_user_id', 2150, 5, 'Vault Master 💎', 1, ?)
    `).run(new Date().toISOString());
  }

  // Initialize default user settings for admin if empty
  const settingsExists = db.prepare("SELECT user_id FROM user_settings WHERE user_id = 'admin_master_user_id'").get();
  if (!settingsExists) {
    db.prepare(`
      INSERT INTO user_settings (user_id, gemini_model, daily_goal, alarm_time, telegram_enabled, telegram_due_reminder, updated_at)
      VALUES ('admin_master_user_id', 'gemini-3.6-flash', 10, '08:00', 0, 1, ?)
    `).run(new Date().toISOString());
  }

  console.log('✅ Native SQLite Database initialized at:', DB_PATH);
}
