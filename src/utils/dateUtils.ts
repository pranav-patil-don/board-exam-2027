/**
 * Date and 4:00 AM Local Reset Utilities for BoardQuest 2027
 */

export const QUEST_START_DATE = '2026-10-01';
export const BOARD_EXAM_START = '2027-03-01';
export const QUEST_END_DATE = '2027-03-31';
export const PHASE_2_END_DATE = '2027-05-31';

/**
 * Returns YYYY-MM-DD formatted string considering 4:00 AM reset time.
 * If local time is before 04:00 AM, it counts as yesterday's study day.
 */
export function getStudyDate(date: Date = new Date()): string {
  const d = new Date(date.getTime());
  const hours = d.getHours();

  // If before 4:00 AM local time, roll back 1 day
  if (hours < 4) {
    d.setDate(d.getDate() - 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToHuman(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getDayOfWeekIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // JS getDay(): 0 is Sunday, 1 is Mon...
  // We want 0 = Monday, 6 = Sunday
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const SHORT_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function getDaysRemaining(targetDateStr: string, fromDateStr: string): number {
  const target = new Date(targetDateStr + 'T00:00:00').getTime();
  const from = new Date(fromDateStr + 'T00:00:00').getTime();
  const diffDays = Math.ceil((target - from) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getDaysBetween(startStr: string, endStr: string): number {
  const s = new Date(startStr + 'T00:00:00').getTime();
  const e = new Date(endStr + 'T00:00:00').getTime();
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayStr = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
}

/**
 * Generates array of 182 day items from Oct 1, 2026 to Mar 31, 2027 (or 243 for Phase 2)
 */
export function generateJourneyDays(includePhase2: boolean = false): { dayNumber: number; dateStr: string }[] {
  const days: { dayNumber: number; dateStr: string }[] = [];
  const totalDays = includePhase2 ? 243 : 182; // 182 days Oct 1 -> Mar 31
  let cur = QUEST_START_DATE;

  for (let i = 1; i <= totalDays; i++) {
    days.push({
      dayNumber: i,
      dateStr: cur,
    });
    cur = addDays(cur, 1);
  }
  return days;
}

/**
 * Returns current study day level index (1..182) relative to Oct 1, 2026
 */
export function getQuestDayIndex(currentDateStr: string): number {
  const diff = getDaysBetween(QUEST_START_DATE, currentDateStr);
  return Math.min(182, Math.max(1, diff + 1));
}
