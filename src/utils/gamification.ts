import { WorkoutLog, UserProfile } from '../types';

export interface LevelInfo {
  level: number;
  title: string;
  currentExp: number;
  minExpForCurrent: number;
  maxExpForNext: number;
  progressPercent: number; // 0 to 100
  unlockedPerks: string[];
  nextReward: string;
  badgeIcon: string;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  levelRequired: number;
  type: 'theme' | 'shield' | 'badge';
  color?: string;
}

export const REWARDS_CATALOG: RewardItem[] = [
  {
    id: 'badge-initiate',
    name: 'Iron Initiate',
    description: 'Awarded for completing your first training cycle.',
    icon: 'fire',
    levelRequired: 2,
    type: 'badge',
    color: '#F59E0B',
  },
  {
    id: 'shield-1',
    name: 'Streak Shield',
    description: 'Automatically shields your streak if you miss a scheduled session.',
    icon: 'shield-check',
    levelRequired: 3,
    type: 'shield',
    color: '#10B981',
  },
  {
    id: 'theme-violet',
    name: 'Cyber Violet Theme',
    description: 'Unlocks the neon Cyber Violet futuristic colorway.',
    icon: 'palette',
    levelRequired: 5,
    type: 'theme',
    color: '#A855F7',
  },
  {
    id: 'shield-2',
    name: 'Veteran Shield',
    description: 'Adds an extra Streak Shield to your recovery reserves.',
    icon: 'shield-plus',
    levelRequired: 7,
    type: 'shield',
    color: '#10B981',
  },
  {
    id: 'theme-gold',
    name: 'Titan Gold Theme',
    description: 'Unlocks the prestigious Titan Gold championship colorway.',
    icon: 'crown',
    levelRequired: 10,
    type: 'theme',
    color: '#F59E0B',
  },
  {
    id: 'theme-crimson',
    name: 'Crimson Fury Theme',
    description: 'Unlocks the high-energy aggressive Crimson Fury theme.',
    icon: 'lightning-bolt',
    levelRequired: 15,
    type: 'theme',
    color: '#EF4444',
  },
  {
    id: 'badge-titan',
    name: 'Legendary Titan Crown',
    description: 'The pinnacle of Spotter athletic mastery and lifelong consistency.',
    icon: 'trophy-award',
    levelRequired: 20,
    type: 'badge',
    color: '#06B6D4',
  },
];

// Level thresholds: Exponential curve tailored for high-reward progression
const LEVEL_THRESHOLDS = [
  { level: 1, exp: 0, title: 'Novice Lifter', badgeIcon: 'dumbbell' },
  { level: 2, exp: 300, title: 'Iron Initiate', badgeIcon: 'fire' },
  { level: 3, exp: 750, title: 'Gym Regular', badgeIcon: 'arm-flex' },
  { level: 4, exp: 1400, title: 'Hypertrophy Cadet', badgeIcon: 'weight-lifter' },
  { level: 5, exp: 2200, title: 'Iron Veteran', badgeIcon: 'medal' },
  { level: 6, exp: 3200, title: 'Strength Specialist', badgeIcon: 'shield-star' },
  { level: 7, exp: 4500, title: 'Power Athlete', badgeIcon: 'flash' },
  { level: 8, exp: 6000, title: 'Barbell Master', badgeIcon: 'sword-cross' },
  { level: 9, exp: 7800, title: 'Apex Competitor', badgeIcon: 'bullseye-arrow' },
  { level: 10, exp: 10000, title: 'Elite Spotter', badgeIcon: 'crown' },
  { level: 12, exp: 15000, title: 'Iron Juggernaut', badgeIcon: 'shield-crown' },
  { level: 15, exp: 24000, title: 'Gym Warlord', badgeIcon: 'skull-crossbones' },
  { level: 20, exp: 45000, title: 'Legendary Titan', badgeIcon: 'diamond' },
];

export function getLevelInfo(totalExp: number = 0): LevelInfo {
  let currentLevelObj = LEVEL_THRESHOLDS[0];
  let nextLevelObj = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalExp >= LEVEL_THRESHOLDS[i].exp) {
      currentLevelObj = LEVEL_THRESHOLDS[i];
      nextLevelObj = LEVEL_THRESHOLDS[i + 1] || {
        level: currentLevelObj.level + 1,
        exp: currentLevelObj.exp + 10000,
        title: 'Master of Strength',
        badgeIcon: 'star-four-points',
      };
      break;
    }
  }

  const range = nextLevelObj.exp - currentLevelObj.exp;
  const progressInLevel = Math.max(0, totalExp - currentLevelObj.exp);
  const progressPercent = Math.min(100, Math.round((progressInLevel / (range || 1)) * 100));

  const unlockedPerks = REWARDS_CATALOG.filter((r) => r.levelRequired <= currentLevelObj.level).map(
    (r) => r.name
  );

  const nextRewardItem = REWARDS_CATALOG.find((r) => r.levelRequired > currentLevelObj.level);
  const nextReward = nextRewardItem
    ? `${nextRewardItem.name} at Level ${nextRewardItem.levelRequired}`
    : 'All Milestone Rewards Mastered!';

  return {
    level: currentLevelObj.level,
    title: currentLevelObj.title,
    currentExp: totalExp,
    minExpForCurrent: currentLevelObj.exp,
    maxExpForNext: nextLevelObj.exp,
    progressPercent,
    unlockedPerks,
    nextReward,
    badgeIcon: currentLevelObj.badgeIcon,
  };
}

export interface WorkoutExpBreakdown {
  baseExp: number;
  scheduledBonus: number;
  allSetsBonus: number;
  prBonus: number;
  totalGained: number;
  newTotalExp: number;
  leveledUp: boolean;
  newLevelInfo: LevelInfo;
}

export function calculateWorkoutExp(
  currentTotalExp: number = 0,
  isScheduledDay: boolean = false,
  allSetsCompleted: boolean = true,
  hasNewPr: boolean = false
): WorkoutExpBreakdown {
  const baseExp = 150;
  const scheduledBonus = isScheduledDay ? 100 : 0;
  const allSetsBonus = allSetsCompleted ? 50 : 0;
  const prBonus = hasNewPr ? 75 : 0;

  const totalGained = baseExp + scheduledBonus + allSetsBonus + prBonus;
  const newTotalExp = currentTotalExp + totalGained;

  const prevLevel = getLevelInfo(currentTotalExp).level;
  const newLevelInfo = getLevelInfo(newTotalExp);
  const leveledUp = newLevelInfo.level > prevLevel;

  return {
    baseExp,
    scheduledBonus,
    allSetsBonus,
    prBonus,
    totalGained,
    newTotalExp,
    leveledUp,
    newLevelInfo,
  };
}

/**
 * Checks if a specific date (or today) is a scheduled workout day for the user.
 * Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function isDayScheduled(
  dayIndex: number, // 0-6
  schedule: number[] = [1, 3, 5] // Default: Mon, Wed, Fri
): boolean {
  return schedule.includes(dayIndex);
}

export const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
