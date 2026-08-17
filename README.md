# 🏛️ LinguaVault - Personal English Knowledge & SRS Hub (0đ)

Hệ sinh thái ứng dụng cá nhân hóa giúp lưu trữ từ vựng, cấu trúc câu, tài liệu học và giải quyết triệt để **đường cong lãng quên (Forgetting Curve)** bằng thuật toán **Spaced Repetition System (SRS / SM-2)**.

---

## 🏗️ Kiến Trúc Hệ Thống (1 Server - 1 Web - 1 Mobile App)

```
/Users/daf/Documents/lingua-vault/
├── server/                      # 1. SERVER API (Node.js + Express + SQLite + SRS + AI 0đ)
│   ├── src/
│   │   ├── db/                  # Native SQLite & Seed Data
│   │   ├── services/            # SRS SM-2, Dictionary API, Gemini AI Service
│   │   ├── controllers/         # Vocab, Patterns, Notes, SRS, Backup
│   │   └── index.js             # Express Server (Port 5001)
│
├── web/                         # 2. WEB CLIENT (Desktop / Laptop)
│   ├── src/
│   │   ├── components/          # Dashboard, Vocab Vault, Pattern Hub, Smart Reader, Review, AI Lab
│   │   ├── services/            # Audio Pronunciation & Server API Client
│   │   └── App.jsx
│
└── mobile/                      # 3. MOBILE APP (iPhone & Android)
    ├── src/
    │   └── services/            # Mobile API Client
    ├── App.js                   # React Native Expo Mobile App
    └── app.json
```

---

## ⚡ Hướng Dẫn Chạy Ứng Dụng (Quick Start)

### 1. Khởi động Backend Server API (Chạy cổng 5001):
```bash
cd /Users/daf/Documents/lingua-vault/server
npm start
```
*Server sẽ tự động tạo cơ sở dữ liệu SQLite tại `server/data/lingua_vault.db` và nạp sẵn bộ dữ liệu mẫu chất lượng cao.*

---

### 2. Khởi động Web Client (Laptop / Desktop):
Mở một tab terminal mới:
```bash
cd /Users/daf/Documents/lingua-vault/web
npm run dev
```
👉 Truy cập ngay trên trình duyệt: **`http://localhost:3000`**

---

### 3. Khởi động Mobile App trên Điện thoại (iOS / Android):
1. Tải app **Expo Go** miễn phí từ App Store (iPhone) hoặc Google Play (Android).
2. Mở một tab terminal mới:
```bash
cd /Users/daf/Documents/lingua-vault/mobile
npx expo start
```
3. Quét mã QR hiện ra trên màn hình -> App lập tức chạy trên điện thoại của bạn!

---

## 🌟 Các Tính Năng Nổi Bật

1. **Kho Từ Vựng (Vocab Vault)**: 
   - **1-Click Auto-Fill**: Gõ từ -> Tự động điền phiên âm IPA, audio người bản xứ, định nghĩa và câu ví dụ.
2. **Kho Mẫu Câu (Pattern Hub)**:
   - Lưu trữ các công thức ngữ pháp, sắc thái biểu đạt (Formal, Email, Speaking...) và câu ví dụ thực tế.
3. **Trình Đọc Thông Minh (Smart Reader)**:
   - Đọc tài liệu / bài báo -> Bôi đen bất kỳ từ hoặc câu nào -> Menu nổi hiện ra cho phép phát âm, lưu nhanh vào kho từ hoặc gửi sang AI phân tích.
4. **Cỗ Máy Ôn Luyện Chống Quên (SRS SM-2)**:
   - 3 Chế độ: **Flashcard lật thẻ 3D**, **Điền từ vào ngữ cảnh (Cloze)**, **Nghe phát âm phản xạ**.
   - Tự động tính toán ngày ôn kế tiếp theo thuật toán SuperMemo SM-2.
5. **Trợ Lý AI (Gemini Free 0đ)**:
   - Bóc tách câu tiếng Anh dài.
   - Chấm và sửa lỗi ngữ pháp khi bạn tự đặt câu.
   - Sáng tác truyện ngắn 1 phút từ các từ bạn sắp quên hôm nay.
6. **Sao Lưu Dự Phòng (Backup & Restore)**:
   - Xuất / Nhập toàn bộ dữ liệu ra file `.json` chỉ bằng 1 cú click chuột.
