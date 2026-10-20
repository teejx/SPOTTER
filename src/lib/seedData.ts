import { UserProfile, WorkoutLog, RoutineTemplate, PersonalRecord, RoutineFolder, WalkingLog } from '../types';

export const INITIAL_USERS: UserProfile[] = [];

export interface ExercisePrescription {
  sets: number;
  targetReps: number;
  repRange: string;
  defaultWeightKg: number;
}

export const PPL_PRESCRIPTIONS: Record<string, ExercisePrescription> = {
  // Workout A — Push
  'bench-press-barbell': { sets: 3, targetReps: 8, repRange: '3 × 6–10', defaultWeightKg: 60 },
  'machine-chest-press': { sets: 3, targetReps: 8, repRange: '3 × 6–10', defaultWeightKg: 50 },
  'incline-dumbbell-press': { sets: 3, targetReps: 8, repRange: '3 × 6–10', defaultWeightKg: 22 },
  'pec-deck-flyes': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 45 },
  'seated-shoulder-press-machine': { sets: 2, targetReps: 10, repRange: '2 × 8–12', defaultWeightKg: 40 },
  'cable-lateral-raise': { sets: 3, targetReps: 15, repRange: '3 × 12–20', defaultWeightKg: 7.5 },
  'lateral-raises-db': { sets: 3, targetReps: 15, repRange: '3 × 12–20', defaultWeightKg: 8 },
  'tricep-rope-pushdown': { sets: 3, targetReps: 12, repRange: '3 × 10–15', defaultWeightKg: 20 },
  'overhead-cable-tricep-extension': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 15 },

  // Workout B — Pull
  'lat-pulldown': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 50 },
  'seated-cable-row': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 50 },
  'chest-supported-row': { sets: 2, targetReps: 10, repRange: '2 × 8–12', defaultWeightKg: 45 },
  'reverse-pec-deck': { sets: 3, targetReps: 15, repRange: '3 × 12–20', defaultWeightKg: 35 },
  'dumbbell-bicep-curl': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 14 },
  'incline-db-curl': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 10 },
  'cable-rope-hammer-curl': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 15 },
  'hammer-curls': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 14 },
  'barbell-wrist-curl': { sets: 2, targetReps: 15, repRange: '2 × 12–20', defaultWeightKg: 20 },
  'dumbbell-wrist-curl': { sets: 2, targetReps: 15, repRange: '2 × 12–20', defaultWeightKg: 10 },
  'barbell-reverse-wrist-curl': { sets: 2, targetReps: 15, repRange: '2 × 12–20', defaultWeightKg: 15 },
  'dumbbell-reverse-wrist-curl': { sets: 2, targetReps: 15, repRange: '2 × 12–20', defaultWeightKg: 8 },

  // Workout C — Legs & Abs
  'leg-press': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 140 },
  'romanian-deadlift': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 80 },
  'seated-leg-curl': { sets: 3, targetReps: 12, repRange: '3 × 10–15', defaultWeightKg: 45 },
  'leg-extension': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 45 },
  'standing-calf-raise': { sets: 3, targetReps: 12, repRange: '3 × 10–15', defaultWeightKg: 60 },
  'cable-crunches': { sets: 2, targetReps: 12, repRange: '2 × 10–15', defaultWeightKg: 30 },

  // Indoor / Dumbbell Home Routines
  'dumbbell-flat-press': { sets: 3, targetReps: 8, repRange: '3 sets RPT', defaultWeightKg: 24 },
  'overhead-dumbbell-tricep-extension': { sets: 5, targetReps: 12, repRange: '5 sets RP', defaultWeightKg: 14 },
  'dumbbell-side-delt-rows': { sets: 5, targetReps: 15, repRange: '5 sets RP', defaultWeightKg: 10 },
  'goblet-squat': { sets: 2, targetReps: 10, repRange: '2 sets RPT', defaultWeightKg: 24 },
  'dumbbell-romanian-deadlift': { sets: 3, targetReps: 10, repRange: '3 sets RPT', defaultWeightKg: 24 },
  'dumbbell-shrugs': { sets: 5, targetReps: 15, repRange: '5 sets RP', defaultWeightKg: 22 },
  'dumbbell-bench-dips': { sets: 3, targetReps: 12, repRange: '3 sets RPT', defaultWeightKg: 15 },
  'overhead-dumbbell-press': { sets: 3, targetReps: 8, repRange: '3 sets RPT', defaultWeightKg: 18 },
  'dumbbell-pullover': { sets: 3, targetReps: 10, repRange: '3 sets RPT', defaultWeightKg: 20 },
  'single-arm-db-row': { sets: 5, targetReps: 12, repRange: '5 sets RP', defaultWeightKg: 20 },
  'dumbbell-chest-flyes': { sets: 3, targetReps: 12, repRange: '3 sets', defaultWeightKg: 12 },

  // Outdoor / Calisthenics & Compound Routines
  'dips-chest': { sets: 3, targetReps: 12, repRange: '3 × 8–15', defaultWeightKg: 0 },
  'push-ups': { sets: 3, targetReps: 15, repRange: '3 × 12–20', defaultWeightKg: 0 },
  'pull-ups': { sets: 3, targetReps: 8, repRange: '3 × 6–10', defaultWeightKg: 0 },
  'barbell-bent-row': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 50 },
  'rear-delt-fly': { sets: 3, targetReps: 15, repRange: '3 × 12–15', defaultWeightKg: 10 },
  'barbell-back-squat': { sets: 3, targetReps: 8, repRange: '3 × 6–10', defaultWeightKg: 80 },
  'bulgarian-split-squat': { sets: 3, targetReps: 10, repRange: '3 × 8–12', defaultWeightKg: 16 },
  'kettlebell-swings': { sets: 3, targetReps: 20, repRange: '3 × 15–25', defaultWeightKg: 20 },
  'hanging-leg-raise': { sets: 3, targetReps: 12, repRange: '3 × 10–15', defaultWeightKg: 0 },
  'plank': { sets: 3, targetReps: 60, repRange: '3 × 45–60s', defaultWeightKg: 0 },
};

export const DEFAULT_FOLDER_COLORS: Record<string, string> = {
  'Indoor Workouts': '#3B82F6',
  'Outdoor Workouts': '#10B981',
};

export const FOLDER_COLOR_PALETTE: string[] = [
  '#3B82F6', // Electric Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Gold
  '#EF4444', // Crimson Red
  '#8B5CF6', // Royal Purple
  '#EC4899', // Hot Pink
  '#06B6D4', // Vibrant Cyan
  '#14B8A6', // Teal
  '#F97316', // Neon Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime Green
  '#64748B', // Slate
];

export const DEFAULT_FOLDERS: RoutineFolder[] = [
  {
    id: 'f-push-pull-legs',
    name: 'Push Pull Legs',
    color: '#EF4444',
  },
];

export const DEFAULT_ROUTINES: RoutineTemplate[] = [
  {
    id: 'routine-ppl-day-a-push',
    userId: 'default',
    title: 'Day A — Push',
    description: 'Chest · Front and side delts · Triceps Focus (Upper chest, thickness, lateral delts, and triceps)',
    category: 'Chest',
    folder: 'Push Pull Legs',
    isFavorite: true,
    exerciseIds: [
      'incline-dumbbell-press',
      'bench-press-barbell',
      'pec-deck-flyes',
      'seated-shoulder-press-machine',
      'cable-lateral-raise',
      'tricep-rope-pushdown',
      'overhead-cable-tricep-extension',
    ],
    routineExercises: [
      { exerciseId: 'incline-dumbbell-press', exerciseName: 'Incline Dumbbell Press', targetSets: 3, targetReps: 8, defaultWeight: 22, weightUnit: 'kg' },
      { exerciseId: 'bench-press-barbell', exerciseName: 'Flat Barbell Bench Press', targetSets: 3, targetReps: 8, defaultWeight: 60, weightUnit: 'kg' },
      { exerciseId: 'pec-deck-flyes', exerciseName: 'Pec Deck Machine', targetSets: 2, targetReps: 12, defaultWeight: 45, weightUnit: 'kg' },
      { exerciseId: 'seated-shoulder-press-machine', exerciseName: 'Seated Shoulder Press Machine', targetSets: 2, targetReps: 10, defaultWeight: 40, weightUnit: 'kg' },
      { exerciseId: 'cable-lateral-raise', exerciseName: 'Cable Lateral Raise', targetSets: 3, targetReps: 15, defaultWeight: 7.5, weightUnit: 'kg' },
      { exerciseId: 'tricep-rope-pushdown', exerciseName: 'Rope Triceps Pushdown', targetSets: 3, targetReps: 12, defaultWeight: 20, weightUnit: 'kg' },
      { exerciseId: 'overhead-cable-tricep-extension', exerciseName: 'Overhead Cable Triceps Extension', targetSets: 2, targetReps: 12, defaultWeight: 15, weightUnit: 'kg' },
    ],
  },
  {
    id: 'routine-ppl-day-b-pull',
    userId: 'default',
    title: 'Day B — Pull',
    description: 'Back · Rear delts · Biceps · Forearms Focus (Lat width, thickness, rear delts, biceps, brachialis, forearms)',
    category: 'Back',
    folder: 'Push Pull Legs',
    isFavorite: true,
    exerciseIds: [
      'lat-pulldown',
      'seated-cable-row',
      'chest-supported-row',
      'reverse-pec-deck',
      'dumbbell-bicep-curl',
      'incline-db-curl',
      'cable-rope-hammer-curl',
      'barbell-wrist-curl',
      'barbell-reverse-wrist-curl',
    ],
    routineExercises: [
      { exerciseId: 'lat-pulldown', exerciseName: 'Lat Pulldown', targetSets: 3, targetReps: 10, defaultWeight: 50, weightUnit: 'kg' },
      { exerciseId: 'seated-cable-row', exerciseName: 'Seated Cable Row', targetSets: 3, targetReps: 10, defaultWeight: 50, weightUnit: 'kg' },
      { exerciseId: 'chest-supported-row', exerciseName: 'Chest-Supported Row', targetSets: 2, targetReps: 10, defaultWeight: 45, weightUnit: 'kg' },
      { exerciseId: 'reverse-pec-deck', exerciseName: 'Reverse Pec Deck', targetSets: 3, targetReps: 15, defaultWeight: 35, weightUnit: 'kg' },
      { exerciseId: 'dumbbell-bicep-curl', exerciseName: 'Dumbbell Biceps Curl', targetSets: 3, targetReps: 10, defaultWeight: 14, weightUnit: 'kg' },
      { exerciseId: 'incline-db-curl', exerciseName: 'Incline Dumbbell Curl', targetSets: 2, targetReps: 12, defaultWeight: 10, weightUnit: 'kg' },
      { exerciseId: 'cable-rope-hammer-curl', exerciseName: 'Cable Rope Hammer Curl', targetSets: 2, targetReps: 12, defaultWeight: 15, weightUnit: 'kg' },
      { exerciseId: 'barbell-wrist-curl', exerciseName: 'Barbell Wrist Curl', targetSets: 2, targetReps: 15, defaultWeight: 20, weightUnit: 'kg' },
      { exerciseId: 'barbell-reverse-wrist-curl', exerciseName: 'Barbell Reverse Wrist Curl', targetSets: 2, targetReps: 15, defaultWeight: 15, weightUnit: 'kg' },
    ],
  },
  {
    id: 'routine-ppl-day-c-legs-abs',
    userId: 'default',
    title: 'Day C — Legs and Abs',
    description: 'Quads · Hamstrings · Glutes · Calves · Abs Focus',
    category: 'Legs',
    folder: 'Push Pull Legs',
    isFavorite: true,
    exerciseIds: [
      'leg-press',
      'romanian-deadlift',
      'seated-leg-curl',
      'leg-extension',
      'standing-calf-raise',
      'cable-crunches',
    ],
    routineExercises: [
      { exerciseId: 'leg-press', exerciseName: 'Leg Press', targetSets: 3, targetReps: 10, defaultWeight: 140, weightUnit: 'kg' },
      { exerciseId: 'romanian-deadlift', exerciseName: 'Romanian Deadlift', targetSets: 3, targetReps: 10, defaultWeight: 80, weightUnit: 'kg' },
      { exerciseId: 'seated-leg-curl', exerciseName: 'Seated Leg Curl', targetSets: 3, targetReps: 12, defaultWeight: 45, weightUnit: 'kg' },
      { exerciseId: 'leg-extension', exerciseName: 'Leg Extension', targetSets: 2, targetReps: 12, defaultWeight: 45, weightUnit: 'kg' },
      { exerciseId: 'standing-calf-raise', exerciseName: 'Standing Calf Raise', targetSets: 3, targetReps: 12, defaultWeight: 60, weightUnit: 'kg' },
      { exerciseId: 'cable-crunches', exerciseName: 'Cable Crunch', targetSets: 2, targetReps: 12, defaultWeight: 30, weightUnit: 'kg' },
    ],
  },
];

export const INITIAL_ROUTINES: RoutineTemplate[] = DEFAULT_ROUTINES;

export const INITIAL_WORKOUTS: WorkoutLog[] = [];

export const INITIAL_PRS: Record<string, PersonalRecord[]> = {};

