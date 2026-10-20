export interface ChangelogItem {
  icon: string;
  title: string;
  description: string;
  tag?: string;
}

export interface ChangelogRelease {
  version: string;
  releaseDate: string;
  title: string;
  summary: string;
  highlights: ChangelogItem[];
}

export const APP_VERSION = '1.1.0';

export const CHANGELOG_HISTORY: ChangelogRelease[] = [
  {
    version: '1.1.0',
    releaseDate: 'October 2026',
    title: 'The Titan Update',
    summary:
      'A massive update packed with 60+ new exercises, verified motion illustrations, gamified EXP & rewards, custom training schedules, and a dedicated Settings hub.',
    highlights: [
      {
        icon: 'arm-flex',
        title: '60+ New Exercises & Verified Illustrations',
        description:
          'Expanded movement library with motion loops, step-by-step setup guides, common mistake callouts, and YouTube form videos.',
        tag: 'EXERCISES',
      },
      {
        icon: 'notebook-check',
        title: 'Push · Pull · Legs (PPL) Split Routines',
        description:
          'Pre-built workout splits with target rep ranges (e.g., 6–10 reps) and recommended starting weights ready to launch with one tap.',
        tag: 'ROUTINES',
      },
      {
        icon: 'trophy',
        title: 'Level Up & Unlock Milestone Rewards',
        description:
          'Earn EXP every time you complete a workout, finish all sets, or break a Personal Record. Level up from Novice Lifter to Legendary Titan across 20 ranks.',
        tag: 'LEVELS',
      },
      {
        icon: 'palette',
        title: 'Cyber Violet, Titan Gold & Themes',
        description:
          'Unlock prestigious theme colorways as you level up, and switch between 6 themes and Dark/Light display modes anytime.',
        tag: 'REWARDS',
      },
      {
        icon: 'shield-check',
        title: 'Streak Shields & Schedule Calendar',
        description:
          'Set your scheduled workout days and reminder alerts. Earn Streak Shields that automatically protect your streak on rest days.',
        tag: 'STREAKS',
      },
      {
        icon: 'cog',
        title: 'Dedicated App Settings Hub',
        description:
          'A brand new Settings screen accessible right from your Profile. Easily manage your themes, KG/LBS weight units, cloud database sync, and changelog.',
        tag: 'SETTINGS',
      },
      {
        icon: 'arrow-up-down',
        title: 'Smoother Workout Logging & Reordering',
        description:
          'Reorder exercises on the fly with responsive theme glow highlights, plus intelligent warnings if you finish a workout with uncompleted sets.',
        tag: 'WORKOUTS',
      },
    ],
  },
];
