import { getDb } from '../db/database.js';
import { telegramService } from './telegramService.js';

let intervalTimer = null;
let lastSentDate = null;

export const schedulerService = {
  start: () => {
    if (intervalTimer) return;

    console.log('⏰ [Scheduler] Telegram Daily Reminder Scheduler initialized.');

    // Check every 60 seconds
    intervalTimer = setInterval(async () => {
      try {
        const db = getDb();
        const now = new Date();
        
        // Format current HH:MM in local time
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        const todayDateStr = now.toISOString().slice(0, 10);

        // Get configured reminder time (default 20:00)
        const timeRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_reminder_time'").get();
        const targetTime = timeRow?.value || '20:00';

        // Check if we reached the target time and haven't sent today yet
        if (currentTimeStr === targetTime && lastSentDate !== todayDateStr) {
          console.log(`⏰ [Scheduler] Triggering daily study reminder check at ${currentTimeStr}...`);
          lastSentDate = todayDateStr;
          
          const result = await telegramService.checkAndSendDailyReminder();
          console.log('⏰ [Scheduler] Reminder result:', result);
        }
      } catch (err) {
        console.error('⏰ [Scheduler Error]:', err.message);
      }
    }, 60 * 1000);
  },

  stop: () => {
    if (intervalTimer) {
      clearInterval(intervalTimer);
      intervalTimer = null;
    }
  }
};
