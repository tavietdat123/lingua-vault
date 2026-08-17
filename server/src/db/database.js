import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'lingua_vault.db');
export const db = new DatabaseSync(DB_PATH);

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

  console.log('✅ Native SQLite Database initialized at:', DB_PATH);
}
