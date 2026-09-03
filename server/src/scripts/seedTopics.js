import { getDb } from '../db/database.js';

const db = getDb();
console.log('🚀 Running curated B1, B2 & Advanced IT topics migration on database...');

const allCuratedTopics = [
  // ==============================================================================
  // 💻 1. MẢNG CÔNG NGHỆ & IT CHUYÊN SÂU (ADVANCED IT DOMAINS)
  // ==============================================================================
  { id: 'ai', name: 'Trí tuệ Nhân tạo (AI & ML)', emoji: '🤖', color: '#6366f1', description: 'Mô hình ngôn ngữ lớn (LLM), deep learning, mạng nơ-ron, prompt engineering và thị giác máy tính' },
  { id: 'cybersecurity', name: 'An ninh Mạng & Bảo mật', emoji: '🛡️', color: '#dc2626', description: 'Mật mã học, lỗ hổng bảo mật, tường lửa, pentest, zero trust và phòng chống tấn công mạng' },
  { id: 'devops', name: 'Cloud & DevOps', emoji: '☁️', color: '#0284c7', description: 'AWS, Azure, Docker, Kubernetes, CI/CD pipeline, hạ tầng dạng mã (IaC) và vi dịch vụ' },
  { id: 'data', name: 'Dữ liệu Lớn & Phân tích', emoji: '📊', color: '#0d9488', description: 'Kho dữ liệu (Data warehouse), ETL pipeline, SQL, phân tích thống kê và trực quan hóa dữ liệu' },
  { id: 'software_eng', name: 'Kỹ nghệ Phần mềm & Kiến trúc', emoji: '⚙️', color: '#7c3aed', description: 'Thiết kế hướng đối tượng (OOP), design patterns, refactoring, Clean Architecture và tối ưu thuật toán' },
  { id: 'web_dev', name: 'Lập trình Web & Frontend', emoji: '🌐', color: '#ea580c', description: 'React, Vue, TypeScript, Next.js, API RESTful/GraphQL, Responsive Design và tối ưu hiệu năng web' },
  { id: 'mobile_dev', name: 'Lập trình Ứng dụng Di động', emoji: '📱', color: '#16a34a', description: 'React Native, Flutter, iOS Swift, Android Kotlin, App Store submission và trải nghiệm cảm ứng' },
  { id: 'blockchain', name: 'Blockchain & Web3', emoji: '⛓️', color: '#d97706', description: 'Hợp đồng thông minh (Smart contracts), tài chính phi tập trung (DeFi), Ethereum và cơ chế đồng thuận' },
  { id: 'iot', name: 'IoT & Hệ thống Nhúng', emoji: '📡', color: '#0891b2', description: 'Cảm biến, vi điều khiển, tự động hóa, giao thức MQTT và phần cứng kết nối mạng' },
  { id: 'product_mgmt', name: 'Quản lý Sản phẩm & Agile', emoji: '🧭', color: '#be185d', description: 'Scrum, Sprint, Kanban, User Stories, Product Roadmap, KPI/OKR và MVP' },
  { id: 'qa_testing', name: 'Kiểm thử & QA Software', emoji: '🧪', color: '#059669', description: 'Unit test, integration test, automated testing (Selenium/Cypress), regression test và quản lý lỗi bug' },
  { id: 'networking', name: 'Mạng Máy tính & Hạ tầng', emoji: '🖧', color: '#4f46e5', description: 'TCP/IP, DNS, định tuyến (Routing), băng thông (Bandwidth), độ trễ (Latency) và cân bằng tải' },
  { id: 'database_systems', name: 'Cơ sở Dữ liệu & Tối ưu SQL', emoji: '🗄️', color: '#0284c7', description: 'PostgreSQL, MySQL, NoSQL, MongoDB, Redis, lập chỉ mục (Indexing), truy vấn và tối ưu hóa DB' },
  { id: 'system_architecture', name: 'Hệ thống Phân tán & Vi dịch vụ', emoji: '🏗️', color: '#4f46e5', description: 'Kafka, RabbitMQ, Event-driven architecture, CAP theorem, sharding, replication và fault-tolerance' },
  { id: 'backend_dev', name: 'Lập trình Backend & API', emoji: '💻', color: '#16a34a', description: 'Node.js, Go, Python, Java Spring, RESTful API, gRPC, JWT Authentication và bộ nhớ đệm Cache' },
  { id: 'game_dev', name: 'Đồ họa & Lập trình Game', emoji: '🎮', color: '#d946ef', description: 'Unity, Unreal Engine, Rendering pipeline, Shader, vật lý game và mô hình không gian 3D' },
  { id: 'embedded_firmware', name: 'Lập trình Nhúng & Vi mạch', emoji: '⚡', color: '#eab308', description: 'C/C++, Assembly, vi điều khiển ARM/RISC-V, RTOS, Driver phần cứng và giao tiếp SPI/I2C' },

  // ==============================================================================
  // 🎓 2. CHỦ ĐỀ CEFR B1 (INTERMEDIATE FOUNDATIONS)
  // ==============================================================================
  { id: 'b1_workplace', name: 'Giao tiếp Công sở B1', emoji: '💼', color: '#0284c7', description: 'Email công sở, trao đổi với đồng nghiệp, họp định kỳ và lập kế hoạch làm việc (Cấp độ B1)' },
  { id: 'b1_daily_life', name: 'Đời sống & Nhà cửa B1', emoji: '🏠', color: '#10b981', description: 'Thuê nhà, việc nhà, mua sắm hàng ngày, hóa đơn và các tiện ích sinh hoạt (Cấp độ B1)' },
  { id: 'b1_travel_leisure', name: 'Du lịch & Giải trí B1', emoji: '🧳', color: '#f59e0b', description: 'Đặt vé, hỏi đường, phương tiện công cộng, sở thích cuối tuần và giải trí (Cấp độ B1)' },
  { id: 'b1_personal_relations', name: 'Tính cách & Bạn bè B1', emoji: '😊', color: '#ec4899', description: 'Mô tả ngoại hình, tính cách con người, kết bạn và duy trì mối quan hệ (Cấp độ B1)' },
  { id: 'b1_shopping_services', name: 'Dịch vụ & Mua sắm B1', emoji: '🛍️', color: '#06b6d4', description: 'Đi chợ, thanh toán, đổi trả hàng, dịch vụ bảo hành và ăn uống tại quán (Cấp độ B1)' },

  // ==============================================================================
  // 🎓 3. CHỦ ĐỀ CEFR B2 (UPPER-INTERMEDIATE MASTERY)
  // ==============================================================================
  { id: 'b2_debate_persuasion', name: 'Tranh biện & Thuyết phục B2', emoji: '🗣️', color: '#8b5cf6', description: 'Lập luận, phản biện, diễn đạt quan điểm cá nhân, thuyết phục và thỏa hiệp (Cấp độ B2)' },
  { id: 'b2_global_issues', name: 'Toàn cầu hóa & Xã hội B2', emoji: '🌍', color: '#3b82f6', description: 'Kinh tế thế giới, biến đổi xã hội, đô thị hóa, di cư và hội nhập văn hóa (Cấp độ B2)' },
  { id: 'b2_media_tech_ethics', name: 'Truyền thông & Đạo đức B2', emoji: '📰', color: '#f97316', description: 'Báo chí, mạng xã hội, tin tức giả, quyền riêng tư và đạo đức công nghệ (Cấp độ B2)' },
  { id: 'b2_academic_writing', name: 'Viết Học thuật & Báo cáo B2', emoji: '📝', color: '#a855f7', description: 'Cấu trúc bài luận, từ nối học thuật, phân tích biểu đồ và viết báo cáo chuyên sâu (Cấp độ B2)' },
  { id: 'b2_business_negotiation', name: 'Đàm phán & Thương thuyết B2', emoji: '🤝', color: '#059669', description: 'Chiến lược thương thảo hợp đồng, giải quyết xung đột lợi ích và quản trị rủi ro (Cấp độ B2)' },

  // ==============================================================================
  // 💼 4. KINH DOANH, ĐỜI SỐNG & HỌC THUẬT NỀN TẢNG
  // ==============================================================================
  { id: 'work', name: 'Công việc & Sự nghiệp', emoji: '💼', color: '#0284c7', description: 'Từ vựng đàm phán, phỏng vấn, email công việc và quản lý dự án' },
  { id: 'tech', name: 'Công nghệ & Kỹ thuật', emoji: '💻', color: '#8b5cf6', description: 'Thuật ngữ IT tổng hợp, lập trình, trí tuệ nhân tạo và chuyển đổi số' },
  { id: 'finance', name: 'Tài chính & Đầu tư', emoji: '💰', color: '#10b981', description: 'Thuật ngữ ngân hàng, chứng khoán, đầu tư, ngân sách và phân tích tài chính' },
  { id: 'business', name: 'Kinh doanh & Khởi nghiệp', emoji: '🚀', color: '#f97316', description: 'Thương trường, gọi vốn, mô hình kinh doanh, tiếp thị và tăng trưởng doanh nghiệp' },
  { id: 'marketing', name: 'Marketing & Truyền thông', emoji: '📢', color: '#eab308', description: 'Quảng cáo, xây dựng thương hiệu, sáng tạo nội dung và truyền thông số' },
  { id: 'health', name: 'Sức khỏe & Y tế', emoji: '🩺', color: '#ef4444', description: 'Dinh dưỡng, y học, thể lực, thể chất và lối sống lành mạnh' },
  { id: 'legal', name: 'Pháp lý & Hợp đồng', emoji: '⚖️', color: '#64748b', description: 'Điều khoản hợp đồng, sở hữu trí tuệ, luật pháp và quy định tuân thủ' },
  { id: 'environment', name: 'Môi trường & Sinh thái', emoji: '🌱', color: '#22c55e', description: 'Biến đổi khí hậu, năng lượng tái tạo, bảo tồn sinh thái và lối sống xanh' },
  { id: 'science', name: 'Khoa học & Không gian', emoji: '🔬', color: '#3b82f6', description: 'Vật lý, sinh học, vũ trụ, nghiên cứu học thuật và phát minh khoa học' },
  { id: 'art', name: 'Nghệ thuật & Thiết kế', emoji: '🎨', color: '#d946ef', description: 'Hội họa, kiến trúc, thiết kế đồ họa/UI-UX, nhiếp ảnh và thẩm mỹ' },
  { id: 'food', name: 'Ẩm thực & Nhà hàng', emoji: '🍽️', color: '#f43f5e', description: 'Món ăn, đồ uống, kỹ thuật nấu nướng và văn hóa ẩm thực thế giới' },
  { id: 'education', name: 'Giáo dục & Kỹ năng', emoji: '📚', color: '#6366f1', description: 'Phương pháp học tập, đàm phán, thuyết trình và giải quyết vấn đề' },
  { id: 'sports', name: 'Thể thao & Thể hình', emoji: '⚽', color: '#14b8a6', description: 'Các môn thể thao, thi đấu, luyện tập thể thao và giải đấu quốc tế' },
  { id: 'social', name: 'Mối quan hệ & Xã hội', emoji: '🤝', color: '#a855f7', description: 'Tình bạn, gia đình, giao tiếp xã hội, cảm xúc và ứng xử cộng đồng' },
  { id: 'ielts', name: 'Học thuật & IELTS', emoji: '🎓', color: '#ec4899', description: 'Từ vựng Band 7.0-8.5+, bài luận học thuật và viết thư' },
  { id: 'daily', name: 'Giao tiếp Hàng ngày', emoji: '☕', color: '#10b981', description: 'Từ ngữ đời sống, giao tiếp tự nhiên, quán xá và sinh hoạt' },
  { id: 'travel', name: 'Du lịch & Văn hóa', emoji: '✈️', color: '#f59e0b', description: 'Hàng không, khách sạn, ẩm thực và khám phá thế giới' },
  { id: 'mindset', name: 'Tâm lý & Tư duy', emoji: '🧠', color: '#06b6d4', description: 'Phát triển bản thân, triết học, tư duy phản biện và cảm xúc' }
];

const now = new Date().toISOString();
const insert = db.prepare(`
  INSERT INTO topics (id, name, emoji, color, description, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    emoji = excluded.emoji,
    color = excluded.color,
    description = excluded.description,
    updated_at = excluded.updated_at
`);

let count = 0;
for (const t of allCuratedTopics) {
  insert.run(t.id, t.name, t.emoji, t.color, t.description, now, now);
  count++;
}

console.log(`✅ Successfully seeded/updated ${count} topics!`);
const all = db.prepare('SELECT id, emoji, name, color FROM topics ORDER BY created_at ASC').all();
console.log(`\n📋 Current total topics in database (${all.length}):`);
all.forEach(t => console.log(`  ${t.emoji} ${t.name} (id: "${t.id}") - ${t.color}`));
