/**
 * Local timezone date helpers for accurate filtering and aggregations across SPOTTER.
 * Respects user's local timezone (avoiding UTC offset shift bugs), calendar months (28-31 days),
 * and standard Monday-to-Sunday weekly cycles.
 */

export type DateFilterType = 'today' | 'week' | 'month' | 'all';

/**
 * Returns a local YYYY-MM-DD string representation of a Date or ISO string
 */
export function toLocalDateKey(dateOrIso: Date | string = new Date()): string {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Checks if a record falls within the user's current local calendar day (00:00:00 - 23:59:59.999).
 */
export function isRecordToday(dateOrIso: Date | string, referenceDate: Date = new Date()): boolean {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth() &&
    d.getDate() === referenceDate.getDate()
  );
}

/**
 * Checks if a record falls within the user's current calendar week (Monday 00:00:00 to Sunday 23:59:59.999).
 */
export function isRecordThisWeek(dateOrIso: Date | string, referenceDate: Date = new Date()): boolean {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return false;

  const currentDay = referenceDate.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (currentDay + 6) % 7; // Monday = 0, Tuesday = 1, ... Sunday = 6
  
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - diffToMonday,
    0, 0, 0, 0
  );
  const nextMonday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);

  return d >= monday && d < nextMonday;
}

/**
 * Checks if a record falls within the user's current calendar month (1st of month 00:00:00 to last day 23:59:59.999).
 * Correctly handles variable month lengths (28, 29, 30, 31 days).
 */
export function isRecordThisMonth(dateOrIso: Date | string, referenceDate: Date = new Date()): boolean {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth()
  );
}

/**
 * Filters any collection of objects that contain a `date` ISO string according to the selected DateFilterType.
 */
export function filterRecordsByDate<T extends { date: string }>(
  items: T[],
  filter: DateFilterType,
  referenceDate: Date = new Date()
): T[] {
  if (!items || items.length === 0) return [];
  if (filter === 'all') return items;

  if (filter === 'today') {
    return items.filter((item) => isRecordToday(item.date, referenceDate));
  }
  if (filter === 'week') {
    return items.filter((item) => isRecordThisWeek(item.date, referenceDate));
  }
  if (filter === 'month') {
    return items.filter((item) => isRecordThisMonth(item.date, referenceDate));
  }
  return items;
}

/**
 * Returns user-friendly descriptive labels for timeframes
 */
export function getTimeframeDescriptor(filter: DateFilterType): {
  walkTitle: string;
  stepsLabel: string;
  periodLabel: string;
} {
  switch (filter) {
    case 'today':
      return {
        walkTitle: "Today's Walk & Activity",
        stepsLabel: "Today's Steps",
        periodLabel: 'Today',
      };
    case 'week':
      return {
        walkTitle: "This Week's Walk & Activity",
        stepsLabel: 'Weekly Steps',
        periodLabel: 'This Week',
      };
    case 'month':
      return {
        walkTitle: "This Month's Walk & Activity",
        stepsLabel: 'Monthly Steps',
        periodLabel: 'This Month',
      };
    case 'all':
      return {
        walkTitle: 'All-Time Walk & Activity',
        stepsLabel: 'Total Steps',
        periodLabel: 'All Time',
      };
  }
}
