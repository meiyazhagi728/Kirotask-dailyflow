/**
 * Utility functions for habit streak calculation.
 */

/**
 * Formats a Date as a local calendar day string (YYYY-MM-DD).
 *
 * @param date - The date to format
 * @returns The local calendar day string
 */
function toLocalDayString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the current consecutive-day streak from habit completion timestamps.
 *
 * A streak is the number of consecutive calendar days — ending today or
 * yesterday — on which the habit was completed at least once.
 *
 * @param completionDates - Array of Date objects representing when the habit was completed
 * @returns The length of the current streak in days (0 if no streak)
 */
export function computeStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0;

  // Deduplicate: reduce to one entry per local calendar day.
  const uniqueDays = [
    ...new Set(completionDates.map((d) => toLocalDayString(d))),
  ]
    .sort()
    .reverse();

  let streak = 0;

  // Anchor: today as local calendar day string.
  const today = toLocalDayString(new Date());

  // Yesterday as local calendar day string.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDayString(yesterday);

  // Streak must end today or yesterday.
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterdayStr) {
    return 0;
  }

  for (let i = 0; i < uniqueDays.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expected = toLocalDayString(expectedDate);

    if (uniqueDays[i] === expected) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
