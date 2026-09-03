-- ==============================================================================
-- LINGUA VAULT PRODUCTION DATABASE MIGRATION: 46 COMPREHENSIVE CURATED TOPICS
-- Bao gồm: 17 Mảng IT Chuyên Sâu, 10 Chủ đề CEFR B1 & B2, 19 Chủ đề Kinh Doanh & Đời Sống
-- An toàn 100%: Dùng INSERT OR IGNORE, chạy lặp lại không bao giờ bị lỗi trùng ID
-- ==============================================================================

BEGIN TRANSACTION;

-- ==============================================================================
-- 💻 1. MẢNG CÔNG NGHỆ & IT CHUYÊN SÂU (17 TECH DOMAINS)
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

-- 1.13. Cơ sở Dữ liệu & Tối ưu SQL (Database Systems & SQL Optimization)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('database_systems', 'Cơ sở Dữ liệu & Tối ưu SQL', '🗄️', '#0284c7', 'PostgreSQL, MySQL, NoSQL, MongoDB, Redis, lập chỉ mục (Indexing), truy vấn và tối ưu hóa DB', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.14. Hệ thống Phân tán & Vi dịch vụ (Distributed Systems & Microservices)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('system_architecture', 'Hệ thống Phân tán & Vi dịch vụ', '🏗️', '#4f46e5', 'Kafka, RabbitMQ, Event-driven architecture, CAP theorem, sharding, replication và fault-tolerance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.15. Lập trình Backend & API (Backend Engineering)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('backend_dev', 'Lập trình Backend & API', '💻', '#16a34a', 'Node.js, Go, Python, Java Spring, RESTful API, gRPC, JWT Authentication và bộ nhớ đệm Cache', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.16. Đồ họa & Lập trình Game (Game Development & Graphics)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('game_dev', 'Đồ họa & Lập trình Game', '🎮', '#d946ef', 'Unity, Unreal Engine, Rendering pipeline, Shader, vật lý game và mô hình không gian 3D', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 1.17. Lập trình Nhúng & Vi mạch (Embedded & Firmware Engineering)
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('embedded_firmware', 'Lập trình Nhúng & Vi mạch', '⚡', '#eab308', 'C/C++, Assembly, vi điều khiển ARM/RISC-V, RTOS, Driver phần cứng và giao tiếp SPI/I2C', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==============================================================================
-- 🎓 2. CHỦ ĐỀ CEFR B1 (INTERMEDIATE FOUNDATIONS - 5 CHỦ ĐỀ)
-- ==============================================================================

-- 2.1. Giao tiếp Công sở B1
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b1_workplace', 'Giao tiếp Công sở B1', '💼', '#0284c7', 'Email công sở, trao đổi với đồng nghiệp, họp định kỳ và lập kế hoạch làm việc (Cấp độ B1)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.2. Đời sống & Nhà cửa B1
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b1_daily_life', 'Đời sống & Nhà cửa B1', '🏠', '#10b981', 'Thuê nhà, việc nhà, mua sắm hàng ngày, hóa đơn và các tiện ích sinh hoạt (Cấp độ B1)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.3. Du lịch & Giải trí B1
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b1_travel_leisure', 'Du lịch & Giải trí B1', '🧳', '#f59e0b', 'Đặt vé, hỏi đường, phương tiện công cộng, sở thích cuối tuần và giải trí (Cấp độ B1)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.4. Tính cách & Bạn bè B1
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b1_personal_relations', 'Tính cách & Bạn bè B1', '😊', '#ec4899', 'Mô tả ngoại hình, tính cách con người, kết bạn và duy trì mối quan hệ (Cấp độ B1)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2.5. Dịch vụ & Mua sắm B1
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b1_shopping_services', 'Dịch vụ & Mua sắm B1', '🛍️', '#06b6d4', 'Đi chợ, thanh toán, đổi trả hàng, dịch vụ bảo hành và ăn uống tại quán (Cấp độ B1)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==============================================================================
-- 🎓 3. CHỦ ĐỀ CEFR B2 (UPPER-INTERMEDIATE MASTERY - 5 CHỦ ĐỀ)
-- ==============================================================================

-- 3.1. Tranh biện & Thuyết phục B2
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b2_debate_persuasion', 'Tranh biện & Thuyết phục B2', '🗣️', '#8b5cf6', 'Lập luận, phản biện, diễn đạt quan điểm cá nhân, thuyết phục và thỏa hiệp (Cấp độ B2)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.2. Toàn cầu hóa & Xã hội B2
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b2_global_issues', 'Toàn cầu hóa & Xã hội B2', '🌍', '#3b82f6', 'Kinh tế thế giới, biến đổi xã hội, đô thị hóa, di cư và hội nhập văn hóa (Cấp độ B2)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.3. Truyền thông & Đạo đức B2
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b2_media_tech_ethics', 'Truyền thông & Đạo đức B2', '📰', '#f97316', 'Báo chí, mạng xã hội, tin tức giả, quyền riêng tư và đạo đức công nghệ (Cấp độ B2)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.4. Viết Học thuật & Báo cáo B2
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b2_academic_writing', 'Viết Học thuật & Báo cáo B2', '📝', '#a855f7', 'Cấu trúc bài luận, từ nối học thuật, phân tích biểu đồ và viết báo cáo chuyên sâu (Cấp độ B2)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3.5. Đàm phán & Thương thuyết B2
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('b2_business_negotiation', 'Đàm phán & Thương thuyết B2', '🤝', '#059669', 'Chiến lược thương thảo hợp đồng, giải quyết xung đột lợi ích và quản trị rủi ro (Cấp độ B2)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==============================================================================
-- 💼 4. KINH DOANH, ĐỜI SỐNG & HỌC THUẬT NỀN TẢNG (19 CHỦ ĐỀ)
-- ==============================================================================

-- 4.1. Công việc & Sự nghiệp
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('work', 'Công việc & Sự nghiệp', '💼', '#0284c7', 'Từ vựng đàm phán, phỏng vấn, email công việc và quản lý dự án', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.2. Công nghệ & Kỹ thuật
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('tech', 'Công nghệ & Kỹ thuật', '💻', '#8b5cf6', 'Thuật ngữ IT tổng hợp, lập trình, trí tuệ nhân tạo và chuyển đổi số', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.3. Tài chính & Đầu tư
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('finance', 'Tài chính & Đầu tư', '💰', '#10b981', 'Thuật ngữ ngân hàng, chứng khoán, đầu tư, ngân sách và phân tích tài chính', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.4. Kinh doanh & Khởi nghiệp
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('business', 'Kinh doanh & Khởi nghiệp', '🚀', '#f97316', 'Thương trường, gọi vốn, mô hình kinh doanh, tiếp thị và tăng trưởng doanh nghiệp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.5. Marketing & Truyền thông
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('marketing', 'Marketing & Truyền thông', '📢', '#eab308', 'Quảng cáo, xây dựng thương hiệu, sáng tạo nội dung và truyền thông số', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.6. Pháp lý & Hợp đồng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('legal', 'Pháp lý & Hợp đồng', '⚖️', '#64748b', 'Điều khoản hợp đồng, sở hữu trí tuệ, luật pháp và quy định tuân thủ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.7. Sức khỏe & Y tế
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('health', 'Sức khỏe & Y tế', '🩺', '#ef4444', 'Dinh dưỡng, y học, thể lực, thể chất và lối sống lành mạnh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.8. Môi trường & Sinh thái
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('environment', 'Môi trường & Sinh thái', '🌱', '#22c55e', 'Biến đổi khí hậu, năng lượng tái tạo, bảo tồn sinh thái và lối sống xanh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.9. Khoa học & Không gian
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('science', 'Khoa học & Không gian', '🔬', '#3b82f6', 'Vật lý, sinh học, vũ trụ, nghiên cứu học thuật và phát minh khoa học', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.10. Nghệ thuật & Thiết kế
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('art', 'Nghệ thuật & Thiết kế', '🎨', '#d946ef', 'Hội họa, kiến trúc, thiết kế đồ họa/UI-UX, nhiếp ảnh và thẩm mỹ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.11. Ẩm thực & Nhà hàng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('food', 'Ẩm thực & Nhà hàng', '🍽️', '#f43f5e', 'Món ăn, đồ uống, kỹ thuật nấu nướng và văn hóa ẩm thực thế giới', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.12. Giáo dục & Kỹ năng
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('education', 'Giáo dục & Kỹ năng', '📚', '#6366f1', 'Phương pháp học tập, đàm phán, thuyết trình và giải quyết vấn đề', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.13. Thể thao & Thể hình
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('sports', 'Thể thao & Thể hình', '⚽', '#14b8a6', 'Các môn thể thao, thi đấu, luyện tập thể thao và giải đấu quốc tế', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.14. Mối quan hệ & Xã hội
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('social', 'Mối quan hệ & Xã hội', '🤝', '#a855f7', 'Tình bạn, gia đình, giao tiếp xã hội, cảm xúc và ứng xử cộng đồng', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.15. Học thuật & IELTS
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('ielts', 'Học thuật & IELTS', '🎓', '#ec4899', 'Từ vựng Band 7.0-8.5+, bài luận học thuật và viết thư', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.16. Giao tiếp Hàng ngày
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('daily', 'Giao tiếp Hàng ngày', '☕', '#10b981', 'Từ ngữ đời sống, giao tiếp tự nhiên, quán xá và sinh hoạt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.17. Du lịch & Văn hóa
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('travel', 'Du lịch & Văn hóa', '✈️', '#f59e0b', 'Hàng không, khách sạn, ẩm thực và khám phá thế giới', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4.18. Tâm lý & Tư duy
INSERT OR IGNORE INTO topics (id, name, emoji, color, description, created_at, updated_at)
VALUES ('mindset', 'Tâm lý & Tư duy', '🧠', '#06b6d4', 'Phát triển bản thân, triết học, tư duy phản biện và cảm xúc', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;
