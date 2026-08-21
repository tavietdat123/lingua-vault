# =========================================================================
# STAGE 1: Build Frontend Web SPA (React 19 + Vite + Tailwind CSS)
# =========================================================================
FROM node:20-alpine AS web-builder

WORKDIR /app/web

# Cài đặt dependencies cho Frontend Web
COPY web/package*.json ./
RUN npm install

# Sao chép mã nguồn Frontend và tiến hành Build
COPY web/ ./
RUN npm run build

# =========================================================================
# STAGE 2: Production Server (Node.js 20 Express + SQLite + Gemini AI)
# =========================================================================
FROM node:20-alpine AS production

# Cài đặt timezone data
RUN apk add --no-cache tzdata

WORKDIR /app

# 1. Cài đặt dependencies cho Backend Server
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# 2. Sao chép mã nguồn Backend Server
COPY server/ ./server/

# 3. Sao chép bản build tĩnh Frontend Web từ Stage 1
COPY --from=web-builder /app/web/dist ./web/dist

# 4. Tạo thư mục lưu trữ cơ sở dữ liệu SQLite
RUN mkdir -p /app/server/data

# 5. Cấu hình biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=5001

WORKDIR /app/server

# Mở cổng API nội bộ
EXPOSE 5001

# Khởi chạy Express Server
CMD ["node", "src/index.js"]
