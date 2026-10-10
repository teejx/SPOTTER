import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  UserProfile,
  WorkoutLog,
  RoutineTemplate,
  PersonalRecord,
  WorkoutExercise,
  WorkoutSet,
  ThemeId,
  ColorMode,
  WalkingLog
} from '../types';
import {
  getSavedProfile,
  saveProfile,
  getSavedWorkouts,
  saveWorkouts,
  getSavedRoutines,
  saveRoutines,
  getSavedPRs,
  savePRs,
  calculateOneRepMax,
  saveRegisteredAccount,
  findRegisteredAccount,
  LocalAccountRecord,
  getSavedWalks,
  saveWalks,
  getSavedTheme,
  saveTheme,
  getSavedColorMode,
  saveColorMode,
} from '../lib/storage';
import { ThemeColors, getThemeColors, setAppTheme } from '../theme/colors';
import {
  isFirebaseConfigured,
  registerFirebaseUser,
  loginFirebaseUser,
  logoutFirebaseUser,
  onFirebaseAuthStateChanged,
  syncWorkoutToFirestore,
  deleteWorkoutFromFirestore,
  syncProfileToFirestore
} from '../lib/firebase';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS } from '../lib/seedData';

interface RestTimerState {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  exerciseName?: string;
  start: (seconds: number, name?: string) => void;
  stop: () => void;
  addSeconds: (delta: number) => void;
}

interface FitnessContextType {
  // Authentication & Session
  currentUser: UserProfile | null;
  activeUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    pass: string,
    name: string,
    trainingGoal: UserProfile['trainingGoal'],
    weight: number,
    unit: 'kg' | 'lbs'
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginGuest: (options?: {
    name?: string;
    trainingGoal?: UserProfile['trainingGoal'];
    weight?: number;
    unit?: 'kg' | 'lbs';
  }) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;

  // Workouts (User-isolated)
  workouts: WorkoutLog[];
  addWorkout: (workout: Omit<WorkoutLog, 'id'>) => Promise<WorkoutLog>;
  deleteWorkout: (id: string) => Promise<void>;

  // Routines (User-isolated)
  routines: RoutineTemplate[];
  userRoutines: RoutineTemplate[];
  createRoutine: (title: string, description: string, category: string, exerciseIds: string[]) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;

  // PRs (User-isolated)
  personalRecords: PersonalRecord[];

  // Live Workout
  activeSession: WorkoutLog | null;
  startSession: (routine?: RoutineTemplate) => void;
  updateActiveSession: (updater: (prev: WorkoutLog) => WorkoutLog) => void;
  finishSession: () => Promise<WorkoutLog | null>;
  cancelSession: () => void;

  // Rest Timer
  restTimer: RestTimerState;
  isLoading: boolean;
  isCloudConfigured: boolean;

  // Theming & Mode Engine
  themeId: ThemeId;
  setThemeId: (theme: ThemeId) => Promise<void>;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => Promise<void>;
  resolvedMode: 'dark' | 'light';
  isDark: boolean;
  colors: ThemeColors;
  themeVersion: number;

  // Walking Activities (User-isolated)
  walkingLogs: WalkingLog[];
  logWalk: (walk: Omit<WalkingLog, 'id' | 'userId'>) => Promise<WalkingLog>;
  deleteWalk: (id: string) => Promise<void>;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

export const FitnessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const activeUser = currentUser;
  const isAuthenticated = currentUser !== null;
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Theming & Mode State
  const systemScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>('crimson');
  const [colorMode, setColorModeState] = useState<ColorMode>('system');
  const [themeVersion, setThemeVersion] = useState<number>(0);

  // Computed Resolved Mode (System follows OS color scheme)
  const resolvedMode: 'dark' | 'light' = useMemo(() => {
    if (colorMode === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return colorMode;
  }, [colorMode, systemScheme]);

  const isDark = resolvedMode === 'dark';

  // Dynamic live colors object synchronized with the active theme and mode
  const colors = useMemo(() => {
    const c = getThemeColors(themeId, resolvedMode);
    setAppTheme(themeId, resolvedMode);
    return c;
  }, [themeId, resolvedMode]);

  // Walking Activity State
  const [walkingLogs, setWalkingLogs] = useState<WalkingLog[]>([]);

  // Rest Timer State
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(0);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerExerciseName, setTimerExerciseName] = useState<string | undefined>();

  // 1. Initial Load of Saved Session
  useEffect(() => {
    async function loadData() {
      try {
        const [savedTheme, savedColorMode, user] = await Promise.all([
          getSavedTheme(),
          getSavedColorMode(),
          getSavedProfile()
        ]);

        const initialTheme: ThemeId = user?.themeId || savedTheme || 'crimson';
        const initialMode: ColorMode = user?.colorMode || savedColorMode || 'system';

        setThemeIdState(initialTheme);
        setColorModeState(initialMode);

        const initialResolved: 'dark' | 'light' =
          initialMode === 'system'
            ? (systemScheme === 'light' ? 'light' : 'dark')
            : initialMode;
        setAppTheme(initialTheme, initialResolved);

        setCurrentUser(user);
        if (user) {
          const [loadedWorkouts, loadedRoutines, loadedPrs, loadedWalks] = await Promise.all([
            getSavedWorkouts(user.id),
            getSavedRoutines(user.id),
            getSavedPRs(user.id),
            getSavedWalks(user.id)
          ]);
          setWorkouts(loadedWorkouts);
          setRoutines(loadedRoutines);
          setPersonalRecords(loadedPrs);
          setWalkingLogs(loadedWalks);
        }
      } catch (e) {
        console.error('Error loading fitness data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Firebase Auth Listener (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsubscribe = onFirebaseAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const existing = await getSavedProfile();
        if (existing && existing.id === firebaseUser.uid) {
          setCurrentUser(existing);
          return;
        }
        const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Athlete';
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          name,
          handle: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          avatarBg: '#d4ff00',
          bio: 'SPOTTER Athlete.',
          trainingGoal: 'Strength',
          weightUnit: 'kg',
          bodyWeight: 75,
          streakDays: 1,
          joinedDate: new Date().toISOString(),
        };
        await saveProfile(newProfile);
        setCurrentUser(newProfile);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. User Data synchronization whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      (async () => {
        const [w, r, p, walks] = await Promise.all([
          getSavedWorkouts(currentUser.id),
          getSavedRoutines(currentUser.id),
          getSavedPRs(currentUser.id),
          getSavedWalks(currentUser.id)
        ]);
        setWorkouts(w);
        setRoutines(r);
        setPersonalRecords(p);
        setWalkingLogs(walks);
      })();
    } else {
      setWorkouts([]);
      setRoutines([]);
      setPersonalRecords([]);
      setWalkingLogs([]);
    }
  }, [currentUser?.id]);

  // Keep screen awake while workout is active
  useEffect(() => {
    if (activeSession) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
  }, [activeSession]);

  // Rest Timer ticker
  useEffect(() => {
    if (!timerIsRunning || timerSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimerSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerIsRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        if (prev <= 3) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerIsRunning, timerSecondsRemaining]);

  const startRestTimer = useCallback((seconds: number, name?: string) => {
    setTimerTotalSeconds(seconds);
    setTimerSecondsRemaining(seconds);
    setTimerIsRunning(true);
    setTimerExerciseName(name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stopRestTimer = useCallback(() => {
    setTimerIsRunning(false);
    setTimerSecondsRemaining(0);
  }, []);

  const addRestTimerSeconds = useCallback((delta: number) => {
    setTimerSecondsRemaining((prev) => Math.max(0, prev + delta));
    setTimerTotalSeconds((prev) => Math.max(0, prev + delta));
    Haptics.selectionAsync();
  }, []);

  // -------------------------------------------------------------
  // Auth Handlers (Supports Cloud & Local Accounts)
  // -------------------------------------------------------------
  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    // 1. Firebase Cloud Login (if credentials configured)
    if (isFirebaseConfigured()) {
      const res = await loginFirebaseUser(email, pass);
      if (!res.user) {
        return { success: false, error: res.error || 'Login failed.' };
      }
      const displayName = res.user.displayName || email.split('@')[0] || 'Athlete';
      const profile: UserProfile = {
        id: res.user.uid,
        name: displayName,
        handle: `@${displayName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        avatarBg: '#d4ff00',
        bio: 'SPOTTER Athlete.',
        trainingGoal: 'Strength',
        weightUnit: 'kg',
        bodyWeight: 75,
        streakDays: 1,
        joinedDate: new Date().toISOString(),
      };
      await saveProfile(profile);
      setCurrentUser(profile);
      return { success: true };
    }

    // 2. Local Accounts Database
    const account = await findRegisteredAccount(email);
    if (account) {
      if (account.password && account.password !== pass) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      await saveProfile(account.profile);
      setCurrentUser(account.profile);
      return { success: true };
    }

    return {
      success: false,
      error: 'Account not found. Please click "Create Account" to register first.',
    };
  }, []);

  const register = useCallback(async (
    email: string,
    pass: string,
    name: string,
    trainingGoal: UserProfile['trainingGoal'],
    weight: number,
    unit: 'kg' | 'lbs'
  ): Promise<{ success: boolean; error?: string }> => {
    let uid = `athlete-${Date.now()}`;

    // Cloud registration if Firebase is configured
    if (isFirebaseConfigured()) {
      const fbRes = await registerFirebaseUser(email, pass, name.trim());
      if (fbRes.user) {
        uid = fbRes.user.uid;
      } else {
        return { success: false, error: fbRes.error };
      }
    }

    const cleanName = name.trim() || 'Athlete';
    const newProfile: UserProfile = {
      id: uid,
      name: cleanName,
      handle: `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      avatarBg: '#d4ff00',
      bio: `Trained for ${trainingGoal.toLowerCase()}.`,
      trainingGoal,
      weightUnit: unit,
      bodyWeight: weight,
      streakDays: 1,
      joinedDate: new Date().toISOString(),
    };

    // Save into multi-account registry
    const record: LocalAccountRecord = {
      id: uid,
      email: email.trim(),
      password: pass,
      profile: newProfile,
    };
    await saveRegisteredAccount(record);

    // Save as active profile
    await saveProfile(newProfile);
    setCurrentUser(newProfile);

    if (isFirebaseConfigured()) {
      syncProfileToFirestore(newProfile).catch(console.warn);
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    try {
      if (isFirebaseConfigured()) {
        await logoutFirebaseUser();
      }
    } catch {
      // ignore
    }
    await saveProfile(null);
    setCurrentUser(null);
    setActiveSession(null);
    stopRestTimer();
  }, [stopRestTimer]);

  const loginGuest = useCallback(async (options?: {
    name?: string;
    trainingGoal?: UserProfile['trainingGoal'];
    weight?: number;
    unit?: 'kg' | 'lbs';
  }) => {
    const guestId = `guest-${Date.now()}`;
    const cleanName = options?.name?.trim() || 'Guest Athlete';
    const guestProfile: UserProfile = {
      id: guestId,
      name: cleanName,
      handle: `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      avatarBg: '#d4ff00',
      bio: 'Guest Athlete.',
      trainingGoal: options?.trainingGoal || 'General Fitness',
      weightUnit: options?.unit || 'kg',
      bodyWeight: options?.weight || 75,
      streakDays: 1,
      joinedDate: new Date().toISOString(),
    };

    await saveProfile(guestProfile);
    setCurrentUser(guestProfile);
  }, []);

  const updateProfile = useCallback(async (updated: UserProfile) => {
    await saveProfile(updated);
    setCurrentUser(updated);

    // Update in local accounts registry as well
    const accounts = await findRegisteredAccount(updated.id);
    if (accounts) {
      await saveRegisteredAccount({ ...accounts, profile: updated });
    }

    if (isFirebaseConfigured()) {
      syncProfileToFirestore(updated).catch(console.warn);
    }
  }, []);

  // -------------------------------------------------------------
  // Workout Handlers
  // -------------------------------------------------------------
  const addWorkout = useCallback(async (workoutData: Omit<WorkoutLog, 'id'>): Promise<WorkoutLog> => {
    const newWorkout: WorkoutLog = {
      ...workoutData,
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: activeUser?.id || 'anonymous',
    };

    const nextWorkouts = [newWorkout, ...workouts];
    setWorkouts(nextWorkouts);
    if (activeUser?.id) {
      await saveWorkouts(activeUser.id, nextWorkouts);
    }

    if (isFirebaseConfigured()) {
      syncWorkoutToFirestore(newWorkout).catch(console.warn);
    }

    // Check PRs
    const updatedPrs = [...personalRecords];
    let newPrsBroken: string[] = [];

    newWorkout.exercises.forEach((ex) => {
      const completedSets = ex.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0);
      if (completedSets.length === 0) return;

      const topSet = completedSets.reduce((max, s) => (s.weight > max.weight ? s : max), completedSets[0]);
      const e1rm = calculateOneRepMax(topSet.weight, topSet.reps);

      const existingPrIndex = updatedPrs.findIndex((p) => p.exerciseId === ex.exerciseId);
      if (existingPrIndex >= 0) {
        const existing = updatedPrs[existingPrIndex];
        if (topSet.weight > existing.maxWeight || e1rm > existing.estimatedOneRepMax) {
          updatedPrs[existingPrIndex] = {
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            maxWeight: Math.max(existing.maxWeight, topSet.weight),
            repsAtMax: topSet.weight >= existing.maxWeight ? topSet.reps : existing.repsAtMax,
            estimatedOneRepMax: Math.max(existing.estimatedOneRepMax, e1rm),
            date: newWorkout.date,
          };
          newPrsBroken.push(ex.exerciseName);
        }
      } else {
        updatedPrs.push({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          maxWeight: topSet.weight,
          repsAtMax: topSet.reps,
          estimatedOneRepMax: e1rm,
          date: newWorkout.date,
        });
        newPrsBroken.push(ex.exerciseName);
      }
    });

    if (newPrsBroken.length > 0 && activeUser?.id) {
      setPersonalRecords(updatedPrs);
      await savePRs(activeUser.id, updatedPrs);
    }

    return newWorkout;
  }, [activeUser?.id, workouts, personalRecords]);

  const deleteWorkout = useCallback(async (id: string) => {
    const next = workouts.filter((w) => w.id !== id);
    setWorkouts(next);
    if (activeUser?.id) {
      await saveWorkouts(activeUser.id, next);
    }
    if (isFirebaseConfigured()) {
      deleteWorkoutFromFirestore(id).catch(console.warn);
    }
  }, [activeUser?.id, workouts]);

  // -------------------------------------------------------------
  // Routine Handlers
  // -------------------------------------------------------------
  const createRoutine = useCallback(async (title: string, description: string, category: string, exerciseIds: string[]) => {
    const newRoutine: RoutineTemplate = {
      id: `rt-${Date.now()}`,
      userId: activeUser?.id || 'anonymous',
      title,
      description,
      category,
      exerciseIds,
    };
    const next = [newRoutine, ...routines];
    setRoutines(next);
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, next);
    }
  }, [activeUser?.id, routines]);

  const deleteRoutine = useCallback(async (id: string) => {
    const next = routines.filter((r) => r.id !== id);
    setRoutines(next);
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, next);
    }
  }, [activeUser?.id, routines]);

  // -------------------------------------------------------------
  // Live Workout Session
  // -------------------------------------------------------------
  const startSession = useCallback((routine?: RoutineTemplate) => {
    let initialExercises: WorkoutExercise[] = [];

    if (routine && routine.exerciseIds.length > 0) {
      const routineNameLower = (routine.title || '').toLowerCase();
      let splitType: 'push' | 'pull' | 'legs' | null = null;
      if (routineNameLower.includes('push')) splitType = 'push';
      else if (routineNameLower.includes('pull')) splitType = 'pull';
      else if (routineNameLower.includes('leg')) splitType = 'legs';

      initialExercises = routine.exerciseIds.map((exId, idx) => {
        const def = EXERCISE_DATABASE.find((e) => e.id === exId);
        const name = def?.name || `Exercise ${idx + 1}`;
        const cat = def?.category || 'Chest';
        const prescription = splitType ? (PPL_PRESCRIPTIONS[splitType] as any)?.[exId] : undefined;

        const defaultReps = prescription?.targetReps ? parseInt(prescription.targetReps.split('-')[0]) || 8 : 10;
        const defaultSetsCount = prescription?.targetSets || 3;

        return {
          id: `we-${Date.now()}-${idx}`,
          exerciseId: exId,
          exerciseName: name,
          category: cat,
          notes: prescription?.intensityCue || '',
          sets: Array.from({ length: defaultSetsCount }, (_, sIdx) => ({
            id: `s-${Date.now()}-${idx}-${sIdx}`,
            setNumber: sIdx + 1,
            type: 'regular',
            weight: 0,
            reps: defaultReps,
            completed: false,
          })),
        };
      });
    }

    const session: WorkoutLog = {
      id: `session-${Date.now()}`,
      userId: activeUser?.id || 'anonymous',
      title: routine ? routine.title : 'Quick Workout',
      date: new Date().toISOString(),
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 0,
      exercises: initialExercises,
      totalVolume: 0,
    };

    setActiveSession(session);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activeUser?.id]);

  const updateActiveSession = useCallback((updater: (prev: WorkoutLog) => WorkoutLog) => {
    setActiveSession((prev) => (prev ? updater(prev) : null));
  }, []);

  const finishSession = useCallback(async (): Promise<WorkoutLog | null> => {
    if (!activeSession) return null;

    let totalKg = 0;
    activeSession.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.weight > 0 && s.reps > 0) {
          totalKg += s.weight * s.reps;
        }
      });
    });

    const finished: WorkoutLog = {
      ...activeSession,
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalVolume: totalKg,
      durationMinutes: Math.max(1, activeSession.durationMinutes || 1),
    };

    await addWorkout(finished);
    setActiveSession(null);
    stopRestTimer();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return finished;
  }, [activeSession, addWorkout, stopRestTimer]);

  const cancelSession = useCallback(() => {
    setActiveSession(null);
    stopRestTimer();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [stopRestTimer]);

  const setTheme = useCallback(async (newTheme: ThemeId) => {
    setThemeIdState(newTheme);
    setThemeVersion((v) => v + 1);
    await saveTheme(newTheme);
    if (currentUser) {
      const updated: UserProfile = { ...currentUser, themeId: newTheme };
      setCurrentUser(updated);
      await saveProfile(updated);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentUser]);

  const setColorMode = useCallback(async (newMode: ColorMode) => {
    setColorModeState(newMode);
    setThemeVersion((v) => v + 1);
    await saveColorMode(newMode);
    if (currentUser) {
      const updated: UserProfile = { ...currentUser, colorMode: newMode };
      setCurrentUser(updated);
      await saveProfile(updated);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentUser]);

  const logWalk = useCallback(async (walkData: Omit<WalkingLog, 'id' | 'userId'>): Promise<WalkingLog> => {
    const userId = activeUser?.id || 'guest';
    const newWalk: WalkingLog = {
      ...walkData,
      id: `walk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
    };
    const updated = [newWalk, ...walkingLogs];
    setWalkingLogs(updated);
    await saveWalks(userId, updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return newWalk;
  }, [activeUser?.id, walkingLogs]);

  const deleteWalk = useCallback(async (id: string) => {
    const userId = activeUser?.id || 'guest';
    const updated = walkingLogs.filter((w) => w.id !== id);
    setWalkingLogs(updated);
    await saveWalks(userId, updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [activeUser?.id, walkingLogs]);

  return (
    <FitnessContext.Provider
      value={{
        currentUser,
        activeUser,
        isAuthenticated,
        login,
        register,
        logout,
        loginGuest,
        updateProfile,
        workouts,
        addWorkout,
        deleteWorkout,
        routines,
        userRoutines: routines.filter((r) => r.userId === activeUser?.id),
        createRoutine,
        deleteRoutine,
        personalRecords,
        activeSession,
        startSession,
        updateActiveSession,
        finishSession,
        cancelSession,
        restTimer: {
          secondsRemaining: timerSecondsRemaining,
          totalSeconds: timerTotalSeconds,
          isRunning: timerIsRunning,
          exerciseName: timerExerciseName,
          start: startRestTimer,
          stop: stopRestTimer,
          addSeconds: addRestTimerSeconds,
        },
        isLoading,
        isCloudConfigured: isFirebaseConfigured(),
        themeId,
        setThemeId: setTheme,
        colorMode,
        setColorMode,
        resolvedMode,
        isDark,
        colors,
        themeVersion,
        walkingLogs,
        logWalk,
        deleteWalk,
      }}
    >
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (!context) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};
