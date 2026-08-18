import { getDb } from '../db/database.js';

export const telegramService = {
  // 1. Send an arbitrary HTML message to Telegram Chat
  sendMessage: async (botToken, chatId, text) => {
    if (!botToken || !chatId) {
      throw new Error('Telegram Bot Token và Chat ID không được để trống.');
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Lỗi gửi tin nhắn Telegram');
    }

    return result;
  },

  // 2. Send instant verification test message
  sendTestMessage: async (botToken, chatId) => {
    const text = `
✨ <b>LINGUAVAULT • KẾT NỐI TELEGRAM THÀNH CÔNG!</b>

👋 Xin chào! Bot thông báo học tập của bạn đã được kích hoạt thành công.

🎯 <b>Tính năng tự động:</b>
• Theo dõi mục tiêu học từ vựng mỗi ngày.
• Tự động nhắc nhở khi chưa hoàn thành chỉ tiêu trước giờ hẹn.
• Bảo vệ chuỗi ngày học <b>Daily Streak 🔥</b> không bị đứt đoạn.

<i>Chúc bạn có những buổi học tiếng Anh hiệu quả cùng LinguaVault! 🚀</i>
    `.trim();

    return await telegramService.sendMessage(botToken, chatId, text);
  },

  // 3. Get Today's Study Progress & Due Words List
  getDailyProgress: () => {
    const db = getDb();
    
    // Get daily goal from settings
    const goalRow = db.prepare("SELECT value FROM settings WHERE key = 'daily_word_goal'").get();
    const dailyGoal = goalRow ? parseInt(goalRow.value, 10) || 10 : 10;

    // Get count of items reviewed or added today
    const todayStr = new Date().toISOString().slice(0, 10);
    const studyLogRow = db.prepare("SELECT reviews_count, new_words_count FROM study_logs WHERE date = ?").get(todayStr);

    const wordsAddedTodayRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM words 
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `).get();

    const streakRow = db.prepare("SELECT value FROM settings WHERE key = 'streak'").get();
    const streak = streakRow ? parseInt(streakRow.value, 10) || 0 : 0;

    // Get Due Words for review
    const dueWords = db.prepare(`
      SELECT id, word, phonetic, part_of_speech, meaning_vi, examples, interval, repetition
      FROM words 
      WHERE due_date <= ? 
      ORDER BY repetition ASC, due_date ASC
      LIMIT 5
    `).all(todayStr).map(w => ({
      ...w,
      examples: JSON.parse(w.examples || '[]')
    }));

    const totalDueRow = db.prepare(`
      SELECT COUNT(*) as count FROM words WHERE due_date <= ?
    `).get(todayStr);

    const totalStudiedToday = (studyLogRow?.reviews_count || 0) + (wordsAddedTodayRow?.count || 0);

    return {
      dailyGoal,
      studiedToday: totalStudiedToday,
      isGoalMet: totalStudiedToday >= dailyGoal,
      remaining: Math.max(0, dailyGoal - totalStudiedToday),
      streak,
      dueWords,
      totalDueCount: totalDueRow?.count || 0
    };
  },

  // 4. Send Morning Spaced Repetition Due Reminder (Ôn tập từ cũ)
  sendDueReviewReminder: async (force = false) => {
    const db = getDb();
    
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_enabled'").get();
    const isEnabled = enabledRow?.value === 'true' || enabledRow?.value === '1';

    if (!isEnabled && !force) {
      return { skipped: true, reason: 'Telegram notification disabled in settings' };
    }

    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    const progress = telegramService.getDailyProgress();
    const { dueWords, totalDueCount } = progress;

    if (totalDueCount === 0 && !force) {
      return { skipped: true, reason: 'No due words to review today' };
    }

    // Build Word Cards for Telegram Message
    let wordListText = '';
    if (dueWords && dueWords.length > 0) {
      wordListText = dueWords.map((w, idx) => {
        const example = w.examples && w.examples.length > 0 ? `\n   <i>"${w.examples[0]}"</i>` : '';
        const ipa = w.phonetic ? ` <code>${w.phonetic}</code>` : '';
        const pos = w.part_of_speech ? ` (${w.part_of_speech})` : '';
        return `<b>${idx + 1}. ${w.word.toUpperCase()}</b>${ipa}${pos}\n   🇻🇳 <b>Nghĩa:</b> ${w.meaning_vi}${example}`;
      }).join('\n\n');
    } else {
      wordListText = '<i>(Hiện tại bạn đã ôn hết toàn bộ từ cũ! Rất xuất sắc 🌟)</i>';
    }

    const message = `
🧠 <b>ÔN TẬP TỪ CŨ • SPICED REPETITION (SM-2)</b>

👋 Chào bạn! Hôm nay có <b>${totalDueCount} từ vựng</b> đã đến chu kỳ ôn tập vàng để chống lãng quên:

${wordListText}

━━━━━━━━━━━━━━━━━━━━
💡 <i>Dành 3 phút lướt qua để củng cố trí nhớ dài hạn (Long-term Memory) nhé!</i>

👉 <b>Mở App Ôn Tập Ngay:</b> <a href="http://localhost:3000">LinguaVault Flashcard Hub</a>
    `.trim();

    const result = await telegramService.sendMessage(botToken, chatId, message);

    return {
      success: true,
      sent: true,
      totalDueCount,
      dueWords,
      result
    };
  },

  // 5. Check Progress & Send Evening Reminder If Incomplete
  checkAndSendDailyReminder: async (force = false) => {
    const db = getDb();
    
    // Check if Telegram notifications are enabled
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_enabled'").get();
    const isEnabled = enabledRow?.value === 'true' || enabledRow?.value === '1';

    if (!isEnabled && !force) {
      return { skipped: true, reason: 'Telegram notification disabled in settings' };
    }

    const tokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();

    const botToken = tokenRow?.value;
    const chatId = chatRow?.value;

    if (!botToken || !chatId) {
      return { skipped: true, reason: 'Missing bot token or chat ID' };
    }

    const progress = telegramService.getDailyProgress();

    // If goal is already met, no need to alert
    if (progress.isGoalMet && !force) {
      return {
        success: true,
        sent: false,
        reason: 'Daily goal already met'
      };
    }

    // Include 2 sample due words if available
    let dueHint = '';
    if (progress.dueWords && progress.dueWords.length > 0) {
      const topWords = progress.dueWords.slice(0, 3).map(w => `• <b>${w.word}</b>: ${w.meaning_vi}`).join('\n');
      dueHint = `\n\n📌 <b>Từ cũ cần ôn gấp tối nay:</b>\n${topWords}`;
    }

    const message = `
⚠️ <b>CẢNH BÁO TIẾN ĐỘ HỌC TẬP • LINGUAVAULT</b>

⏰ Bạn ơi, hôm nay sắp hết ngày rồi mà mục tiêu học tập vẫn chưa đạt:
📊 <b>Tiến độ hôm nay:</b> <code>${progress.studiedToday} / ${progress.dailyGoal} từ</code>
⚡ <b>Còn thiếu:</b> <b>${progress.remaining} từ</b> nữa để hoàn thành!
🔥 <b>Chuỗi hiện tại:</b> <b>${progress.streak} ngày liên tục</b>${dueHint}

💡 <i>Dành 3 phút vào ôn tập Flashcard ngay để bảo vệ chuỗi Streak vàng nhé!</i>

👉 <b>Mở App ngay:</b> <a href="http://localhost:3000">LinguaVault Web Hub</a>
    `.trim();

    const result = await telegramService.sendMessage(botToken, chatId, message);

    return {
      success: true,
      sent: true,
      progress,
      result
    };
  }
};
