# 🏛️ LinguaVault - Personal English Knowledge & SRS Ecosystem

> **LinguaVault** là hệ sinh thái học tập tiếng Anh cá nhân hóa toàn diện, giải quyết triệt để **đường cong lãng quên (Ebbinghaus Forgetting Curve)** bằng thuật toán **Lặp lại ngắt quãng (Spaced Repetition System / SuperMemo SM-2)** kết hợp cùng **Trợ lý Trí tuệ Nhân tạo (Google Gemini AI)** và **Hệ thống Telegram AI Copilot hai chiều**.

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite3%20(better--sqlite3)-blue.svg)](https://www.sqlite.org/)
[![Frontend Web](https://img.shields.io/badge/Web-React%2019%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)
[![Mobile App](https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo-000020.svg)](https://expo.dev/)
[![Desktop](https://img.shields.io/badge/Desktop-Electron-47848F.svg)](https://www.electronjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini%20Flash--Lite-orange.svg)](https://ai.google.dev/)

---

## 📑 Mục Lục
1. [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
2. [Các Phân Hệ Tính Năng Nổi Bật](#-các-phân-hệ-tính-năng-nổi-bật)
3. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
4. [Hướng Dẫn Khởi Động Nhanh (Quick Start)](#-hướng-dẫn-khởi-động-nhanh)
5. [Cấu Hình & Biến Môi Trường](#-cấu-hình--biến-môi-trường)
6. [Quy Trình Kiểm Thử Tự Động (Test Suite)](#-quy-trình-kiểm-thử-tự-động)
7. [Đóng Gói & Triển Khai Production](#-đóng-gói--triển-khai-production)

---

## 🏗️ Kiến Trúc Hệ Thống

LinguaVault được thiết kế theo mô hình **Monorepo Hướng Dịch Vụ Cục Bộ (Local-First Architecture)**, toàn bộ dữ liệu thuộc quyền sở hữu riêng tư 100% của người học, lưu trữ tại tệp tin SQLite cục bộ, không phụ thuộc vào đám mây bên thứ ba:

```
+-------------------------------------------------------------------------+
|                  GIAO DIỆN NGƯỜI DÙNG (MULTI-PLATFORM)                   |
|                                                                         |
|   🌐 Web Client (React 19 + Vite)        📱 Mobile App (React Native)    |
|   Port: 3000                            iOS / Android / PWA (Expo)      |
|                                                                         |
|                  💻 Desktop Window (Electron Wrapper)                   |
+------------------------------------+------------------------------------+
                                     | (REST API / JSON)
                                     v
+-------------------------------------------------------------------------+
|                LINGUAVAULT CORE API SERVER (Port: 5001)                 |
|                                                                         |
|  • Express.js Controllers (Vocab, Patterns, Quiz, Speaking, SRS, Stats) |
|  • Spaced Repetition Engine (SuperMemo SM-2 Algorithm)                  |
|  • Google Gemini Flash-Lite AI Engine (Response < 3.5s)                 |
|  • HD Audio TTS Stream Generator                                        |
|  • Telegram AI Copilot & Two-Way Alarm Poller                           |
|  • better-sqlite3 Native Engine (lingua_vault.db)                       |
+------------------------------------+------------------------------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
     Google AI Studio API                         Telegram Bot API
     (Gemini Flash 0đ)                            (Two-way Polling)
```

---

## 🌟 Các Phân Hệ Tính Năng Nổi Bật

### 1. 📖 Kho Từ Vựng & Cấp Độ IELTS Phân Tầng (Vocab Vault)
- **Tra cứu 1-Click Siêu Tốc**: Tự động lấy phiên âm quốc tế (IPA), loại từ, audio phát âm giọng Mỹ chuẩn, định nghĩa song ngữ và ví dụ mẫu.
- **Phân Tầng IELTS/CEFR 6 Cấp Độ**: Từ A1-A2 (IELTS 4.0) đến C2 Mastery (IELTS 8.5-9.0).
- **Quản lý Chủ đề (Topics)**: Gán tag linh hoạt theo các ngữ cảnh: *Công việc, Công nghệ, Học thuật, Giao tiếp hàng ngày, Y tế, Tài chính...*

### 2. 🧩 Kho Mẫu Câu & Cấu Trúc Ngữ Pháp Chuyên Sâu (Pattern Hub)
- **10 Nhóm Chức Năng Giao Tiếp**: Nhấn mạnh (*Emphasis*), Nhượng bộ (*Concession*), Trình tự thời gian (*Time Sequence*), Điều kiện (*Conditional*), So sánh (*Comparison*), Nguyên nhân - Kết quả (*Cause & Effect*), Mục đích (*Purpose*), Đảo ngữ (*Inversion*), Câu chẻ (*Cleft Sentences*), Thể bị động nâng cao.
- **Phân loại Tone & Sắc Thái**: *Academic, Formal Business, Conversational, Idiomatic*.

### 3. 🧠 Cỗ Máy Ôn Luyện Chống Quên (SuperMemo SM-2 SRS Engine)
- Tính toán chính xác thời điểm vàng cần ôn tập dựa trên hệ số độ dễ (**Ease Factor - EF**), số lần lặp (**Repetition**) và khoảng cách ngày (**Interval**).
- **3 Chế độ tương tác**: 
  1. *Flashcard lật thẻ 3D*
  2. *Điền từ vào ngữ cảnh (Cloze Blank)*
  3. *Luyện phản xạ nghe phát âm (Audio Reflex)*.

### 4. ✨ Trung Tâm Quiz & Sinh Đề Thông Minh Bằng AI (Quiz Center)
- **Sinh đề AI Siêu Tốc (~3.5 giây)**: Sử dụng mô hình `gemini-flash-lite-latest` với tốc độ phản hồi nhanh gấp 3.5 lần.
- **4 Chế độ làm bài**: *Điền chỗ trống, Chọn nghĩa theo ngữ cảnh, Chọn từ theo định nghĩa, Luyện nghe phản xạ*.
- **Xáo Trộn Đáp Án Ngẫu Nhiên (Fisher-Yates)**: Vị trí đáp án đúng phân bổ ngẫu nhiên A, B, C, D.
- **Lưu Kho Lịch Sử Đề & Làm Lại (Re-take)**: Tự động lưu 100% đề thi đã tạo vào cơ sở dữ liệu để làm lại bất kỳ lúc nào với 0s độ trễ.

### 5. 🎙️ Phòng Luyện Nói & Đánh Giá Phát Âm AI (AI Speaking Lab)
- **Shadowing & Đọc thành tiếng (Read-Aloud)**: Chấm điểm phát âm, ngữ điệu, độ trôi chảy và nhận diện chi tiết từng từ phát âm chuẩn/lệch.
- **Phỏng Vấn Q&A IELTS Tương Tác**: AI đưa ra câu hỏi, người học thu âm câu trả lời -> AI chấm điểm theo chuẩn 4 tiêu chí IELTS Speaking (*Fluency, Lexical Resource, Grammatical Accuracy, Pronunciation*) kèm bài mẫu Band 8.5+.

### 6. 🤖 Telegram AI Copilot (Trợ Lý Hai Chiều 24/7)
- **Nhắc nhở thông minh & Báo thức học tập (Hardcore Alarm Mode)**.
- **Tương tác đàm thoại 2 chiều**: Tra từ, giải thích ngữ pháp, làm bài quiz nhanh ngay trên ứng dụng Telegram điện thoại.

### 7. 🎮 Gamification & Báo Cáo Năng Lực Học Tập
- Tích lũy điểm kinh nghiệm (**XP**), bảng xếp hạng cấp bậc (*Novice ➔ Master ➔ Grandmaster*).
- Chuỗi ngày học liên tục (**Streak Counter**) và Báo cáo năng lực cá nhân hóa bằng AI.

### 8. 🛡️ Sao Lưu & Phục Hồi Dữ Liệu An Toàn (Backup & Export)
- Trích xuất toàn bộ dữ liệu kho từ, mẫu câu, ghi chú thành tệp tin `.json` chỉ với 1 click.
- Hỗ trợ nhập lại dữ liệu và tự động giải quyết xung đột ID.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
/Users/daf/Documents/lingua-vault/
├── server/                         # 🚀 BACKEND SERVER (Node.js + Express)
│   ├── src/
│   │   ├── controllers/            # Bộ điều khiển API (vocab, pattern, quiz, srs, speaking...)
│   │   ├── db/                     # Cơ sở dữ liệu SQLite & Seed dữ liệu mẫu
│   │   ├── services/               # Động cơ nghiệp vụ (SM-2, Gemini AI, Audio TTS, Telegram Bot)
│   │   └── index.js                # Điểm khởi động máy chủ (Port 5001)
│   └── package.json
│
├── web/                            # 🌐 WEB CLIENT (React 19 + Vite)
│   ├── src/
│   │   ├── components/             # Các phân hệ giao diện (QuizCenter, VocabHub, PatternHub, Reader...)
│   │   ├── services/               # API Client kết nối máy chủ
│   │   ├── App.jsx                 # Bộ điều hướng & Layout chính
│   │   └── index.css               # Hệ thống Style toàn diện & Dark/Light theme
│   └── package.json
│
├── mobile/                         # 📱 MOBILE APP (React Native + Expo)
│   ├── src/services/               # Mobile API Client
│   ├── App.js                      # Ứng dụng di động hợp nhất toàn diện
│   ├── app.json                    # Cấu hình Expo Project
│   └── package.json
│
├── desktop/                        # 💻 DESKTOP WRAPPER (Electron)
│   ├── main.js                     # Cấu hình cửa sổ ứng dụng Desktop
│   └── package.json
│
├── run-dev.js                      # Script chạy đồng thời Server + Web
├── README.md                       # Tài liệu hướng dẫn sử dụng & tổng quan
└── ARCHITECTURE.md                 # Tài liệu thiết kế kỹ thuật chi tiết
```

---

## ⚡ Hướng Dẫn Khởi Động Nhanh

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 18.0 trở lên (khuyên dùng Node.js 20 LTS hoặc mới hơn).
- **Trình quản lý gói**: `npm` hoặc `yarn`.

### 2. Cài Đặt Dependencies
Chạy lệnh cài đặt tại thư mục gốc và các thư mục con:
```bash
cd /Users/daf/Documents/lingua-vault
npm install
cd server && npm install
cd ../web && npm install
cd ../mobile && npm install
cd ../desktop && npm install
```

### 3. Khởi Động Hệ Thống Phát Triển (1 Lệnh Duy Nhất)
Tại thư mục gốc dự án:
```bash
node run-dev.js
```
Lệnh này sẽ tự động:
- Khởi động **Server API** tại `http://localhost:5001`
- Khởi động **Web Client** tại `http://localhost:3000`
- Nạp sẵn cơ sở dữ liệu SQLite tại `server/data/lingua_vault.db`

### 4. Khởi Động Mobile App (Expo Go)
Mở một tab terminal mới:
```bash
cd /Users/daf/Documents/lingua-vault/mobile
npx expo start
```
- Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (iOS / Android).
- Hoặc truy cập phiên bản Web Mobile tại: `http://localhost:5001/mobile`.

### 5. Khởi Động Ứng Dụng Desktop (Electron)
```bash
cd /Users/daf/Documents/lingua-vault/desktop
npm start
```

---

## ⚙️ Cấu Hình & Biến Môi Trường

Tạo tệp `.env` tại thư mục `server/` (đã có sẵn mẫu):

```ini
# Cổng chạy API Server
PORT=5001

# Google Gemini API Key (Miễn phí 0đ tại https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Mô hình AI mặc định (Khuyên dùng gemini-flash-lite-latest để đạt tốc độ cao nhất)
GEMINI_MODEL=gemini-flash-lite-latest

# Telegram Bot Token (Tùy chọn, tạo qua @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## 🧪 Quy Trình Kiểm Thử Tự Động

LinguaVault được trang bị bộ kiểm thử tự động toàn diện (**Master Production Audit Suite**) bao phủ **31/31 kịch bản kiểm thử (100% PASS)**:

```bash
node /Users/daf/.gemini/antigravity/brain/29e0ef45-aed3-4609-bb41-37ccaaa3f49f/scratch/master_production_audit.mjs
```

---

## 📦 Đóng Gói & Triển Khai Production

### 1. Đóng Gói Web Client
```bash
cd /Users/daf/Documents/lingua-vault/web
npm run build
# Tệp tĩnh được sinh ra tại: web/dist
```

### 2. Đóng Gói Mobile App (Tĩnh & Native)
```bash
cd /Users/daf/Documents/lingua-vault/mobile
EXPO_NO_TELEMETRY=1 npx expo export -p web
# Tệp tĩnh phục vụ nhúng được sinh ra tại: mobile/dist
```

### 3. Đóng Gói Ứng Dụng Desktop (macOS / Windows)
```bash
cd /Users/daf/Documents/lingua-vault/desktop
npm run dist
```

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng và phát triển dưới giấy phép **MIT License**. Mọi quyền riêng tư dữ liệu thuộc về người sử dụng cục bộ.
