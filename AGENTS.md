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
│   │   ├── index.js                     # Cổng 5001 - Đăng ký tất cả REST Routes, Schedulers, Static Mobile
│   │   ├── db/
│   │   │   ├── database.js              # Khởi tạo SQLite (lingua_vault.db), Foreign Keys & WAL Mode
│   │   │   └── seedData.js              # Dữ liệu mẫu khởi tạo (Từ vựng, Mẫu câu, Topics, Categories)
│   │   ├── controllers/
│   │   │   ├── vocabController.js       # CRUD từ vựng, tra từ điển online, gán topic/level
│   │   │   ├── patternController.js     # CRUD mẫu câu, hỗ trợ partial update
│   │   │   ├── quizController.js        # Sinh đề Quiz, AI Quiz, nộp bài, lưu kho quiz_history, làm lại
│   │   │   ├── srsController.js         # Lập lịch ôn tập SM-2, tính toán Ease Factor & ngày đến hạn
│   │   │   ├── speakingController.js    # AI Speaking Lab (Shadowing & IELTS Q&A Speaking)
│   │   │   ├── topicController.js       # Quản lý danh mục chủ đề từ vựng
│   │   │   ├── patternCategoryController.js # Quản lý 10 nhóm chức năng mẫu câu
│   │   │   ├── gamificationController.js # Hồ sơ EXP, level-up, báo cáo năng lực AI
│   │   │   ├── backupController.js      # Xuất / nhập dữ liệu JSON
│   │   │   └── telegramController.js    # Cài đặt Telegram Bot & Báo thức Hardcore Alarm
│   │   └── services/
│   │       ├── aiService.js             # Động cơ Gemini Flash-Lite, safeParseJson, normalizeAndRandomizeQuestions
│   │       ├── quizService.js           # Bộ sinh đề offline, xáo trộn phương án, giải nghĩa ngữ cảnh
│   │       ├── srsAlgorithm.js          # Thuật toán SuperMemo SM-2 chuẩn
│   │       ├── speakingService.js       # Chấm điểm phát âm, trích xuất âm vị, đánh giá IELTS Speaking
│   │       ├── audioService.js          # Luồng phát âm chuẩn HD TTS (Google TTS Proxy)
│   │       ├── gamificationService.js   # Logic tính EXP, chuỗi ngày học streak, xếp hạng
│   │       ├── schedulerService.js      # Cron job định kỳ nhắc học tập & kiểm tra thẻ đến hạn
│   │       └── telegramBotService.js    # Trợ lý Telegram hai chiều (Polling & gửi bài tập)
│
├── web/                                 # 🌐 WEB CLIENT (React 19 + Vite, Port 3000)
│   ├── src/
│   │   ├── App.jsx                      # Router chính, thanh điều hướng Navbar, Dark/Light Theme Provider
│   │   ├── index.css                    # Toàn bộ Style Tokens, Glassmorphism, Responsive CSS
│   │   ├── services/
│   │   │   ├── api.js                   # API Client kết nối Backend (http://localhost:5001/api)
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
├── mobile/                              # 📱 MOBILE APP (React Native Expo)
│   ├── App.js                           # Ứng dụng di động hợp nhất (Tất cả màn hình & logic Mobile)
│   ├── app.json                         # Cấu hình Expo
│   └── src/services/api.js              # Mobile API Client
│
├── desktop/                             # 💻 DESKTOP ELECTRON (macOS / Windows)
│   └── main.js                          # Quản lý cửa sổ Electron, Mobile Simulator, Tray Menu
│
├── run-dev.js                           # Script khởi động đồng thời Server (5001) + Web (3000)
├── README.md                            # Hướng dẫn tổng quan người dùng
├── ARCHITECTURE.md                      # Đặc tả kỹ thuật & Lược đồ CSDL & REST API
└── BUSINESS.md                          # Chiến lược kinh doanh & Định vị sản phẩm
```

---

## ⚡ 2. Bảy Quy Tắc Bất Di Bất Dịch (The 7 Golden Invariants)

Bất kỳ AI nào khi chỉnh sửa mã nguồn LinguaVault **BẮT BUỘC** phải tuân thủ nghiêm ngặt 7 nguyên tắc sau:

### 🔴 Quy Tắc 1: An Toàn Tham Số SQLite (Strict SQLite Parameter Binding)
- Thư viện `better-sqlite3` **tuyệt đối không chấp nhận kiểu dữ liệu Array hoặc Plain Object** trong `stmt.run(...)` hay `stmt.all(...)`.
- **Luôn luôn làm sạch (sanitize)** trước khi gán tham số:
  ```javascript
  // ĐÚNG:
  const cleanTopic = Array.isArray(topic) ? topic.join(', ') : String(topic || 'All');
  const cleanExamples = typeof examples === 'string' ? examples : JSON.stringify(examples || []);
  stmt.run(id, cleanTopic, cleanExamples);

  // SAI (Sẽ gây crash 500 SQLite binding error):
  stmt.run(id, topic, examples); 
  ```

### 🔴 Quy Tắc 2: Đồng Bộ Tính Năng Song Song (Web & Mobile Parity)
- Dự án có 2 client hoạt động song song: **Web** (`web/src/components/...`) và **Mobile** (`mobile/App.js`).
- Khi thêm, sửa logic ở một tính năng (ví dụ: nút Làm Lại Quiz, cơ chế lưu lịch sử, bộ lọc topic): **BẮT BUỘC phải cập nhật đồng bộ ở cả Web VÀ Mobile**.

### 🔴 Quy Tắc 3: Xáo Trộn Ngẫu Nhiên Phương Án Quiz (Fisher-Yates Shuffle)
- Mô hình LLM luôn có xu hướng tạo đáp án đúng ở vị trí đầu tiên `options[0]`.
- Mọi hàm sinh câu hỏi (AI hay Offline) **BẮT BUỘC** phải chạy qua thuật toán xáo trộn Fisher-Yates và đảm bảo đáp án đúng có mặt trong `options`:
  ```javascript
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  ```

### 🔴 Quy Tắc 4: Thứ Tự Ưu Tiên Model AI Siêu Tốc (Fast Model Hierarchy)
- Mô hình mặc định phải là **`gemini-flash-lite-latest`** hoặc **`gemini-3.5-flash-lite`** để đảm bảo độ trễ < 3.8 giây.
- Luôn sử dụng hàm **`safeParseJson`** trong `aiService.js` để bóc tách JSON an toàn từ phản hồi của Gemini, không dùng `JSON.parse` trần vì AI có thể trả về markdown code blocks hoặc văn bản phụ.

### 🔴 Quy Tắc 5: Cơ Chế Dự Phòng Ngoại Tuyến (Smart Offline Fallback)
- Mọi endpoint gọi AI (`/api/quiz/generate-ai`, `/api/quiz/generate-pattern-ai`, `/api/speaking/...`) phải luôn bọc trong khối `try/catch` có fallback sang bộ sinh đề thông minh cục bộ (`quizService`).
- Người dùng **không bao giờ được thấy thông báo lỗi crash** nếu mạng ngắt quãng hoặc Gemini bị chạm trần Quota (HTTP 429).

### 🔴 Quy Tắc 6: Kiểm Tra Tĩnh AST React Native (Zero Undeclared Variables)
- Trước khi hoàn tất code ở `mobile/App.js`, luôn chạy kiểm tra phân tích tĩnh Babel AST để đảm bảo **0 biến chưa khai báo (0 undeclared variables)**.

### 🔴 Quy Tắc 7: Triết Lý Local-First 0đ
- Không tích hợp bất kỳ dịch vụ đám mây trả phí bắt buộc nào. Toàn bộ CSDL phải nằm trong file SQLite cục bộ `server/data/lingua_vault.db`.

---

## 🛠️ 3. Quy Trình Chuẩn Xử Lý Tác Vụ (Standard Operating Procedures)

### SOP 1: Thêm một API Endpoint Mới
1. Viết hàm xử lý trong Controller tương ứng tại `server/src/controllers/`.
2. Đăng ký Route trong `server/src/index.js`.
3. Thêm hàm gọi API trong `web/src/services/api.js`.
4. Thêm hàm gọi API trong `mobile/src/services/api.js` và `mobile/App.js`.
5. Bổ sung kịch bản kiểm thử vào `scratch/master_production_audit.mjs`.

### SOP 2: Cập Nhật Lược Đồ Cơ Sở Dữ Liệu (Schema Migration)
1. Thêm câu lệnh `ALTER TABLE` hoặc `CREATE TABLE IF NOT EXISTS` trong hàm `initializeDatabase()` tại `server/src/db/database.js`.
2. Bọc câu lệnh trong khối `try/catch` để tránh lỗi nếu cột đã tồn tại (SQLite migration idempotent).
3. Cập nhật `server/src/controllers/backupController.js` để xuất/nhập đầy đủ bảng mới.

### SOP 3: Kiểm Thử Toàn Bộ Hệ Thống (Master Audit)
Chạy bộ kiểm thử tự động toàn diện:
```bash
node /Users/daf/.gemini/antigravity/brain/29e0ef45-aed3-4609-bb41-37ccaaa3f49f/scratch/master_production_audit.mjs
```
*Yêu cầu: Toàn bộ 31/31 bài test phải đạt trạng thái `[PASS]`.*

### SOP 4: Build & Khởi Động Lại Hệ Thống
1. Build Web: `cd web && npm run build`
2. Export Mobile: `cd mobile && EXPO_NO_TELEMETRY=1 npx expo export -p web`
3. Chạy Dev Server: `node run-dev.js`
4. Khởi chạy Electron: `cd desktop && npm start`

---

## ⚠️ 4. Các Bẫy Kỹ Thuật Đã Giải Quyết (Historical Pitfalls & Solutions)

| Hiện tượng lỗi | Nguyên nhân gốc rễ | Cách xử lý chuẩn |
| :--- | :--- | :--- |
| **Lưu đề AI bị lỗi không lưu vào Lịch sử** | Gửi mảng `topic: ['All']` trực tiếp vào `stmt.run()` của SQLite. | Luôn ép kiểu `cleanTopic = Array.isArray(t) ? t.join(', ') : String(t)`. |
| **Đáp án đúng của đề AI luôn nằm ở câu A** | LLM sinh JSON với đáp án đúng ở vị trí index 0. | Chạy Fisher-Yates shuffle cho mảng `options` của từng câu hỏi trước khi trả về. |
| **Request AI mất 8-12 giây mới phản hồi** | Thử tuần tự các model cũ bị 429 quota (`gemini-3.5-flash`). | Đổi model mặc định sang `gemini-flash-lite-latest` và giảm `maxOutputTokens` xuống 2500. |
| **Màn hình trắng tinh trên Mobile** | Sử dụng biến chưa được khai báo hoặc thiếu import trong `App.js`. | Chạy Babel AST parser kiểm tra trước khi commit code. |
| **Nút "Làm lại bài Quiz" tạo ra đề mới** | Nút làm lại gọi hàm `generateQuiz` thay vì nạp lại mảng `quizData.questions` đang có trong bộ nhớ. | Tạo hàm `handleRetakeCurrentQuiz` chỉ reset index về 0 và xóa câu trả lời cũ, 0s delay. |

---

## 🎯 5. Cam Kết Chất Lượng Dành Cho AI
Khi bạn (AI Agent) làm việc trên dự án này:
1. Đọc kỹ file này trước khi chỉnh sửa bất kỳ module nào.
2. Giữ vững tính thẩm mỹ UI/UX Glassmorphism theo tiêu chuẩn cao cấp.
3. Luôn kiểm tra tính toàn vẹn (Build & Test) trước khi phản hồi người dùng.

