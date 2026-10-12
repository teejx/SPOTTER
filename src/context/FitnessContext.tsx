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
  WalkingLog,
  RoutineFolder,
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
  getSavedFolders,
  saveFolders,
} from '../lib/storage';
import { ThemeColors, getThemeColors, setAppTheme } from '../theme/colors';
import {
  isFirebaseConfigured,
  registerFirebaseUser,
  loginFirebaseUser,
  loginAnonymousFirebaseUser,
  logoutFirebaseUser,
  onFirebaseAuthStateChanged,
  syncWorkoutToFirestore,
  deleteWorkoutFromFirestore,
  syncProfileToFirestore,
  fetchProfileFromFirestore,
  fetchWorkoutsFromFirestore,
  syncWalkToFirestore,
  deleteWalkFromFirestore,
  fetchWalksFromFirestore,
  syncRoutineToFirestore,
  deleteRoutineFromFirestore,
  fetchRoutinesFromFirestore,
} from '../lib/firebase';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS, DEFAULT_FOLDERS } from '../lib/seedData';
import { calculateStreak } from '../utils/streak';

interface RestTimerState {
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  isFinished?: boolean;
  exerciseName?: string;
  start: (seconds: number, name?: string) => void;
  stop: () => void;
  addSeconds: (delta: number) => void;
  dismissFinished?: () => void;
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

  // Routines & Folders (User-isolated)
  routines: RoutineTemplate[];
  userRoutines: RoutineTemplate[];
  folders: RoutineFolder[];
  createRoutine: (title: string, description: string, category: string, exerciseIds: string[], folder?: string) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  updateRoutineFolder: (id: string, folder: string) => Promise<void>;
  createFolder: (folderName: string, color?: string) => Promise<void>;
  updateFolderColor: (folderName: string, color: string) => Promise<void>;
  deleteFolder: (folderName: string) => Promise<void>;

  // PRs (User-isolated)
  personalRecords: PersonalRecord[];

  // Live Workout
  activeSession: WorkoutLog | null;
  startSession: (routine?: RoutineTemplate) => void;
  updateActiveSession: (updater: (prev: WorkoutLog) => WorkoutLog) => void;
  finishSession: () => Promise<WorkoutLog | null>;
  cancelSession: () => void;
  isWorkoutStarted: boolean;
  isWorkoutPaused: boolean;
  workoutElapsedSeconds: number;
  startActiveWorkout: () => void;
  togglePauseActiveWorkout: () => void;

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
  const isAuthenticated = currentUser !== null;
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [folders, setFolders] = useState<RoutineFolder[]>(DEFAULT_FOLDERS);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutLog | null>(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);

  // Live session elapsed timer ticker: ticks strictly when activeSession exists, is started, and not paused
  useEffect(() => {
    if (!activeSession || !isWorkoutStarted || isWorkoutPaused) return;
    const interval = setInterval(() => {
      setWorkoutElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isWorkoutStarted, isWorkoutPaused]);

  const startActiveWorkout = useCallback(() => {
    setIsWorkoutStarted(true);
    setIsWorkoutPaused(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const togglePauseActiveWorkout = useCallback(() => {
    setIsWorkoutPaused((prev) => {
      const next = !prev;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return next;
    });
  }, []);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic live streak calculated from workouts and walks
  const [walkingLogs, setWalkingLogs] = useState<WalkingLog[]>([]);
  const computedStreak = useMemo(
    () => calculateStreak(workouts, walkingLogs),
    [workouts, walkingLogs]
  );

  const activeUser = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      streakDays: computedStreak,
    };
  }, [currentUser, computedStreak]);

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

  // Rest Timer State
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number>(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState<number>(0);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);
  const [timerJustFinished, setTimerJustFinished] = useState<boolean>(false);
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
          const [loadedWorkouts, loadedRoutines, loadedPrs, loadedWalks, loadedFolders] = await Promise.all([
            getSavedWorkouts(user.id),
            getSavedRoutines(user.id),
            getSavedPRs(user.id),
            getSavedWalks(user.id),
            getSavedFolders(user.id),
          ]);
          setWorkouts(loadedWorkouts);
          setRoutines(loadedRoutines);
          setPersonalRecords(loadedPrs);
          setWalkingLogs(loadedWalks);
          setFolders(loadedFolders);
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
        const uid = firebaseUser.uid;
        let profile = await fetchProfileFromFirestore(uid);
        if (!profile) {
          const local = await getSavedProfile();
          if (local && local.id === uid) {
            profile = local;
          }
        }
        if (!profile) {
          const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Athlete';
          profile = {
            id: uid,
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
          syncProfileToFirestore(profile).catch(console.warn);
        }
        await saveProfile(profile);
        setCurrentUser(profile);

        // Fetch cloud data for workouts, walks, and routines
        try {
          const [cloudWorkouts, cloudWalks, cloudRoutines] = await Promise.all([
            fetchWorkoutsFromFirestore(uid),
            fetchWalksFromFirestore(uid),
            fetchRoutinesFromFirestore(uid),
          ]);
          if (cloudWorkouts.length > 0) {
            setWorkouts(cloudWorkouts);
            await saveWorkouts(uid, cloudWorkouts);
          }
          if (cloudWalks.length > 0) {
            setWalkingLogs(cloudWalks);
            await saveWalks(uid, cloudWalks);
          }
          if (cloudRoutines.length > 0) {
            setRoutines(cloudRoutines);
            await saveRoutines(uid, cloudRoutines);
          }
        } catch (e) {
          console.warn('Error fetching Firestore user data:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. User Data synchronization whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      (async () => {
        const [w, r, p, walks, f] = await Promise.all([
          getSavedWorkouts(currentUser.id),
          getSavedRoutines(currentUser.id),
          getSavedPRs(currentUser.id),
          getSavedWalks(currentUser.id),
          getSavedFolders(currentUser.id),
        ]);
        setWorkouts(w);
        setRoutines(r);
        setPersonalRecords(p);
        setWalkingLogs(walks);
        setFolders(f);
      })();
    } else {
      setWorkouts([]);
      setRoutines([]);
      setFolders(DEFAULT_FOLDERS);
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
          setTimerJustFinished(true);
          setTimeout(() => {
            setTimerJustFinished(false);
          }, 5000);
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
    setTimerJustFinished(false);
    setTimerExerciseName(name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stopRestTimer = useCallback(() => {
    setTimerIsRunning(false);
    setTimerSecondsRemaining(0);
    setTimerJustFinished(false);
  }, []);

  const addRestTimerSeconds = useCallback((delta: number) => {
    setTimerSecondsRemaining((prev) => Math.max(0, prev + delta));
    setTimerTotalSeconds((prev) => Math.max(0, prev + delta));
    setTimerJustFinished(false);
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
      const uid = res.user.uid;
      let profile = await fetchProfileFromFirestore(uid);
      if (!profile) {
        const local = await getSavedProfile();
        if (local && local.id === uid) {
          profile = local;
        } else {
          const displayName = res.user.displayName || email.split('@')[0] || 'Athlete';
          profile = {
            id: uid,
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
        }
        syncProfileToFirestore(profile).catch(console.warn);
      }
      await saveProfile(profile);
      setCurrentUser(profile);

      // Fetch cloud workouts, walks, and routines from Firestore
      try {
        const [cloudWorkouts, cloudWalks, cloudRoutines] = await Promise.all([
          fetchWorkoutsFromFirestore(uid),
          fetchWalksFromFirestore(uid),
          fetchRoutinesFromFirestore(uid),
        ]);
        if (cloudWorkouts.length > 0) {
          setWorkouts(cloudWorkouts);
          await saveWorkouts(uid, cloudWorkouts);
        }
        if (cloudWalks.length > 0) {
          setWalkingLogs(cloudWalks);
          await saveWalks(uid, cloudWalks);
        }
        if (cloudRoutines.length > 0) {
          setRoutines(cloudRoutines);
          await saveRoutines(uid, cloudRoutines);
        }
      } catch (err) {
        console.warn('Error fetching cloud data on login:', err);
      }

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
    let guestId = `guest-${Date.now()}`;
    if (isFirebaseConfigured()) {
      try {
        const anonUser = await loginAnonymousFirebaseUser();
        if (anonUser) {
          guestId = anonUser.uid;
        }
      } catch (err) {
        console.warn('Anonymous login skipped:', err);
      }
    }

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
      streakDays: 0,
      joinedDate: new Date().toISOString(),
    };

    await saveProfile(guestProfile);
    setCurrentUser(guestProfile);

    if (isFirebaseConfigured()) {
      syncProfileToFirestore(guestProfile).catch(console.warn);
    }
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
  // Routine & Folder Handlers
  // -------------------------------------------------------------
  const createFolder = useCallback(async (folderName: string, color?: string) => {
    const trimmed = folderName.trim();
    if (!trimmed) return;
    if (folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newFolder: RoutineFolder = {
      id: `f-${Date.now()}`,
      name: trimmed,
      color: color || '#3B82F6',
    };
    const next = [...folders, newFolder];
    setFolders(next);
    if (activeUser?.id) {
      await saveFolders(activeUser.id, next);
    }
  }, [activeUser?.id, folders]);

  const updateFolderColor = useCallback(async (folderName: string, color: string) => {
    const next = folders.map((f) => (f.name === folderName ? { ...f, color } : f));
    setFolders(next);
    if (activeUser?.id) {
      await saveFolders(activeUser.id, next);
    }
  }, [activeUser?.id, folders]);

  const deleteFolder = useCallback(async (folderName: string) => {
    const next = folders.filter((f) => f.name !== folderName);
    setFolders(next);
    const nextRoutines = routines.map((r) => (r.folder === folderName ? { ...r, folder: 'General' } : r));
    setRoutines(nextRoutines);
    if (activeUser?.id) {
      await saveFolders(activeUser.id, next);
      await saveRoutines(activeUser.id, nextRoutines);
    }
  }, [activeUser?.id, folders, routines]);

  const updateRoutineFolder = useCallback(async (id: string, folder: string) => {
    const next = routines.map((r) => (r.id === id ? { ...r, folder } : r));
    setRoutines(next);
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, next);
    }
    const target = next.find((r) => r.id === id);
    if (target && isFirebaseConfigured()) {
      syncRoutineToFirestore(target).catch(console.warn);
    }
  }, [activeUser?.id, routines]);

  const createRoutine = useCallback(async (title: string, description: string, category: string, exerciseIds: string[], folder?: string) => {
    const newRoutine: RoutineTemplate = {
      id: `rt-${Date.now()}`,
      userId: activeUser?.id || 'anonymous',
      title,
      description,
      category,
      folder: folder || 'General',
      exerciseIds,
    };
    const next = [newRoutine, ...routines];
    setRoutines(next);
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, next);
    }
    if (isFirebaseConfigured()) {
      syncRoutineToFirestore(newRoutine).catch(console.warn);
    }
  }, [activeUser?.id, routines]);

  const deleteRoutine = useCallback(async (id: string) => {
    const next = routines.filter((r) => r.id !== id);
    setRoutines(next);
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, next);
    }
    if (isFirebaseConfigured()) {
      deleteRoutineFromFirestore(id).catch(console.warn);
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
        const prescription = PPL_PRESCRIPTIONS[exId];

        const defaultReps = prescription?.targetReps || 10;
        const defaultSetsCount = prescription?.sets || 3;
        const defaultWeight = prescription?.defaultWeightKg || 0;

        return {
          id: `we-${Date.now()}-${idx}`,
          exerciseId: exId,
          exerciseName: name,
          category: cat,
          notes: prescription?.repRange || '',
          sets: Array.from({ length: defaultSetsCount }, (_, sIdx) => ({
            id: `s-${Date.now()}-${idx}-${sIdx}`,
            setNumber: sIdx + 1,
            type: 'regular',
            weight: defaultWeight,
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
    setIsWorkoutStarted(false);
    setIsWorkoutPaused(false);
    setWorkoutElapsedSeconds(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activeUser?.id]);

  const updateActiveSession = useCallback((updater: (prev: WorkoutLog) => WorkoutLog) => {
    setActiveSession((prev) => (prev ? updater(prev) : null));
  }, []);

  const finishSession = useCallback(async (): Promise<WorkoutLog | null> => {
    if (!activeSession) return null;

    // Only keep exercises that have at least one completed set with reps > 0
    // And within those exercises, only keep the sets that were actually completed
    const completedExercises = activeSession.exercises
      .map((ex) => ({
        ...ex,
        sets: ex.sets.filter((s) => s.completed && s.reps > 0),
      }))
      .filter((ex) => ex.sets.length > 0);

    // Do not save empty workout if user completed 0 sets
    if (completedExercises.length === 0) {
      setActiveSession(null);
      setIsWorkoutStarted(false);
      setIsWorkoutPaused(false);
      setWorkoutElapsedSeconds(0);
      stopRestTimer();
      return null;
    }

    let totalKg = 0;
    completedExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalKg += (s.weight || 0) * (s.reps || 0);
      });
    });

    const durationMins = Math.max(1, Math.round(workoutElapsedSeconds / 60) || 1);
    const finished: WorkoutLog = {
      ...activeSession,
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalVolume: totalKg,
      durationMinutes: durationMins,
      exercises: completedExercises,
    };

    await addWorkout(finished);
    setActiveSession(null);
    setIsWorkoutStarted(false);
    setIsWorkoutPaused(false);
    setWorkoutElapsedSeconds(0);
    stopRestTimer();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return finished;
  }, [activeSession, addWorkout, stopRestTimer, workoutElapsedSeconds]);

  const cancelSession = useCallback(() => {
    setActiveSession(null);
    setIsWorkoutStarted(false);
    setIsWorkoutPaused(false);
    setWorkoutElapsedSeconds(0);
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
    if (isFirebaseConfigured()) {
      syncWalkToFirestore(newWalk).catch(console.warn);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return newWalk;
  }, [activeUser?.id, walkingLogs]);

  const deleteWalk = useCallback(async (id: string) => {
    const userId = activeUser?.id || 'guest';
    const updated = walkingLogs.filter((w) => w.id !== id);
    setWalkingLogs(updated);
    await saveWalks(userId, updated);
    if (isFirebaseConfigured()) {
      deleteWalkFromFirestore(id).catch(console.warn);
    }
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
        folders,
        createRoutine,
        deleteRoutine,
        updateRoutineFolder,
        createFolder,
        updateFolderColor,
        deleteFolder,
        personalRecords,
        activeSession,
        startSession,
        updateActiveSession,
        finishSession,
        cancelSession,
        isWorkoutStarted,
        isWorkoutPaused,
        workoutElapsedSeconds,
        startActiveWorkout,
        togglePauseActiveWorkout,
        restTimer: {
          secondsRemaining: timerSecondsRemaining,
          totalSeconds: timerTotalSeconds,
          isRunning: timerIsRunning,
          isFinished: timerJustFinished,
          exerciseName: timerExerciseName,
          start: startRestTimer,
          stop: stopRestTimer,
          addSeconds: addRestTimerSeconds,
          dismissFinished: () => setTimerJustFinished(false),
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
