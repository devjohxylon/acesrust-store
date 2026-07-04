/**
 * Pure date math for daily check-ins. Days are UTC calendar days so the rules
 * are unambiguous for a global player base.
 */

export const BASE_CHECKIN_POINTS = 10;
export const STREAK_BONUS_PER_DAY = 5;
export const MAX_CHECKIN_POINTS = 80;

export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function checkinPoints(streak: number): number {
  const raw = BASE_CHECKIN_POINTS + STREAK_BONUS_PER_DAY * (Math.max(streak, 1) - 1);
  return Math.min(raw, MAX_CHECKIN_POINTS);
}

export type CheckinResult =
  | { status: 'already_checked_in'; streak: number; points: 0 }
  | { status: 'checked_in'; streak: number; points: number };

/**
 * lastCheckinDate is a YYYY-MM-DD string (or null for a first-ever check-in).
 * Consecutive-day check-ins extend the streak; any gap resets it to 1.
 */
export function computeCheckin(
  lastCheckinDate: string | null,
  currentStreak: number,
  now: Date
): CheckinResult {
  const today = utcDateString(now);

  if (lastCheckinDate === today) {
    return { status: 'already_checked_in', streak: currentStreak, points: 0 };
  }

  const yesterday = utcDateString(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const streak = lastCheckinDate === yesterday ? currentStreak + 1 : 1;

  return { status: 'checked_in', streak, points: checkinPoints(streak) };
}
