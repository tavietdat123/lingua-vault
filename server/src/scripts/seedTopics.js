import { getDb } from '../db/database.js';

const db = getDb();
console.log('🚀 Running curated topics migration on database...');

const newTopics = [
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
  { id: 'social', name: 'Mối quan hệ & Xã hội', emoji: '🤝', color: '#a855f7', description: 'Tình bạn, gia đình, giao tiếp xã hội, cảm xúc và ứng xử cộng đồng' }
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

let insertedCount = 0;
for (const t of newTopics) {
  insert.run(t.id, t.name, t.emoji, t.color, t.description, now, now);
  insertedCount++;
}

console.log(`✅ Successfully seeded/updated ${insertedCount} curated topics!`);
const all = db.prepare('SELECT id, emoji, name, color FROM topics').all();
console.log(`\n📋 Current total topics in database (${all.length}):`);
all.forEach(t => console.log(`  ${t.emoji} ${t.name} (id: "${t.id}") - ${t.color}`));
