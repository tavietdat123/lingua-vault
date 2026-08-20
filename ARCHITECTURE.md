# 🏛️ LinguaVault - Technical Architecture & API Specification

Tài liệu thiết kế kiến trúc kỹ thuật chi tiết, lược đồ cơ sở dữ liệu SQLite, đặc tả API RESTful và thuật toán lõi của hệ sinh thái LinguaVault.

---

## 📑 Mục Lục
1. [Kiến Trúc Tổng Thể & Tech Stack](#1-kiến-trúc-tổng-thể--tech-stack)
2. [Lược Đồ Cơ Sở Dữ Liệu SQLite (Database Schema)](#2-lược-đồ-cơ-sở-dữ-liệu-sqlite-database-schema)
3. [Thuật Toán Lõi & Động Cơ Nghiệp Vụ](#3-thuật-toán-lõi--động-cơ-nghiệp-vụ)
   - [3.1 Thuật toán Spaced Repetition (SuperMemo SM-2)](#31-thuật-toán-spaced-repetition-supermemo-sm-2)
   - [3.2 Động cơ Sinh Đề AI & Xáo Trộn Ngẫu Nhiên (Fisher-Yates)](#32-động-cơ-sinh-đề-ai--xáo-trộn-ngẫu-nhiên-fisher-yates)
   - [3.3 Hệ thống Đánh Giá Phát Âm AI & IELTS Speaking Band Score](#33-hệ-thống-đánh-giá-phát-âm-ai--ielts-speaking-band-score)
   - [3.4 Động cơ Telegram AI Copilot & Two-Way Alarm Poller](#34-động-cơ-telegram-ai-copilot--two-way-alarm-poller)
4. [Đặc Tả REST API Endpoints Reference](#4-đặc-tả-rest-api-endpoints-reference)
5. [Quy Chuẩn Bảo Mật & Local-First Privacy](#5-quy-chuẩn-bảo-mật--local-first-privacy)

---

## 1. Kiến Trúc Tổng Thể & Tech Stack

### 1.1 Multi-Tier Monorepo
- **Backend**: Node.js v18+ / Express.js / `better-sqlite3` (Native C++ SQLite bindings, synchronous zero-overhead queries).
- **Web Frontend**: React 19 / Vite / Lucide Icons / Canvas Confetti / CSS Variables Design System.
- **Mobile Client**: React Native / Expo SDK 52 / Expo Speech / AsyncStorage / Vector Icons.
- **Desktop Client**: Electron 34+ / Multi-Window & Mobile Simulator Support.
- **AI Acceleration**: Google Gemini Flash-Lite (`gemini-flash-lite-latest`, `gemini-3.5-flash-lite`) with response latency < 3.5s.

---

## 2. Lược Đồ Cơ Sở Dữ Liệu SQLite (Database Schema)

Cơ sở dữ liệu được lưu trữ nguyên bản tại `server/data/lingua_vault.db`.

```sql
-- 1. Bảng Kho Từ Vựng (words)
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  phonetic TEXT,
  audio_url TEXT,
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  part_of_speech TEXT,
  level TEXT DEFAULT 'B2',           -- A1, A2, B1, B2, C1, C2
  topic TEXT DEFAULT 'general',
  collocations TEXT DEFAULT '[]',     -- JSON Array: ["take for granted", ...]
  examples TEXT DEFAULT '[]',         -- JSON Array: [{"en": "...", "vi": "..."}]
  tags TEXT DEFAULT '[]',             -- JSON Array: ["work", "ielts"]
  repetition INTEGER DEFAULT 0,
  interval INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  due_date TEXT,                      -- YYYY-MM-DD
  status TEXT DEFAULT 'new',          -- new, learning, review, mastered
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Bảng Mẫu Câu & Cấu Trúc (patterns)
CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  formula TEXT NOT NULL,
  explanation TEXT,
  meaning_vi TEXT NOT NULL,
  category TEXT DEFAULT 'emphasis',   -- 10 communicative categories
  tone TEXT DEFAULT 'Neutral',        -- Academic, Business, Conversational
  examples TEXT DEFAULT '[]',         -- JSON Array
  tags TEXT DEFAULT '[]',
  repetition INTEGER DEFAULT 0,
  interval INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  due_date TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. Bảng Chủ Đề Từ Vựng (topics)
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🏷️',
  color TEXT DEFAULT '#38bdf8',
  description TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 4. Bảng Nhóm Chức Năng Mẫu Câu (pattern_categories)
CREATE TABLE IF NOT EXISTS pattern_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  emoji TEXT DEFAULT '🧩',
  description TEXT,
  created_at TEXT NOT NULL
);

-- 5. Bảng Ghi Chú & Smart Reader (notes)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  linked_words TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Bảng Kho Đề Thi & Lịch Sử Quiz (quiz_history)
CREATE TABLE IF NOT EXISTS quiz_history (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'vocab',          -- vocab | pattern
  is_ai INTEGER DEFAULT 0,            -- 0: offline | 1: AI generated
  topic TEXT DEFAULT 'All',
  category TEXT DEFAULT 'all',
  level TEXT DEFAULT 'all',
  mode TEXT DEFAULT 'mixed',
  questions TEXT NOT NULL,            -- JSON Array of Question Objects
  total_questions INTEGER DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  best_score REAL DEFAULT 0,
  last_attempt_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 7. Bảng Cài Đặt Hệ Thống & Gamification (settings & user_profile)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY DEFAULT 'default_user',
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_study_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## 3. Thuật Toán Lõi & Động Cơ Nghiệp Vụ

### 3.1 Thuật toán Spaced Repetition (SuperMemo SM-2)
Áp dụng công thức chuẩn SuperMemo SM-2 cho từng thẻ nhớ khi người dùng đánh giá mức độ ghi nhớ (Rating từ 0 đến 5):
$$\text{EF}' = \text{EF} + (0.1 - (5 - q) \cdot (0.08 + (5 - q) \cdot 0.02))$$
Trong đó:
- $q$: Điểm đánh giá (0 = Hoàn toàn quên, 3 = Nhớ khó khăn, 5 = Nhớ hoàn hảo).
- $\text{EF}' \ge 1.3$: Hệ số độ dễ tối thiểu.
- Khoảng cách ngày lặp lại:
  $$I(1) = 1 \text{ ngày}, \quad I(2) = 6 \text{ ngày}, \quad I(n) = I(n-1) \cdot \text{EF}'$$

### 3.2 Động cơ Sinh Đề AI & Xáo Trộn Ngẫu Nhiên (Fisher-Yates)
1. **Model Hierarchy**: Ưu tiên `gemini-flash-lite-latest` (800ms) ➔ `gemini-3.5-flash-lite` (900ms) ➔ `gemini-3.1-flash-lite` (1200ms) ➔ `gemini-2.5-flash` (1500ms).
2. **Fisher-Yates Shuffle**: Đảm bảo vị trí đáp án đúng luôn phân bố ngẫu nhiên đều đặn trên 4 vị trí $A, B, C, D$:
```javascript
function shuffleArray(opts) {
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}
```
3. **Smart Fallback Engine**: Tự động chuyển đổi sang bộ sinh đề offline nếu API bên ngoài gặp sự cố mạng hoặc Rate Limit (HTTP 429), đảm bảo trải nghiệm người dùng không bao giờ bị ngắt quãng.

---

## 4. Đặc Tả REST API Endpoints Reference

### 4.1 System & Dashboard
- `GET /api/health`: Kiểm tra trạng thái máy chủ.
- `GET /api/dashboard/stats`: Thống kê tổng số từ, mẫu câu, thẻ cần ôn hôm nay, chuỗi ngày học.
- `GET /api/settings` & `POST /api/settings`: Đọc / lưu thiết lập API Key và mô hình AI.

### 4.2 Studio Audio TTS
- `GET /api/audio/tts?text=...&lang=en-US`: Trả về luồng âm thanh phát âm chuẩn HD (`audio/mpeg`).

### 4.3 Vocabulary API
- `GET /api/vocab`: Lấy danh sách từ vựng (hỗ trợ `search`, `topic`, `level`).
- `GET /api/vocab/lookup?word=...`: Tự động tra từ điển online (IPA, audio, nghĩa, ví dụ).
- `GET /api/vocab/:id`: Chi tiết từ vựng.
- `POST /api/vocab`: Thêm từ vựng mới.
- `PUT /api/vocab/:id`: Cập nhật thông tin từ vựng.
- `DELETE /api/vocab/:id`: Xóa từ vựng.

### 4.4 Sentence Pattern API
- `GET /api/patterns`: Lấy danh sách mẫu câu (lọc theo `category`, `tone`).
- `POST /api/patterns`: Tạo mẫu câu mới.
- `PUT /api/patterns/:id`: Cập nhật mẫu câu (hỗ trợ partial update).
- `DELETE /api/patterns/:id`: Xóa mẫu câu.
- `GET /api/pattern-categories`: Danh sách 10 nhóm chức năng giao tiếp.

### 4.5 Quiz Engine API
- `POST /api/quiz/generate`: Sinh đề trắc nghiệm từ vựng offline.
- `POST /api/quiz/generate-ai`: Sinh đề trắc nghiệm từ vựng bằng AI (Flash-Lite).
- `POST /api/quiz/generate-pattern`: Sinh đề mẫu câu offline.
- `POST /api/quiz/generate-pattern-ai`: Sinh đề mẫu câu bằng AI (Flash-Lite).
- `POST /api/quiz/submit`: Nộp bài, chấm điểm, cộng EXP và ghi nhận lịch sử.
- `GET /api/quiz/history`: Lấy kho đề thi và lịch sử làm bài.
- `GET /api/quiz/history/:id`: Chi tiết đề thi để làm lại (Re-take).
- `DELETE /api/quiz/history/:id`: Xóa đề thi khỏi kho.

### 4.6 AI Speaking Lab API
- `GET /api/speaking/prompts`: Lấy danh sách bài đọc mẫu và chủ đề phỏng vấn.
- `POST /api/speaking/analyze-read-aloud`: Phân tích phát âm, ngữ điệu, nhận diện âm vị chuẩn/lệch.
- `POST /api/speaking/analyze-qa`: Chấm điểm bài nói tự do theo 4 tiêu chí IELTS Speaking kèm bài mẫu Band 8.5+.

### 4.7 SRS Spaced Repetition API
- `GET /api/srs/due`: Danh sách các thẻ từ vựng & mẫu câu đến hạn ôn tập hôm nay.
- `POST /api/srs/review`: Gửi kết quả đánh giá (Rating: again, hard, good, easy) để tính ngày ôn kế tiếp.

### 4.8 Data Backup & Export
- `GET /api/backup/export`: Trích xuất toàn bộ dữ liệu SQLite ra tệp JSON.
- `POST /api/backup/import`: Nhập dữ liệu sao lưu JSON vào hệ thống.

---

## 5. Quy Chuẩn Bảo Mật & Local-First Privacy
1. **Dữ liệu riêng tư 100%**: Mọi thông tin ghi chú, kho từ và tiến độ học tập được lưu cục bộ trên thiết bị của người dùng thông qua SQLite (`lingua_vault.db`).
2. **Không thu thập dữ liệu trái phép**: Không gửi dữ liệu học tập ra bên ngoài ngoại trừ các yêu cầu xử lý ngôn ngữ gửi trực tiếp đến Google AI Studio bằng API Key của chính người dùng.
3. **API Key an toàn**: Khóa Gemini API được lưu trữ mã hóa trong bảng `settings` cục bộ.
