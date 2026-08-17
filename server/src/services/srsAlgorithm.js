/**
 * Spaced Repetition System (SRS) using SuperMemo SM-2 Algorithm
 */

export const GRADE = {
  AGAIN: 'again',   // 0: Complete blackout / incorrect
  HARD: 'hard',     // 3: Correct response after hesitation
  GOOD: 'good',     // 4: Correct response with reasonable effort
  EASY: 'easy'      // 5: Perfect recall, effortless
};

const GRADE_NUMERIC = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5
};

/**
 * Calculates next review parameters based on current card state and user rating.
 * 
 * @param {Object} item - Current item SRS state { repetition, interval, easeFactor }
 * @param {string} rating - 'again' | 'hard' | 'good' | 'easy'
 * @returns {Object} { repetition, interval, easeFactor, dueDate, status }
 */
export function calculateNextSRS(item = {}, rating = 'good') {
  let repetition = item.repetition || 0;
  let interval = item.interval || 0;
  let easeFactor = item.easeFactor || 2.5;
  const q = GRADE_NUMERIC[rating] || 4;

  // 1. Calculate new Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3; // Min limit in SM-2

  // 2. Calculate next Interval and Repetitions
  if (q < 3) {
    // Failed recall (Again) -> Reset repetitions, review again tomorrow
    repetition = 0;
    interval = 1;
  } else {
    // Successful recall (Hard, Good, Easy)
    if (repetition === 0) {
      if (rating === GRADE.EASY) {
        interval = 4; // Instant bonus for very easy new card
      } else if (rating === GRADE.HARD) {
        interval = 1;
      } else {
        interval = 1;
      }
    } else if (repetition === 1) {
      interval = rating === GRADE.HARD ? 3 : (rating === GRADE.EASY ? 7 : 4);
    } else {
      let multiplier = easeFactor;
      if (rating === GRADE.HARD) multiplier = 1.2;
      if (rating === GRADE.EASY) multiplier = easeFactor * 1.3;
      
      interval = Math.round(interval * multiplier);
    }
    repetition += 1;
  }

  // 3. Calculate Due Date (YYYY-MM-DD)
  const now = new Date();
  const nextDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  const dueDate = nextDate.toISOString().split('T')[0];

  // 4. Determine Mastery Status
  let status = 'learning';
  if (repetition === 0) {
    status = 'learning';
  } else if (repetition >= 5 && interval >= 21) {
    status = 'mastered';
  } else if (repetition >= 1) {
    status = 'reviewing';
  }

  return {
    repetition,
    interval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    dueDate,
    status,
    lastReviewedAt: new Date().toISOString()
  };
}

/**
 * Checks if an item is due for review today or overdue.
 * @param {string} dueDate - YYYY-MM-DD
 * @returns {boolean}
 */
export function isDueToday(dueDate) {
  if (!dueDate) return true;
  const todayStr = new Date().toISOString().split('T')[0];
  return dueDate <= todayStr;
}
