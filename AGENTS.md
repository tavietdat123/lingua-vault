# 🤖 LinguaVault - AI Agent Onboarding & Engineering Playbook

> **Dành cho bất kỳ AI Coding Assistant nào (Antigravity, Claude, Cursor, Copilot, ChatGPT...)**:
> Đây là tài liệu quy chuẩn kỹ thuật toàn diện giúp bạn hiểu sâu sắc kiến trúc, bản đồ mã nguồn, các quy tắc bất di bất dịch (Invariants), các bẫy thường gặp (Pitfalls) và quy trình chuẩn (SOP) để tiếp quản và phát triển hệ thống LinguaVault ngay lập tức với **0% lỗi**.

---

## 🗺️ 1. Bản Đồ Mã Nguồn & Vị Trí Trọng Yếu (Codebase Map)

LinguaVault là một Monorepo gồm 4 phân hệ chính:

```
/Users/daf/Documents/lingua-vault/
├── server/                              # 🚀 BACKEND API (Express + better-sqlite3)
│   ├── src/
│   │   ├── index.js                     # Entry point - Khởi chạy HTTP Server trên cổng 5001 (0.0.0.0)
│   │   ├── app.js                       # Express App Factory - Đăng ký Middlewares, Auth, Public/Protected Routes, Static Clients
│   │   ├── config.js                    # Quản lý biến môi trường tập trung (JWT, RateLimit, CORS, Port, AI Model)
│   │   ├── middleware/                  # Lớp kiểm soát bảo mật & tiền xử lý
│   │   │   ├── auth.js                  # JWT Token verification, attachUser, requireAuth, requireRole
│   │   │   ├── errorHandler.js          # Bắt lỗi toàn cục, asyncHandler, apiNotFound handler
│   │   │   ├── rateLimit.js             # Bộ đệm chống spam request (sliding window)
│   │   │   ├── security.js              # Helmet-style security headers, CORS whitelist & LAN detection
│   │   │   └── validate.js              # Kiểm tra schema dữ liệu đầu vào (validateBody)
│   │   ├── db/
│   │   │   ├── database.js              # SQLite Engine (lingua_vault.db), WAL Mode, Foreign Keys & Auto Migration
│   │   │   └── seedData.js              # Dữ liệu mẫu khởi tạo (Từ vựng, Mẫu câu, Topics, Categories, User Admin)
│   │   ├── controllers/
│   │   │   ├── authController.js        # Đăng ký, Đăng nhập Admin (admin/123456), Đăng nhập Khách, Profile
│   │   │   ├── vocabController.js       # CRUD từ vựng, tra từ điển online, gán topic/level theo user_id
│   │   │   ├── patternController.js     # CRUD mẫu câu, hỗ trợ partial update theo user_id
│   │   │   ├── quizController.js        # Sinh đề Quiz, AI Quiz, nộp bài, lưu kho quiz_history, làm lại
│   │   │   ├── srsController.js         # Lập lịch ôn tập SM-2, tính toán Ease Factor & ngày đến hạn
│   │   │   ├── speakingController.js    # AI Speaking Lab (Shadowing & IELTS Q&A Speaking)
│   │   │   ├── topicController.js       # Quản lý danh mục chủ đề từ vựng
│   │   │   ├── patternCategoryController.js # Quản lý 10 nhóm chức năng mẫu câu
│   │   │   ├── gamificationController.js # Hồ sơ EXP, level-up 16 bậc thang, báo cáo năng lực AI
│   │   │   ├── backupController.js      # Xuất / nhập dữ liệu JSON an toàn
│   │   │   └── telegramController.js    # Cài đặt Telegram Bot & Báo thức Hardcore Alarm
│   │   └── services/
│   │       ├── authService.js           # Xử lý hash bcrypt, cấp phát JWT stateless token
│   │       ├── aiService.js             # Động cơ Gemini Flash-Lite, safeParseJson, normalizeAndRandomizeQuestions
│   │       ├── quizService.js           # Bộ sinh đề offline, xáo trộn phương án, giải nghĩa ngữ cảnh
│   │       ├── srsAlgorithm.js          # Thuật toán SuperMemo SM-2 chuẩn (Repetition, Interval, Ease Factor)
│   │       ├── speakingService.js       # Chấm điểm phát âm, trích xuất âm vị, đánh giá IELTS Speaking
│   │       ├── audioService.js          # Luồng phát âm chuẩn HD TTS (Google TTS Proxy)
│   │       ├── gamificationService.js   # Logic tính EXP, chuỗi ngày học streak, xếp hạng 16 level
│   │       ├── schedulerService.js      # Cron job định kỳ nhắc học tập & kiểm tra thẻ đến hạn
│   │       ├── systemAlarmService.js    # Kích hoạt chuông báo thức cấp hệ điều hành (OS Alarm)
│   │       └── telegramBotService.js    # Trợ lý Telegram hai chiều (Polling & gửi bài tập)
│
├── web/                                 # 🌐 WEB CLIENT (React 19 + Vite, Port 3000)
│   ├── src/
│   │   ├── App.jsx                      # Router chính, thanh điều hướng Navbar, Dark/Light Theme Provider
│   │   ├── index.css                    # Toàn bộ Style Tokens, Glassmorphism, Responsive CSS
│   │   ├── services/
│   │   │   ├── api.js                   # API Client kết nối Backend (hỗ trợ JWT Auth & LAN Host)
│   │   │   └── audioService.js          # Web Speech Synthesis & Studio TTS Audio Player
│   │   └── components/
│   │       ├── quiz/QuizCenter.jsx      # Trung tâm Quiz: Tạo đề mới, Lịch sử đề, Re-take, Segmented Tabs
│   │       ├── vocab/VocabHub.jsx       # Quản lý kho từ vựng, bộ lọc IELTS 6 cấp độ, 1-Click Auto Lookup
│   │       ├── patterns/PatternHub.jsx  # Quản lý mẫu câu, bộ lọc 10 chức năng giao tiếp
│   │       ├── reader/SmartReader.jsx   # Trình đọc văn bản, bôi đen trích xuất từ vựng/mẫu câu
│   │       ├── srs/ReviewSession.jsx    # Giao diện ôn tập SRS (Flashcard 3D, Cloze, Audio Reflex)
│   │       ├── speaking/SpeakingLab.jsx # Phòng luyện nói AI, ghi âm, phân tích phát âm
│   │       ├── gamification/ProfileHub.jsx # Hồ sơ cá nhân, biểu đồ EXP, huy hiệu, báo cáo AI
│   │       └── settings/SettingsModal.jsx  # Cài đặt Gemini API Key, Model, Telegram Token
│
├── mobile/                              # 📱 MOBILE APP (React Native Expo SDK 52)
│   ├── App.js                           # Ứng dụng di động hợp nhất (Tất cả màn hình, Zero-Mount Modals & Native Audio)
│   ├── app.json                         # Cấu hình Expo, Apple ATS, Icon 1024x1024, Splash 512x512
│   ├── metro.config.js                  # Metro Bundler Config chuẩn SDK 52
│   └── src/services/api.js              # Mobile API Client (Tự động quét danh sách CANDIDATE_SERVERS LAN IP)
│
├── desktop/                             # 💻 DESKTOP ELECTRON (macOS / Windows)
│   ├── main.js                          # Quản lý cửa sổ ứng dụng Desktop LinguaVault
│   └── mobile-simulator.js              # Trình mô phỏng iPhone 15 Pro trên macOS kèm cảm ứng vuốt chạm (Touch Emulation)
│
├── run-dev.js                           # Script khởi động đồng thời Server (5001) + Web (3000)
├── README.md                            # Hướng dẫn tổng quan & cài đặt người dùng
├── ARCHITECTURE.md                      # Đặc tả kỹ thuật & Lược đồ CSDL & REST API
└── BUSINESS.md                          # Chiến lược kinh doanh & Định vị sản phẩm
```

---

## ⚡ 2. Mười Quy Tắc Bất Di Bất Dịch (The 10 Golden Invariants)

Bất kỳ AI nào khi chỉnh sửa mã nguồn LinguaVault **BẮT BUỘC** phải tuân thủ nghiêm ngặt 10 nguyên tắc sau:

### 🔴 Quy Tắc 1: An Toàn Tham Số SQLite (Strict SQLite Parameter Binding)
- Thư viện `better-sqlite3` **tuyệt đối không chấp nhận kiểu dữ liệu Array hoặc Plain Object** trong `stmt.run(...)` hay `stmt.all(...)`.
- **Luôn luôn làm sạch (sanitize)** trước khi gán tham số:
  ```javascript
  // ĐÚNG:
  const cleanTopic = Array.isArray(topic) ? topic.join(', ') : String(topic || 'All');
  const cleanExamples = typeof examples === 'string' ? examples : JSON.stringify(examples || []);
  stmt.run(id, userId, cleanTopic, cleanExamples);

  // SAI (Sẽ gây crash 500 SQLite binding error):
  stmt.run(id, userId, topic, examples); 
  ```

### 🔴 Quy Tắc 2: Cô Lập Dữ Liệu Đa Người Dùng (Multi-User Data Isolation)
- Mọi bảng dữ liệu nghiệp vụ (`words`, `patterns`, `topics`, `pattern_categories`, `notes`, `quiz_history`, `user_gamification`, `user_streaks`) đều có cột `user_id`.
- Mọi truy vấn `SELECT`, `UPDATE`, `DELETE` bắt buộc phải kèm điều kiện `user_id = ?` (hoặc `(user_id = ? OR user_id IS NULL)` cho dữ liệu seed mặc định) để đảm bảo không rò rỉ dữ liệu giữa các tài khoản.

### 🔴 Quy Tắc 3: Tương Thích Tuyệt Đối Hermes JS Engine (Hermes Safety)
- **Cấm dùng Regex Lookbehind `(?<=...)` và `(?<!...)`**: Hermes JS Engine trên iOS và Android Native không hỗ trợ lookbehind và sẽ ném lỗi `SyntaxError: Invalid regular expression: invalid group specifier name` làm crash app ngay lập tức. Luôn dùng `.match()` hoặc split an toàn:
  ```javascript
  // ĐÚNG:
  const sentences = content.match(/[^.?!]+[.?!]*\s*/g) || [content];

  // SAI (Crash trên iPhone Native):
  const sentences = content.split(/(?<=[.?!])\s+/);
  ```
- **Luôn dùng Ternary `? : null` cho JSX Conditions**: Hermes sẽ cố gắng render boolean `false` thành View nếu dùng `{cond && <View />}`, gây crash `completeWork` trên iOS Native. Luôn viết: `{Boolean(cond) ? <View /> : null}`.

### 🔴 Quy Tắc 4: Kiến Trúc Lazy-Mount Cho Tất Cả Modal (Zero-Mount Modals)
- `<Modal visible={false}>` trong React Native Native vẫn khởi tạo toàn bộ cây Fiber bên trong. Nếu các biến state (như `selectedWord`, `alarmQuestions`) đang là `null` hoặc `[]`, việc mount trước sẽ gây lỗi truy cập thuộc tính undefined.
- **Tất cả Modal phải được bọc điều kiện mở**: `{isModalOpen ? <Modal visible={true}>...</Modal> : null}`.

### 🔴 Quy Tắc 5: Động Cơ Âm Thanh Đa Tầng Cho Native & Web (4-Layer Audio Engine)
- Trên iOS Native (`.ipa`), đối tượng trình duyệt `window.Audio` và `window.speechSynthesis` không tồn tại (`undefined`).
- Hàm `playMobileAudio` bắt buộc phải triển khai theo thứ tự 4 tầng:
  1. **Tầng 1 (iOS Native Speech)**: Dùng `expo-speech` (`Speech.speak`) kết nối vào `AVSpeechSynthesizer` của Apple với `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` để phát âm ngay cả khi điện thoại ở chế độ im lặng.
  2. **Tầng 2 (Native Audio Stream)**: Dùng `expo-av` (`Audio.Sound`) phát trực tiếp luồng MP3 từ `/api/audio/tts`.
  3. **Tầng 3 (Web HTML5 Audio)**: Dùng `new Audio(ttsUrl)`.
  4. **Tầng 4 (Web Speech Synthesis API)**: Dùng `window.speechSynthesis`.

### 🔴 Quy Tắc 6: Xáo Trộn Ngẫu Nhiên Phương Án Quiz (Fisher-Yates Shuffle)
- Mô hình LLM luôn có xu hướng tạo đáp án đúng ở vị trí đầu tiên `options[0]`.
- Mọi hàm sinh câu hỏi (AI hay Offline) **BẮT BUỘC** phải chạy qua thuật toán xáo trộn Fisher-Yates và đảm bảo đáp án đúng có mặt trong `options`:
  ```javascript
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  ```

### 🔴 Quy Tắc 7: Thứ Tự Ưu Tiên Model AI Siêu Tốc (Fast Model Hierarchy)
- Mô hình mặc định phải là **`gemini-flash-lite-latest`** hoặc **`gemini-3.5-flash-lite`** để đảm bảo độ trễ < 3.5 giây.
- Luôn sử dụng hàm **`safeParseJson`** trong `aiService.js` để bóc tách JSON an toàn từ phản hồi của Gemini, không dùng `JSON.parse` trần vì AI có thể trả về markdown code blocks hoặc văn bản phụ.

### 🔴 Quy Tắc 8: Cơ Chế Dự Phòng Ngoại Tuyến (Smart Offline Fallback)
- Mọi endpoint gọi AI (`/api/quiz/generate-ai`, `/api/quiz/generate-pattern-ai`, `/api/speaking/...`) phải luôn bọc trong khối `try/catch` có fallback sang bộ sinh đề thông minh cục bộ (`quizService`).
- Người dùng **không bao giờ được thấy thông báo lỗi crash** nếu mạng ngắt quãng hoặc Gemini bị chạm trần Quota (HTTP 429).

### 🔴 Quy Tắc 9: Đồng Bộ Tính Năng Song Song (Web & Mobile Parity)
- Dự án có 2 client hoạt động song song: **Web** (`web/src/components/...`) và **Mobile** (`mobile/App.js`).
- Khi thêm, sửa logic ở một tính năng (ví dụ: nút Làm Lại Quiz, cơ chế lưu lịch sử, bộ lọc topic): **BẮT BUỘC phải cập nhật đồng bộ ở cả Web VÀ Mobile**.

### 🔴 Quy Tắc 10: Triết Lý Local-First 0đ & Bảo Mật Mạng LAN
- CSDL phải nằm trong file SQLite cục bộ `server/data/lingua_vault.db`.
- Máy chủ backend lắng nghe trên `0.0.0.0:5001`, cho phép thiết bị di động trong mạng Wi-Fi LAN truy cập trực tiếp. Client tự động dò quét danh sách `CANDIDATE_SERVERS` để kết nối mượt mà không cần cấu hình thủ công.

---

## 🛠️ 3. Quy Trình Chuẩn Xử Lý Tác Vụ (Standard Operating Procedures)

### SOP 1: Thêm một API Endpoint Mới
1. Viết hàm xử lý trong Controller tương ứng tại `server/src/controllers/`.
2. Đăng ký Route trong `server/src/app.js` (gắn `requireAuth` nếu là route cần bảo vệ).
3. Thêm hàm gọi API trong `web/src/services/api.js`.
4. Thêm hàm gọi API trong `mobile/src/services/api.js` và `mobile/App.js`.
5. Bổ sung kịch bản kiểm thử vào `scratch/master_rigorous_audit.mjs`.

### SOP 2: Cập Nhật Lược Đồ Cơ Sở Dữ Liệu (Schema Migration)
1. Thêm câu lệnh `ALTER TABLE` hoặc `CREATE TABLE IF NOT EXISTS` trong hàm `initializeDatabase()` tại `server/src/db/database.js`.
2. Bọc câu lệnh trong khối `try/catch` để tránh lỗi nếu cột đã tồn tại (SQLite migration idempotent).
3. Cập nhật `server/src/controllers/backupController.js` để xuất/nhập đầy đủ bảng mới.

### SOP 3: Kiểm Thử Toàn Bộ Hệ Thống (Master Audit)
Chạy bộ kiểm thử tự động toàn diện:
```bash
node scratch/master_rigorous_audit.mjs
```
*Yêu cầu: Toàn bộ 26/26 bài test phải đạt trạng thái `[PASS]`.*

### SOP 4: Build & Khởi Động Lại Hệ Thống
1. Khởi động Backend: `cd server && npm run dev`
2. Khởi động Web: `cd web && npm run dev`
3. Export Mobile Web: `cd mobile && npx expo export -p web`
4. Khởi chạy Electron Simulator: `npm run app:mobile`

---

## ⚠️ 4. Các Bẫy Kỹ Thuật Đã Giải Quyết (Historical Pitfalls & Solutions)

| Hiện tượng lỗi | Nguyên nhân gốc rễ | Cách xử lý chuẩn |
| :--- | :--- | :--- |
| **Mất âm thanh trên iPhone thật (`.ipa`)** | Dùng `window.Audio` của trình duyệt Web (bị undefined trên Hermes iOS). | Tích hợp `expo-speech` (`AVSpeechSynthesizer`) và `expo-av` kèm `playsInSilentModeIOS: true`. |
| **Lỗi `ERR_UNKNOWN_FILE_EXTENSION` khi build IPA** | Khai báo nhầm `expo-speech` vào mảng `"plugins"` trong `app.json`. | Gỡ khỏi `plugins` trong `app.json`; Expo tự động liên kết (Auto-linking) qua CocoaPods. |
| **Crash `completeWork` trên Hermes iOS** | Dùng `{cond && <Component />}` đánh giá boolean `false` thành Native View. | Chuyển toàn bộ 82 biểu thức điều kiện JSX sang `{cond ? <Component /> : null}`. |
| **Crash Regex trên iOS** | Dùng biểu thức Lookbehind `split(/(?<=[.?!])\s+/)` không tương thích Hermes. | Thay thế bằng `match(/[^.?!]+[.?!]*\s*/g)`. |
| **Đáp án đúng của đề AI luôn nằm ở câu A** | LLM sinh JSON với đáp án đúng ở vị trí index 0. | Chạy Fisher-Yates shuffle cho mảng `options` của từng câu hỏi trước khi trả về. |
| **Nút "Làm lại bài Quiz" tạo ra đề mới** | Nút làm lại gọi hàm `generateQuiz` thay vì nạp lại mảng `quizData.questions` trong bộ nhớ. | Tạo hàm `handleRetakeCurrentQuiz` chỉ reset index về 0 và xóa câu trả lời cũ, 0s delay. |
