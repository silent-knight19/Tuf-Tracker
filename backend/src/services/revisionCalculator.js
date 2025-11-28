/**
 * Adaptive Spaced Repetition Calculator
 * Calculates the next revision date based on difficulty, revision count, and performance
 */

export const calculateNextRevisionDate = (
  difficulty,
  revisionCount,
  lastRevisionDate
) => {
  const now = new Date();
  let daysToAdd = 1;

  // Base intervals by difficulty
  const intervals = {
    Easy: [1, 3, 7, 14, 30, 60],
    Medium: [1, 2, 5, 10, 20, 40],
    Hard: [1, 1, 3, 7, 14, 28],
  };

  const difficultyIntervals = intervals[difficulty] || intervals.Medium;
  
  // Get the interval for this revision count (cap at max interval)
  const intervalIndex = Math.min(revisionCount, difficultyIntervals.length - 1);
  daysToAdd = difficultyIntervals[intervalIndex];

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  return nextDate;
};

/**
 * Calculates urgency score for a problem (higher = more urgent)
 */
export const calculateUrgency = (nextRevisionDate) => {
  const now = new Date();
  const diffTime = now - new Date(nextRevisionDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If overdue, urgency is positive (days overdue)
  // If upcoming, urgency is negative
  return diffDays;
};

/**
 * Determines if a problem is due for revision
 */
export const isDueForRevision = (nextRevisionDate) => {
  const now = new Date();
  const next = new Date(nextRevisionDate);
  return now >= next;
};

/**
 * Categorizes a problem by revision status
 */
export const getRevisionStatus = (nextRevisionDate) => {
  const now = new Date();
  const next = new Date(nextRevisionDate);
  
  if (now > next) return 'overdue';
  if (now.toDateString() === next.toDateString()) return 'due-today';
  return 'upcoming';
};
