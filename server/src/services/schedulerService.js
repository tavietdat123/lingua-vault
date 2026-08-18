import { getDb } from '../db/database.js';
import { telegramService } from './telegramService.js';

let intervalTimer = null;
let lastMorningSentDate = null;
let lastEveningSentDate = null;

export const schedulerService = {
  start: () => {
    if (intervalTimer) return;

    console.log('⏰ [Scheduler] Telegram Dual-Schedule (Morning Due Recap & Evening Alert) initialized.');

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

        // 1. Morning Spaced Repetition Due Words Reminder (Default 08:30)
        const morningTimeRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_morning_time'").get();
        const morningTargetTime = morningTimeRow?.value || '08:30';

        if (currentTimeStr === morningTargetTime && lastMorningSentDate !== todayDateStr) {
          console.log(`⏰ [Scheduler] Triggering Morning Spaced Repetition Due Words Digest at ${currentTimeStr}...`);
          lastMorningSentDate = todayDateStr;
          const morningResult = await telegramService.sendDueReviewReminder();
          console.log('⏰ [Scheduler] Morning Due Digest result:', morningResult);
        }

        // 2. Evening Daily Goal Progress & Hardcore Alarm Loop
        const eveningTimeRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_reminder_time'").get();
        const eveningTargetTime = eveningTimeRow?.value || '20:00';

        const disciplineRow = db.prepare("SELECT value FROM settings WHERE key = 'discipline_mode'").get();
        const isHardcore = disciplineRow?.value === 'hardcore' || disciplineRow?.value === '1';

        // Check if we hit the primary evening time
        if (currentTimeStr === eveningTargetTime && lastEveningSentDate !== todayDateStr) {
          console.log(`⏰ [Scheduler] Triggering Evening Study Progress Check at ${currentTimeStr}...`);
          lastEveningSentDate = todayDateStr;
          if (isHardcore) {
            await telegramService.sendHardcoreAlarmMessage();
          } else {
            await telegramService.checkAndSendDailyReminder();
          }
        } else if (isHardcore && currentTimeStr > eveningTargetTime && now.getHours() < 24) {
          // Hardcore Mode: Repeat alarm every 10 minutes if goal is not yet met!
          if (now.getMinutes() % 10 === 0 && now.getSeconds() < 60) {
            const progress = telegramService.getDailyProgress();
            if (!progress.isGoalMet) {
              console.log(`🚨 [Scheduler] HARDCORE ALARM repeating at ${currentTimeStr} (Missing ${progress.remaining} words)...`);
              await telegramService.sendHardcoreAlarmMessage();
            }
          }
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
