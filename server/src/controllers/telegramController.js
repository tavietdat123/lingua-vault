import { getDb } from '../db/database.js';
import { telegramService } from '../services/telegramService.js';

export const telegramController = {
  // GET /api/telegram/settings
  getSettings: (req, res) => {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT key, value FROM settings 
        WHERE key IN ('telegram_bot_token', 'telegram_chat_id', 'telegram_enabled', 'daily_word_goal', 'telegram_reminder_time')
      `).all();

      const settings = {
        telegram_bot_token: '',
        telegram_chat_id: '',
        telegram_enabled: false,
        daily_word_goal: 10,
        telegram_reminder_time: '20:00'
      };

      rows.forEach(r => {
        if (r.key === 'telegram_enabled') {
          settings[r.key] = r.value === 'true' || r.value === '1';
        } else if (r.key === 'daily_word_goal') {
          settings[r.key] = parseInt(r.value, 10) || 10;
        } else {
          settings[r.key] = r.value || '';
        }
      });

      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/settings
  saveSettings: (req, res) => {
    try {
      const db = getDb();
      const { 
        telegram_bot_token, 
        telegram_chat_id, 
        telegram_enabled, 
        daily_word_goal, 
        telegram_reminder_time 
      } = req.body;

      const upsert = db.prepare(`
        INSERT INTO settings (key, value) 
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `);

      if (telegram_bot_token !== undefined) upsert.run('telegram_bot_token', String(telegram_bot_token));
      if (telegram_chat_id !== undefined) upsert.run('telegram_chat_id', String(telegram_chat_id));
      if (telegram_enabled !== undefined) upsert.run('telegram_enabled', String(telegram_enabled));
      if (daily_word_goal !== undefined) upsert.run('daily_word_goal', String(daily_word_goal));
      if (telegram_reminder_time !== undefined) upsert.run('telegram_reminder_time', String(telegram_reminder_time));

      res.json({ success: true, message: 'Đã lưu cấu hình Mục tiêu & Telegram thành công!' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/test
  sendTest: async (req, res) => {
    try {
      const { telegram_bot_token, telegram_chat_id } = req.body;
      const result = await telegramService.sendTestMessage(telegram_bot_token, telegram_chat_id);
      res.json({ success: true, message: 'Đã gửi tin nhắn thử nghiệm thành công!', data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },

  // GET /api/telegram/progress
  getProgress: (req, res) => {
    try {
      const progress = telegramService.getDailyProgress();
      res.json({ success: true, data: progress });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/telegram/trigger-reminder
  triggerReminder: async (req, res) => {
    try {
      const result = await telegramService.checkAndSendDailyReminder(true);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
};
