-- ==============================================================================
-- LINGUA VAULT PRODUCTION DATABASE MIGRATION: ADD CURATED TOPICS
-- Description: Thêm danh sách các chủ đề từ vựng chuyên sâu vào bảng `topics`
-- Safe to run multiple times: Sử dụng INSERT OR IGNORE để không bị lỗi trùng ID
-- ==============================================================================

BEGIN TRANSACTION;

-- 1. Tài chính & Đầu tư
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('finance', 'Tài chính & Đầu tư', '💰', '#10b981', 'Thuật ngữ ngân hàng, chứng khoán, đầu tư, ngân sách và phân tích tài chính', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Kinh doanh & Khởi nghiệp
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('business', 'Kinh doanh & Khởi nghiệp', '🚀', '#f97316', 'Thương trường, gọi vốn, mô hình kinh doanh, tiếp thị và tăng trưởng doanh nghiệp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. Marketing & Truyền thông
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('marketing', 'Marketing & Truyền thông', '📢', '#eab308', 'Quảng cáo, xây dựng thương hiệu, sáng tạo nội dung và truyền thông số', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Sức khỏe & Y tế
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('health', 'Sức khỏe & Y tế', '🩺', '#ef4444', 'Dinh dưỡng, y học, thể lực, thể chất và lối sống lành mạnh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. Pháp lý & Hợp đồng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('legal', 'Pháp lý & Hợp đồng', '⚖️', '#64748b', 'Điều khoản hợp đồng, sở hữu trí tuệ, luật pháp và quy định tuân thủ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. Môi trường & Sinh thái
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('environment', 'Môi trường & Sinh thái', '🌱', '#22c55e', 'Biến đổi khí hậu, năng lượng tái tạo, bảo tồn sinh thái và lối sống xanh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 7. Khoa học & Không gian
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('science', 'Khoa học & Không gian', '🔬', '#3b82f6', 'Vật lý, sinh học, vũ trụ, nghiên cứu học thuật và phát minh khoa học', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 8. Nghệ thuật & Thiết kế
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('art', 'Nghệ thuật & Thiết kế', '🎨', '#d946ef', 'Hội họa, kiến trúc, thiết kế đồ họa/UI-UX, nhiếp ảnh và thẩm mỹ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 9. Ẩm thực & Nhà hàng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('food', 'Ẩm thực & Nhà hàng', '🍽️', '#f43f5e', 'Món ăn, đồ uống, kỹ thuật nấu nướng và văn hóa ẩm thực thế giới', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 10. Giáo dục & Kỹ năng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('education', 'Giáo dục & Kỹ năng', '📚', '#6366f1', 'Phương pháp học tập, đàm phán, thuyết trình và giải quyết vấn đề', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 11. Thể thao & Thể hình
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('sports', 'Thể thao & Thể hình', '⚽', '#14b8a6', 'Các môn thể thao, thi đấu, luyện tập thể thao và giải đấu quốc tế', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 12. Mối quan hệ & Xã hội
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('social', 'Mối quan hệ & Xã hội', '🤝', '#a855f7', 'Tình bạn, gia đình, giao tiếp xã hội, cảm xúc và ứng xử cộng đồng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;
