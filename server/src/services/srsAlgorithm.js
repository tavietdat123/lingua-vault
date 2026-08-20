/**
 * Spaced Repetition System (SRS) using Enhanced SuperMemo SM-2+ Multi-Milestone Algorithm
 * Designed with granular cognitive retention stages:
 * Stage 0: Intra-day Recall (< 10 mins)
 * Stage 1: 1 Day
 * Stage 2: 3 Days
 * Stage 3: 7 Days (1 Week)
 * Stage 4: 14 Days (2 Weeks)
 * Stage 5: 30 Days (1 Month)
 * Stage 6: 60 Days (2 Months) - Mastered
 * Stage 7: 120 Days (4 Months)
 * Stage 8: 240+ Days (Perpetual Memory)
 */

export const GRADE = {
  AGAIN: 'again',   // 1: Quên / Cần lặp lại (< 10 phút)
  HARD: 'hard',     // 3: Nhớ nhưng khó khăn / Ngập ngừng
  GOOD: 'good',     // 4: Nhớ tốt với nỗ lực vừa phải
  EASY: 'easy'      // 5: Nhớ hoàn hảo, tức thì
};

const GRADE_NUMERIC = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5
};

// Multi-Milestone Distinct Progression Ladders (in Days)
const HARD_LADDER = [1, 2, 4, 8, 16, 32, 64, 120];
const GOOD_LADDER = [3, 7, 14, 30, 60, 120, 240, 365];
const EASY_LADDER = [7, 14, 30, 60, 120, 240, 365, 365];

/**
 * Format interval to human-readable Vietnamese string
 */
export function formatIntervalText(days, isIntraDay = false) {
  if (isIntraDay || days === 0) return '< 10 phút';
  if (days === 1) return '1 ngày';
  if (days < 30) return `${days} ngày`;
  if (days < 60) return `${Math.round(days / 30)} tháng`;
  if (days < 365) return `${Math.round(days / 30)} tháng`;
  return `${(days / 365).toFixed(1)} năm`;
}

/**
 * Previews what next interval would be for all 4 ratings
 */
export function previewNextIntervals(item = {}) {
  const rep = item.repetition || 0;
  const ef = item.ease_factor || item.easeFactor || 2.5;

  // 1. Again
  const againDays = 0;
  const againText = '< 10 phút';

  // 2. Hard
  let hardDays = rep < HARD_LADDER.length ? HARD_LADDER[rep] : Math.round((item.interval || 1) * 1.2);
  hardDays = Math.min(365, Math.max(1, hardDays));
  const hardText = formatIntervalText(hardDays);

  // 3. Good
  let goodDays = rep < GOOD_LADDER.length ? GOOD_LADDER[rep] : Math.round((item.interval || 1) * ef);
  goodDays = Math.min(365, Math.max(hardDays + 1, goodDays));
  const goodText = formatIntervalText(goodDays);

  // 4. Easy
  let easyDays = rep < EASY_LADDER.length ? EASY_LADDER[rep] : Math.round((item.interval || 1) * ef * 1.3);
  easyDays = Math.min(365, Math.max(goodDays + 2, easyDays));
  const easyText = formatIntervalText(easyDays);

  return {
    again: { days: againDays, text: againText, nextRep: 0, nextStatus: 'learning' },
    hard: { days: hardDays, text: hardText, nextRep: rep + 1, nextStatus: rep >= 4 ? 'mastered' : 'reviewing' },
    good: { days: goodDays, text: goodText, nextRep: rep + 1, nextStatus: rep >= 4 ? 'mastered' : 'reviewing' },
    easy: { days: easyDays, text: easyText, nextRep: rep + 1, nextStatus: rep >= 3 ? 'mastered' : 'reviewing' }
  };
}

/**
 * Calculates next review parameters based on current card state and user rating.
 */
export function calculateNextSRS(item = {}, rating = 'good') {
  let repetition = item.repetition || 0;
  let interval = item.interval || 0;
  let easeFactor = item.easeFactor || item.ease_factor || 2.5;
  const q = GRADE_NUMERIC[rating] || 4;

  // 1. Calculate new Ease Factor (EF)
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // Min limit in SM-2

  let isIntraDay = false;

  // 2. Calculate next Interval based on Granular Ladders
  if (q < 3) {
    // Failed recall (Again) -> Reset repetitions, queue for intra-day review
    repetition = 0;
    interval = 0; // Due today / in same session
    isIntraDay = true;
  } else if (rating === GRADE.HARD) {
    interval = repetition < HARD_LADDER.length ? HARD_LADDER[repetition] : Math.round(interval * 1.2);
    repetition += 1;
  } else if (rating === GRADE.EASY) {
    interval = repetition < EASY_LADDER.length ? EASY_LADDER[repetition] : Math.round(interval * easeFactor * 1.3);
    repetition += 1;
  } else {
    // Good
    interval = repetition < GOOD_LADDER.length ? GOOD_LADDER[repetition] : Math.round(interval * easeFactor);
    repetition += 1;
  }

  // Clamp interval safely between 0 and 365 days
  interval = Math.min(365, Math.max(0, parseInt(interval, 10) || 0));

  // 3. Calculate Due Date (YYYY-MM-DD)
  const now = new Date();
  let nextDate;
  if (interval === 0) {
    // Same day review (e.g. 10 minutes later)
    nextDate = new Date(now.getTime() + 10 * 60 * 1000);
  } else {
    nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  }
  const dueDate = nextDate.toISOString().split('T')[0];

  // 4. Determine Mastery Status based on Multi-Milestone Ladder
  let status = 'learning';
  if (repetition === 0) {
    status = 'learning';
  } else if (interval >= 45 || repetition >= 5) {
    status = 'mastered';
  } else if (repetition >= 1) {
    status = 'reviewing';
  }

  return {
    repetition,
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    dueDate,
    due_date: dueDate,
    status,
    isIntraDay,
    intervalText: formatIntervalText(interval, isIntraDay),
    lastReviewedAt: new Date().toISOString()
  };
}

/**
 * Checks if an item is due for review today or overdue.
 */
export function isDueToday(dueDate) {
  if (!dueDate) return true;
  const todayStr = new Date().toISOString().split('T')[0];
  return dueDate <= todayStr;
}
