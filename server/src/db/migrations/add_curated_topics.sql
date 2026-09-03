-- ==============================================================================
-- LINGUA VAULT PRODUCTION DATABASE MIGRATION: ADD TECH & CURATED TOPICS
-- Description: Thêm danh sách đầy đủ 31 chủ đề chuyên sâu (đặc biệt là công nghệ)
-- Safe to run multiple times: Sử dụng INSERT OR IGNORE để chống lỗi trùng ID
-- ==============================================================================

BEGIN TRANSACTION;

-- ==============================================================================
-- 💻 1. MẢNG CÔNG NGHỆ CHUYÊN SÂU (TECH DOMAINS)
-- ==============================================================================

-- 1.1. Trí tuệ Nhân tạo & Học máy (AI & ML)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('ai', 'Trí tuệ Nhân tạo (AI & ML)', '🤖', '#6366f1', 'Mô hình ngôn ngữ lớn (LLM), deep learning, mạng nơ-ron, prompt engineering và thị giác máy tính', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.2. An ninh Mạng & Bảo mật (Cybersecurity)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('cybersecurity', 'An ninh Mạng & Bảo mật', '🛡️', '#dc2626', 'Mật mã học, lỗ hổng bảo mật, tường lửa, pentest, zero trust và phòng chống tấn công mạng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.3. Điện toán Đám mây & DevOps (Cloud & DevOps)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('devops', 'Cloud & DevOps', '☁️', '#0284c7', 'AWS, Azure, Docker, Kubernetes, CI/CD pipeline, hạ tầng dạng mã (IaC) và vi dịch vụ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.4. Dữ liệu Lớn & Phân tích (Big Data & Data Science)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('data', 'Dữ liệu Lớn & Phân tích', '📊', '#0d9488', 'Kho dữ liệu (Data warehouse), ETL pipeline, SQL, phân tích thống kê và trực quan hóa dữ liệu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.5. Kỹ nghệ Phần mềm & Kiến trúc (Software Engineering & Architecture)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('software_eng', 'Kỹ nghệ Phần mềm & Kiến trúc', '⚙️', '#7c3aed', 'Thiết kế hướng đối tượng (OOP), design patterns, refactoring, Clean Architecture và tối ưu thuật toán', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.6. Lập trình Web & Frontend (Web Development & UI/UX)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('web_dev', 'Lập trình Web & Frontend', '🌐', '#ea580c', 'React, Vue, TypeScript, Next.js, API RESTful/GraphQL, Responsive Design và tối ưu hiệu năng web', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.7. Lập trình Ứng dụng Di động (Mobile App Development)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('mobile_dev', 'Lập trình Ứng dụng Di động', '📱', '#16a34a', 'React Native, Flutter, iOS Swift, Android Kotlin, App Store submission và trải nghiệm cảm ứng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.8. Blockchain & Web3 (Blockchain & Decentralized)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('blockchain', 'Blockchain & Web3', '⛓️', '#d97706', 'Hợp đồng thông minh (Smart contracts), tài chính phi tập trung (DeFi), Ethereum và cơ chế đồng thuận', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.9. IoT & Hệ thống Nhúng (IoT & Embedded Systems)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('iot', 'IoT & Hệ thống Nhúng', '📡', '#0891b2', 'Cảm biến, vi điều khiển, tự động hóa, giao thức MQTT và phần cứng kết nối mạng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.10. Quản lý Sản phẩm & Agile (Product Management & Agile)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('product_mgmt', 'Quản lý Sản phẩm & Agile', '🧭', '#be185d', 'Scrum, Sprint, Kanban, User Stories, Product Roadmap, KPI/OKR và MVP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.11. Kiểm thử & Đảm bảo Chất lượng (QA & Software Testing)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('qa_testing', 'Kiểm thử & QA Software', '🧪', '#059669', 'Unit test, integration test, automated testing (Selenium/Cypress), regression test và quản lý lỗi bug', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.12. Mạng Máy tính & Hạ tầng (Computer Networking & Infrastructure)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('networking', 'Mạng Máy tính & Hạ tầng', '🖧', '#4f46e5', 'TCP/IP, DNS, định tuyến (Routing), băng thông (Bandwidth), độ trễ (Latency) và cân bằng tải', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==============================================================================
-- 💼 2. KINH DOANH, TÀI CHÍNH & PHÁP LÝ (BUSINESS & FINANCE)
-- ==============================================================================

-- 2.1. Tài chính & Đầu tư
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('finance', 'Tài chính & Đầu tư', '💰', '#10b981', 'Thuật ngữ ngân hàng, chứng khoán, đầu tư, ngân sách và phân tích tài chính', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.2. Kinh doanh & Khởi nghiệp
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('business', 'Kinh doanh & Khởi nghiệp', '🚀', '#f97316', 'Thương trường, gọi vốn, mô hình kinh doanh, tiếp thị và tăng trưởng doanh nghiệp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.3. Marketing & Truyền thông
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('marketing', 'Marketing & Truyền thông', '📢', '#eab308', 'Quảng cáo, xây dựng thương hiệu, sáng tạo nội dung và truyền thông số', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.4. Pháp lý & Hợp đồng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('legal', 'Pháp lý & Hợp đồng', '⚖️', '#64748b', 'Điều khoản hợp đồng, sở hữu trí tuệ, luật pháp và quy định tuân thủ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==============================================================================
-- 🌍 3. ĐỜI SỐNG, KHOA HỌC & XÃ HỘI (LIFESTYLE & SOCIETY)
-- ==============================================================================

-- 3.1. Sức khỏe & Y tế
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('health', 'Sức khỏe & Y tế', '🩺', '#ef4444', 'Dinh dưỡng, y học, thể lực, thể chất và lối sống lành mạnh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.2. Môi trường & Sinh thái
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('environment', 'Môi trường & Sinh thái', '🌱', '#22c55e', 'Biến đổi khí hậu, năng lượng tái tạo, bảo tồn sinh thái và lối sống xanh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.3. Khoa học & Không gian
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('science', 'Khoa học & Không gian', '🔬', '#3b82f6', 'Vật lý, sinh học, vũ trụ, nghiên cứu học thuật và phát minh khoa học', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.4. Nghệ thuật & Thiết kế
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('art', 'Nghệ thuật & Thiết kế', '🎨', '#d946ef', 'Hội họa, kiến trúc, thiết kế đồ họa/UI-UX, nhiếp ảnh và thẩm mỹ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.5. Ẩm thực & Nhà hàng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('food', 'Ẩm thực & Nhà hàng', '🍽️', '#f43f5e', 'Món ăn, đồ uống, kỹ thuật nấu nướng và văn hóa ẩm thực thế giới', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.6. Giáo dục & Kỹ năng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('education', 'Giáo dục & Kỹ năng', '📚', '#6366f1', 'Phương pháp học tập, đàm phán, thuyết trình và giải quyết vấn đề', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.7. Thể thao & Thể hình
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('sports', 'Thể thao & Thể hình', '⚽', '#14b8a6', 'Các môn thể thao, thi đấu, luyện tập thể thao và giải đấu quốc tế', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.8. Mối quan hệ & Xã hội
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('social', 'Mối quan hệ & Xã hội', '🤝', '#a855f7', 'Tình bạn, gia đình, giao tiếp xã hội, cảm xúc và ứng xử cộng đồng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;
