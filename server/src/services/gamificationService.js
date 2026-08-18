import { getDb } from '../db/database.js';

export const LEVEL_LADDER = [
  { level: 1, minXp: 0, maxXp: 200, title: 'Novice Scholar 🌱', perk: 'Khởi đầu hành trình nạp vốn từ vựng' },
  { level: 2, minXp: 200, maxXp: 500, title: 'Lexical Apprentice 🌿', perk: 'Mở khóa phân tích sâu Collocations' },
  { level: 3, minXp: 500, maxXp: 1000, title: 'Vocabulary Explorer 📘', perk: 'Kích hoạt thử thách Quiz Topic nâng cao' },
  { level: 4, minXp: 1000, maxXp: 2000, title: 'Fluent Strategist ⚡', perk: 'Tối ưu hóa tần suất ghi nhớ SM-2' },
  { level: 5, minXp: 2000, maxXp: 3500, title: 'Vault Master 💎', perk: 'Mở khóa huy hiệu Bậc Thầy Kho Từ Vựng' },
  { level: 6, minXp: 3500, maxXp: 5500, title: 'Eloquent Orator 👑', perk: 'Chuyên gia phản xạ đối thoại & Speaking' },
  { level: 7, minXp: 5500, maxXp: 8500, title: 'Linguistic Sage 🔮', perk: 'Tự động sáng tạo truyện ôn tập cá nhân hóa' },
  { level: 8, minXp: 8500, maxXp: 999999, title: 'Linguistic Grandmaster 🏆', perk: 'Danh hiệu tối thượng - Đại Sư Ngôn Ngữ' }
];

export const calculateLevelFromXp = (xp) => {
  const current = LEVEL_LADDER.find(l => xp >= l.minXp && xp < l.maxXp) || LEVEL_LADDER[LEVEL_LADDER.length - 1];
  const nextLevel = LEVEL_LADDER.find(l => l.level === current.level + 1) || current;

  const currentLevelMin = current.minXp;
  const currentLevelMax = current.maxXp;
  const xpIntoLevel = Math.max(0, xp - currentLevelMin);
  const xpNeededForLevel = currentLevelMax - currentLevelMin;
  const progressPercent = Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));

  return {
    level: current.level,
    title: current.title,
    perk: current.perk,
    minXp: current.minXp,
    maxXp: current.maxXp,
    xpIntoLevel,
    xpNeededForLevel,
    progressPercent,
    nextLevel: nextLevel.level,
    nextLevelTitle: nextLevel.title
  };
};

export const gamificationService = {
  // 1. Get User Profile with Gamification details
  getProfile: () => {
    const db = getDb();
    let row = db.prepare("SELECT * FROM user_profile WHERE id = 'default_user'").get();
    
    if (!row) {
      db.prepare(`
        INSERT INTO user_profile (id, total_xp, current_level, title, streak_record, updated_at)
        VALUES ('default_user', 180, 1, 'Novice Scholar 🌱', 1, ?)
      `).run(new Date().toISOString());
      row = db.prepare("SELECT * FROM user_profile WHERE id = 'default_user'").get();
    }

    const levelDetails = calculateLevelFromXp(row.total_xp);

    // Sync title/level if changed
    if (row.current_level !== levelDetails.level || row.title !== levelDetails.title) {
      db.prepare(`
        UPDATE user_profile 
        SET current_level = ?, title = ?, updated_at = ?
        WHERE id = 'default_user'
      `).run(levelDetails.level, levelDetails.title, new Date().toISOString());
    }

    return {
      totalXp: row.total_xp,
      ...levelDetails,
      streakRecord: row.streak_record || 1,
      ladder: LEVEL_LADDER
    };
  },

  // 2. Add XP with reason and check for Level-Up event
  addXp: (amount = 10, reason = 'Hoạt động học tập') => {
    const db = getDb();
    const currentProfile = gamificationService.getProfile();
    const oldLevel = currentProfile.level;

    const newTotalXp = Math.max(0, currentProfile.totalXp + amount);
    const newLevelDetails = calculateLevelFromXp(newTotalXp);

    const leveledUp = newLevelDetails.level > oldLevel;

    db.prepare(`
      UPDATE user_profile 
      SET total_xp = ?, current_level = ?, title = ?, updated_at = ?
      WHERE id = 'default_user'
    `).run(newTotalXp, newLevelDetails.level, newLevelDetails.title, new Date().toISOString());

    return {
      success: true,
      addedXp: amount,
      reason,
      totalXp: newTotalXp,
      oldLevel,
      newLevel: newLevelDetails.level,
      title: newLevelDetails.title,
      leveledUp,
      levelDetails: newLevelDetails
    };
  }
};
