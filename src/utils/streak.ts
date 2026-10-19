import { WorkoutLog, WalkingLog } from '../types';

/**
 * Calculates the current training streak with support for scheduled rest days.
 * Counts both gym/resistance workouts and walking activities.
 *
 * Lifter-Friendly Rules:
 * - A day is active if at least one completed workout OR walking session occurred.
 * - Rest days are essential for muscle recovery and do NOT reset the streak as long
 *   as the user maintains their training rhythm (up to 2 consecutive rest days between sessions).
 * - A gap of up to 3 calendar days between sessions (e.g., Friday to Monday weekend rest,
 *   or Monday to Wednesday 48-hour split recovery) maintains the unbroken streak.
 * - If today is a rest day, the streak is preserved (up to 2 days after the last session).
 * - If 3 or more days pass without any workout or walk, the streak lapses to 0.
 */
export function calculateStreak(
  workouts: WorkoutLog[] = [],
  walks: WalkingLog[] = [],
  workoutSchedule?: number[],
  streakShields: number = 0
): number {
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

  const dateKeyToDate = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const dateKeyToMidnightMs = (key: string): number => {
    return dateKeyToDate(key).getTime();
  };

  const diffDays = (newerKey: string, olderKey: string): number => {
    const msNew = dateKeyToMidnightMs(newerKey);
    const msOld = dateKeyToMidnightMs(olderKey);
    return Math.round((msNew - msOld) / (1000 * 60 * 60 * 24));
  };

  // Add workouts
  workouts.forEach((w) => {
    if (w.date) {
      const key = toLocalDateKey(w.date);
      if (key) activeDays.add(key);
    }
  });

  // Add walking logs
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

  // If user has a defined workout schedule (e.g. [1, 3, 5] for Mon, Wed, Fri)
  if (workoutSchedule && workoutSchedule.length > 0) {
    let streak = 0;
    let shieldsLeft = streakShields;
    const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Iterate day-by-day backwards for up to 365 days
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const iterDate = new Date(checkDate);
      iterDate.setDate(iterDate.getDate() - dayOffset);
      const iterKey = toLocalDateKey(iterDate.toISOString());
      if (!iterKey) break;

      const dayOfWeek = iterDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const isScheduled = workoutSchedule.includes(dayOfWeek);
      const isActive = activeDays.has(iterKey);

      if (isActive) {
        streak++;
      } else if (dayOffset === 0 && isScheduled) {
        // Today is a scheduled day but user hasn't trained yet today; streak continues from previous
        continue;
      } else if (!isScheduled) {
        // Scheduled rest day! Doesn't break streak
        continue;
      } else {
        // Missed a scheduled day
        if (shieldsLeft > 0) {
          shieldsLeft--;
          continue; // Shield absorbed the missed day
        } else {
          // Streak broken
          break;
        }
      }
    }
    return streak;
  }

  // Fallback: General Lifter Rhythm (allowing up to 2 rest days between sessions)
  const sortedKeys = Array.from(activeDays).sort((a, b) => {
    return dateKeyToMidnightMs(b) - dateKeyToMidnightMs(a);
  });

  const latestActiveKey = sortedKeys[0];
  const daysSinceLatest = diffDays(todayKey, latestActiveKey);

  // If the last workout was more than 2 days ago, streak expired
  if (daysSinceLatest > 2) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedKeys.length - 1; i++) {
    const newer = sortedKeys[i];
    const older = sortedKeys[i + 1];
    const gap = diffDays(newer, older);

    if (gap <= 3) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
