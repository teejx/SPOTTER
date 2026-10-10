import { WorkoutLog, WalkingLog } from '../types';

/**
 * Calculates the current consecutive day workout streak.
 * Counts both gym/resistance workouts and walking activities.
 *
 * Rules:
 * - A day counts if at least one completed workout OR walking log occurred on that date.
 * - If today has an activity, streak includes today and looks backwards consecutively.
 * - If today has no activity yet, streak is preserved from yesterday (looking backwards).
 * - If neither today nor yesterday has activity, the streak is 0.
 */
export function calculateStreak(workouts: WorkoutLog[] = [], walks: WalkingLog[] = []): number {
  const activeDays = new Set<string>();

  const toLocalDateKey = (isoString: string): string | null => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return null;
    }
  };

  // Add workouts
  workouts.forEach((w) => {
    if (w.date) {
      const key = toLocalDateKey(w.date);
      if (key) activeDays.add(key);
    }
  });

  // Add walking logs (as requested: "count walking as a part of the streak")
  walks.forEach((w) => {
    if (w.date) {
      const key = toLocalDateKey(w.date);
      if (key) activeDays.add(key);
    }
  });

  if (activeDays.size === 0) {
    return 0;
  }

  const now = new Date();
  const todayKey = toLocalDateKey(now.toISOString());
  if (!todayKey) return 0;

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let currentKey = toLocalDateKey(cursor.toISOString())!;

  // Check if today has activity
  if (!activeDays.has(currentKey)) {
    // If not today, check yesterday
    cursor.setDate(cursor.getDate() - 1);
    currentKey = toLocalDateKey(cursor.toISOString())!;
    if (!activeDays.has(currentKey)) {
      return 0;
    }
  }

  let streak = 0;
  while (activeDays.has(currentKey)) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
    currentKey = toLocalDateKey(cursor.toISOString())!;
  }

  return streak;
}
