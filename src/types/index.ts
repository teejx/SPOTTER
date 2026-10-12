export type WeightUnit = 'kg' | 'lbs';

export type SetType = 'regular' | 'warmup' | 'dropset' | 'failure';

export type MuscleGroup = 
  | 'Chest' 
  | 'Back' 
  | 'Legs' 
  | 'Shoulders' 
  | 'Arms' 
  | 'Core' 
  | 'Cardio' 
  | 'Full Body';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight' | 'Cardio';
  defaultRestSeconds: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  description?: string;
  setupInstructions?: string[];
  executionInstructions?: string[];
  formCues?: string[];
  commonMistakes?: string[];
  videoEmbedUrl?: string;
  videoSourceTitle?: string;
  workoutGuideSlug?: string;
  exerciseDbGifUrl?: string;
  animationGifUrl?: string;
  loopDurationSeconds?: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: MuscleGroup;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  exercises: WorkoutExercise[];
  notes?: string;
  totalVolume: number;
  prsBroken?: string[];
}

export interface RoutineTemplate {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  exerciseIds: string[];
  folder?: string;
}

export type DiceBearAvatarStyle = 'miniavs' | 'line-face' | 'dylan' | 'big-smile' | 'big-ears';

export type ThemeId = 'crimson' | 'emerald' | 'cobalt' | 'amber' | 'monochrome' | 'amethyst';

export type ColorMode = 'system' | 'dark' | 'light';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatarBg: string;
  avatarUrl?: string;
  avatarStyle?: DiceBearAvatarStyle;
  avatarSeed?: string;
  avatarOptions?: Record<string, any>;
  themeId?: ThemeId;
  colorMode?: ColorMode;
  bio: string;
  trainingGoal: 'Strength' | 'Hypertrophy' | 'Endurance' | 'Functional' | 'General Fitness';
  weightUnit: WeightUnit;
  bodyWeight: number;
  streakDays: number;
  joinedDate: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  repsAtMax: number;
  estimatedOneRepMax: number;
  date: string;
}

export interface WalkingLog {
  id: string;
  userId: string;
  title: string;
  date: string;
  durationMinutes: number;
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  notes?: string;
}
