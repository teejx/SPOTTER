import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, AppState, AppStateStatus, Image } from 'react-native';
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
  WeightUnit,
  RoutineExerciseConfig,
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
  getPersistentGuestId,
  getSavedActiveSession,
  saveActiveSession,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  removeSyncQueueItem,
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
  ensureFirebaseAuthSession,
  deleteRoutineFromFirestore,
  fetchRoutinesFromFirestore,
  syncFoldersToFirestore,
  fetchFoldersFromFirestore,
} from '../lib/firebase';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS, DEFAULT_FOLDERS, DEFAULT_ROUTINES } from '../lib/seedData';
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
  setWeightUnit: (unit: WeightUnit) => Promise<void>;

  // Workouts (User-isolated)
  workouts: WorkoutLog[];
  addWorkout: (workout: Omit<WorkoutLog, 'id'>) => Promise<WorkoutLog>;
  deleteWorkout: (id: string) => Promise<void>;

  // Routines & Folders (User-isolated)
  routines: RoutineTemplate[];
  userRoutines: RoutineTemplate[];
  folders: RoutineFolder[];
  createRoutine: (
    title: string,
    description: string,
    category: string,
    exerciseIds: string[],
    folder?: string,
    routineExercises?: RoutineExerciseConfig[]
  ) => Promise<void>;
  updateRoutine: (routine: RoutineTemplate) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  updateRoutineFolder: (id: string, folder: string) => Promise<void>;
  createFolder: (folderName: string, color?: string) => Promise<void>;
  updateFolderColor: (folderName: string, color: string) => Promise<void>;
  renameFolder: (oldName: string, newName: string) => Promise<void>;
  deleteFolder: (folderName: string, deleteContents?: boolean) => Promise<void>;
  setFolderRoutines: (folderName: string, assignedRoutineIds: string[]) => Promise<void>;
  seedDefaultRoutines: () => Promise<void>;

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
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; error?: string }>;

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
  const [folders, setFolders] = useState<RoutineFolder[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutLog | null>(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0);

  // Timestamp-based tracking for background resilience
  const workoutStartTimeRef = React.useRef<number | null>(null);
  const pausedAccumulatorRef = React.useRef<number>(0);
  const pauseStartTimestampRef = React.useRef<number | null>(null);
  const restTimerTargetEndMsRef = React.useRef<number | null>(null);

  const calculateCurrentElapsed = useCallback(() => {
    if (!workoutStartTimeRef.current || !isWorkoutStarted) return 0;
    const now = Date.now();
    let currentPaused = pausedAccumulatorRef.current;
    if (isWorkoutPaused && pauseStartTimestampRef.current) {
      currentPaused += now - pauseStartTimestampRef.current;
    }
    const elapsedMs = Math.max(0, now - workoutStartTimeRef.current - currentPaused);
    return Math.floor(elapsedMs / 1000);
  }, [isWorkoutStarted, isWorkoutPaused]);

  // Synchronize workout elapsed timer on interval when active
  useEffect(() => {
    if (!activeSession || !isWorkoutStarted || isWorkoutPaused) return;
    const interval = setInterval(() => {
      setWorkoutElapsedSeconds(calculateCurrentElapsed());
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession, isWorkoutStarted, isWorkoutPaused, calculateCurrentElapsed]);

  const startActiveWorkout = useCallback(() => {
    if (!workoutStartTimeRef.current) {
      workoutStartTimeRef.current = Date.now() - (workoutElapsedSeconds * 1000);
    }
    setIsWorkoutStarted(true);
    setIsWorkoutPaused(false);
    pauseStartTimestampRef.current = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [workoutElapsedSeconds]);

  const togglePauseActiveWorkout = useCallback(() => {
    setIsWorkoutPaused((prev) => {
      const next = !prev;
      if (next) {
        pauseStartTimestampRef.current = Date.now();
      } else {
        if (pauseStartTimestampRef.current) {
          pausedAccumulatorRef.current += (Date.now() - pauseStartTimestampRef.current);
          pauseStartTimestampRef.current = null;
        }
      }
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
          let [loadedWorkouts, loadedRoutines, loadedPrs, loadedWalks, loadedFolders] = await Promise.all([
            getSavedWorkouts(user.id),
            getSavedRoutines(user.id),
            getSavedPRs(user.id),
            getSavedWalks(user.id),
            getSavedFolders(user.id),
          ]);

          // If user has no routines, populate DEFAULT_ROUTINES & DEFAULT_FOLDERS and sync to Firestore
          if (loadedRoutines.length === 0 && DEFAULT_ROUTINES.length > 0) {
            loadedRoutines = DEFAULT_ROUTINES.map((r) => ({
              ...r,
              id: `rt-init-${user.id}-${r.id}`,
              userId: user.id,
              createdAt: new Date().toISOString(),
            }));
            await saveRoutines(user.id, loadedRoutines);
            if (isFirebaseConfigured()) {
              loadedRoutines.forEach((r) => syncRoutineToFirestore(r).catch(console.warn));
            }
          }

          if (loadedFolders.length === 0 && DEFAULT_FOLDERS.length > 0) {
            loadedFolders = DEFAULT_FOLDERS;
            await saveFolders(user.id, loadedFolders);
            if (isFirebaseConfigured()) {
              syncFoldersToFirestore(user.id, loadedFolders).catch(console.warn);
            }
          }

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

      // Automatically prefetch and cache all exercise GIFs in background
      // so user does NOT have to open exercises one by one to use offline
      try {
        const gifUrls: string[] = [];
        EXERCISE_DATABASE.forEach((ex) => {
          if (ex.exerciseDbGifUrl) gifUrls.push(ex.exerciseDbGifUrl);
          if (ex.animationGifUrl) gifUrls.push(ex.animationGifUrl);
        });
        const uniqueGifs = Array.from(new Set(gifUrls));
        // Prefetch in non-blocking batches of 5 to avoid choking network
        (async () => {
          for (let i = 0; i < uniqueGifs.length; i += 5) {
            const batch = uniqueGifs.slice(i, i + 5);
            await Promise.all(
              batch.map((url) =>
                Image.prefetch(url).catch(() => {})
              )
            );
          }
        })();
      } catch (cacheErr) {
        console.warn('Background GIF cache failed:', cacheErr);
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

        // Merge cloud data with existing local data so offline workouts are NEVER lost/overwritten
        try {
          const [cloudWorkouts, cloudWalks, cloudRoutines, cloudFolders] = await Promise.all([
            fetchWorkoutsFromFirestore(uid),
            fetchWalksFromFirestore(uid),
            fetchRoutinesFromFirestore(uid),
            fetchFoldersFromFirestore(uid),
          ]);
          
          const localWorkouts = await getSavedWorkouts(uid);
          const workoutMap = new Map<string, WorkoutLog>();
          localWorkouts.forEach((w) => workoutMap.set(w.id, w));
          cloudWorkouts.forEach((w) => {
            if (!workoutMap.has(w.id)) {
              workoutMap.set(w.id, w);
            }
          });
          const mergedWorkouts = Array.from(workoutMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setWorkouts(mergedWorkouts);
          await saveWorkouts(uid, mergedWorkouts);

          const localWalks = await getSavedWalks(uid);
          const walkMap = new Map<string, WalkingLog>();
          localWalks.forEach((w) => walkMap.set(w.id, w));
          cloudWalks.forEach((w) => {
            if (!walkMap.has(w.id)) {
              walkMap.set(w.id, w);
            }
          });
          const mergedWalks = Array.from(walkMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setWalkingLogs(mergedWalks);
          await saveWalks(uid, mergedWalks);

          const localRoutines = await getSavedRoutines(uid);
          const routineMap = new Map<string, RoutineTemplate>();
          localRoutines.forEach((r) => routineMap.set(r.id, r));
          cloudRoutines.forEach((r) => {
            if (!routineMap.has(r.id)) {
              routineMap.set(r.id, r);
            }
          });
          let mergedRoutines = Array.from(routineMap.values());
          if (mergedRoutines.length === 0 && DEFAULT_ROUTINES.length > 0) {
            mergedRoutines = DEFAULT_ROUTINES.map((r) => ({
              ...r,
              id: `rt-init-${uid}-${r.id}`,
              userId: uid,
              createdAt: new Date().toISOString(),
            }));
            if (isFirebaseConfigured()) {
              mergedRoutines.forEach((r) => syncRoutineToFirestore(r).catch(console.warn));
            }
          }
          setRoutines(mergedRoutines);
          await saveRoutines(uid, mergedRoutines);

          // Merge Folders with cloud
          const localFolders = await getSavedFolders(uid);
          const folderMap = new Map<string, RoutineFolder>();
          cloudFolders.forEach((f) => folderMap.set(f.name.toLowerCase(), f));
          localFolders.forEach((f) => folderMap.set(f.name.toLowerCase(), f));

          // Ensure any folder referenced by routines is represented
          mergedRoutines.forEach((r) => {
            if (r.folder && r.folder !== 'All' && r.folder !== 'General') {
              const key = r.folder.toLowerCase();
              if (!folderMap.has(key)) {
                folderMap.set(key, {
                  id: `f-${r.folder.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                  name: r.folder,
                  color: '#EF4444',
                });
              }
            }
          });

          let mergedFolders = Array.from(folderMap.values());
          if (mergedFolders.length === 0 && DEFAULT_FOLDERS.length > 0) {
            mergedFolders = DEFAULT_FOLDERS;
            if (isFirebaseConfigured()) {
              syncFoldersToFirestore(uid, mergedFolders).catch(console.warn);
            }
          }
          setFolders(mergedFolders);
          await saveFolders(uid, mergedFolders);

          // If local has folders not yet in Firestore, sync to cloud
          if (mergedFolders.length > 0 && mergedFolders.length !== cloudFolders.length) {
            syncFoldersToFirestore(uid, mergedFolders).catch(console.warn);
          }

          // Upload any offline workouts that are present locally but missing in Firestore
          for (const w of localWorkouts) {
            if (!cloudWorkouts.some((cw) => cw.id === w.id)) {
              syncWorkoutToFirestore({ ...w, userId: uid }).catch(console.warn);
            }
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
        const [w, r, p, walks, f, savedActive] = await Promise.all([
          getSavedWorkouts(currentUser.id),
          getSavedRoutines(currentUser.id),
          getSavedPRs(currentUser.id),
          getSavedWalks(currentUser.id),
          getSavedFolders(currentUser.id),
          getSavedActiveSession(currentUser.id),
        ]);
        setWorkouts(w);
        setRoutines(r);
        setPersonalRecords(p);
        setWalkingLogs(walks);
        setFolders(f);

        if (savedActive && savedActive.session) {
          setActiveSession(savedActive.session);
          setIsWorkoutStarted(savedActive.isStarted);
          setIsWorkoutPaused(savedActive.isPaused);
          workoutStartTimeRef.current = savedActive.workoutStartTime;
          pausedAccumulatorRef.current = savedActive.pausedAccumulator;
          pauseStartTimestampRef.current = savedActive.pauseStartTimestamp;
          if (savedActive.restTimerTargetEndMs && savedActive.restTimerTargetEndMs > Date.now()) {
            restTimerTargetEndMsRef.current = savedActive.restTimerTargetEndMs;
            setTimerTotalSeconds(savedActive.restTimerTotalSeconds);
            setTimerSecondsRemaining(Math.ceil((savedActive.restTimerTargetEndMs - Date.now()) / 1000));
            setTimerIsRunning(true);
            setTimerExerciseName(savedActive.restTimerExerciseName);
          }
        }
      })();
    } else {
      setWorkouts([]);
      setRoutines([]);
      setFolders([]);
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

  const startRestTimer = useCallback((seconds: number, name?: string) => {
    const targetEnd = Date.now() + seconds * 1000;
    restTimerTargetEndMsRef.current = targetEnd;
    setTimerTotalSeconds(seconds);
    setTimerSecondsRemaining(seconds);
    setTimerIsRunning(true);
    setTimerJustFinished(false);
    setTimerExerciseName(name);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stopRestTimer = useCallback(() => {
    restTimerTargetEndMsRef.current = null;
    setTimerIsRunning(false);
    setTimerSecondsRemaining(0);
    setTimerJustFinished(false);
  }, []);

  const addRestTimerSeconds = useCallback((delta: number) => {
    if (restTimerTargetEndMsRef.current) {
      restTimerTargetEndMsRef.current += delta * 1000;
    }
    setTimerSecondsRemaining((prev) => Math.max(0, prev + delta));
    setTimerTotalSeconds((prev) => Math.max(0, prev + delta));
    setTimerJustFinished(false);
    Haptics.selectionAsync();
  }, []);

  // Rest Timer ticker using exact target timestamp
  useEffect(() => {
    if (!timerIsRunning || !restTimerTargetEndMsRef.current) return;

    const checkTimer = () => {
      if (!restTimerTargetEndMsRef.current) return;
      const now = Date.now();
      const remainingMs = restTimerTargetEndMsRef.current - now;
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingSec <= 0) {
        restTimerTargetEndMsRef.current = null;
        setTimerSecondsRemaining(0);
        setTimerIsRunning(false);
        setTimerJustFinished(true);
        setTimeout(() => {
          setTimerJustFinished(false);
        }, 5000);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setTimerSecondsRemaining(remainingSec);
        if (remainingSec <= 3 && remainingSec > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [timerIsRunning]);

  // AppState (Foreground <-> Background) handler to ensure timers run seamlessly
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App woke up from background/screen-off!
        if (workoutStartTimeRef.current && isWorkoutStarted && !isWorkoutPaused) {
          setWorkoutElapsedSeconds(calculateCurrentElapsed());
        }

        // Automatically reconcile and sync any offline workouts when internet returns or app wakes up
        syncNow().catch(() => {});

        if (restTimerTargetEndMsRef.current && timerIsRunning) {
          const now = Date.now();
          const remainingMs = restTimerTargetEndMsRef.current - now;
          const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
          if (remainingSec <= 0) {
            restTimerTargetEndMsRef.current = null;
            setTimerSecondsRemaining(0);
            setTimerIsRunning(false);
            setTimerJustFinished(true);
            setTimeout(() => setTimerJustFinished(false), 5000);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            setTimerSecondsRemaining(remainingSec);
          }
        }
      }
    });

    return () => subscription.remove();
  }, [isWorkoutStarted, isWorkoutPaused, timerIsRunning, calculateCurrentElapsed]);

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

      // Merge cloud data with existing local data so offline workouts are NEVER lost/overwritten
      try {
        const [cloudWorkouts, cloudWalks, cloudRoutines, cloudFolders] = await Promise.all([
          fetchWorkoutsFromFirestore(uid),
          fetchWalksFromFirestore(uid),
          fetchRoutinesFromFirestore(uid),
          fetchFoldersFromFirestore(uid),
        ]);
        
        const localWorkouts = await getSavedWorkouts(uid);
        const workoutMap = new Map<string, WorkoutLog>();
        localWorkouts.forEach((w) => workoutMap.set(w.id, w));
        cloudWorkouts.forEach((w) => {
          if (!workoutMap.has(w.id)) {
            workoutMap.set(w.id, w);
          }
        });
        const mergedWorkouts = Array.from(workoutMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setWorkouts(mergedWorkouts);
        await saveWorkouts(uid, mergedWorkouts);

        const localWalks = await getSavedWalks(uid);
        const walkMap = new Map<string, WalkingLog>();
        localWalks.forEach((w) => walkMap.set(w.id, w));
        cloudWalks.forEach((w) => {
          if (!walkMap.has(w.id)) {
            walkMap.set(w.id, w);
          }
        });
        const mergedWalks = Array.from(walkMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setWalkingLogs(mergedWalks);
        await saveWalks(uid, mergedWalks);

        const localRoutines = await getSavedRoutines(uid);
        const routineMap = new Map<string, RoutineTemplate>();
        localRoutines.forEach((r) => routineMap.set(r.id, r));
        cloudRoutines.forEach((r) => {
          if (!routineMap.has(r.id)) {
            routineMap.set(r.id, r);
          }
        });
        let mergedRoutines = Array.from(routineMap.values());
        if (mergedRoutines.length === 0 && DEFAULT_ROUTINES.length > 0) {
          mergedRoutines = DEFAULT_ROUTINES.map((r) => ({
            ...r,
            id: `rt-init-${uid}-${r.id}`,
            userId: uid,
            createdAt: new Date().toISOString(),
          }));
          if (isFirebaseConfigured()) {
            mergedRoutines.forEach((r) => syncRoutineToFirestore(r).catch(console.warn));
          }
        }
        setRoutines(mergedRoutines);
        await saveRoutines(uid, mergedRoutines);

        // Merge Folders with cloud
        const localFolders = await getSavedFolders(uid);
        const folderMap = new Map<string, RoutineFolder>();
        cloudFolders.forEach((f) => folderMap.set(f.name.toLowerCase(), f));
        localFolders.forEach((f) => folderMap.set(f.name.toLowerCase(), f));

        // Ensure any folder referenced by routines is represented
        mergedRoutines.forEach((r) => {
          if (r.folder && r.folder !== 'All' && r.folder !== 'General') {
            const key = r.folder.toLowerCase();
            if (!folderMap.has(key)) {
              folderMap.set(key, {
                id: `f-${r.folder.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: r.folder,
                color: '#EF4444',
              });
            }
          }
        });

        let mergedFolders = Array.from(folderMap.values());
        if (mergedFolders.length === 0 && DEFAULT_FOLDERS.length > 0) {
          mergedFolders = DEFAULT_FOLDERS;
          if (isFirebaseConfigured()) {
            syncFoldersToFirestore(uid, mergedFolders).catch(console.warn);
          }
        }
        setFolders(mergedFolders);
        await saveFolders(uid, mergedFolders);

        // If local has folders not yet in Firestore, sync to cloud
        if (mergedFolders.length > 0 && mergedFolders.length !== cloudFolders.length) {
          syncFoldersToFirestore(uid, mergedFolders).catch(console.warn);
        }

        // Upload any offline workouts that are present locally but missing in Firestore
        for (const w of localWorkouts) {
          if (!cloudWorkouts.some((cw) => cw.id === w.id)) {
            syncWorkoutToFirestore({ ...w, userId: uid }).catch(console.warn);
          }
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

      try {
        const [loadedWorkouts, loadedRoutines, loadedPrs, loadedWalks, loadedFolders] = await Promise.all([
          getSavedWorkouts(account.profile.id),
          getSavedRoutines(account.profile.id),
          getSavedPRs(account.profile.id),
          getSavedWalks(account.profile.id),
          getSavedFolders(account.profile.id),
        ]);
        setWorkouts(loadedWorkouts);
        setRoutines(loadedRoutines);
        setPersonalRecords(loadedPrs);
        setWalkingLogs(loadedWalks);
        setFolders(loadedFolders);
      } catch (err) {
        console.warn('Error loading account data:', err);
      }

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

    // Initialize routines and folders for new user
    try {
      let [loadedRoutines, loadedFolders] = await Promise.all([
        getSavedRoutines(uid),
        getSavedFolders(uid),
      ]);
      if (loadedRoutines.length === 0 && DEFAULT_ROUTINES.length > 0) {
        loadedRoutines = DEFAULT_ROUTINES.map((r) => ({
          ...r,
          id: `rt-init-${uid}-${r.id}`,
          userId: uid,
          createdAt: new Date().toISOString(),
        }));
        await saveRoutines(uid, loadedRoutines);
        if (isFirebaseConfigured()) {
          loadedRoutines.forEach((r) => syncRoutineToFirestore(r).catch(console.warn));
        }
      }
      if (loadedFolders.length === 0 && DEFAULT_FOLDERS.length > 0) {
        loadedFolders = DEFAULT_FOLDERS;
        await saveFolders(uid, loadedFolders);
        if (isFirebaseConfigured()) {
          syncFoldersToFirestore(uid, loadedFolders).catch(console.warn);
        }
      }
      setWorkouts([]);
      setRoutines(loadedRoutines);
      setPersonalRecords([]);
      setWalkingLogs([]);
      setFolders(loadedFolders);
    } catch (err) {
      console.warn('Error initializing new user state:', err);
    }

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
    setWorkouts([]);
    setWalkingLogs([]);
  }, [stopRestTimer]);

  const loginGuest = useCallback(async (options?: {
    name?: string;
    trainingGoal?: UserProfile['trainingGoal'];
    weight?: number;
    unit?: 'kg' | 'lbs';
  }) => {
    let guestId = await getPersistentGuestId();
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

    // Load all local data for guest immediately
    try {
      let [loadedWorkouts, loadedRoutines, loadedPrs, loadedWalks, loadedFolders] = await Promise.all([
        getSavedWorkouts(guestId),
        getSavedRoutines(guestId),
        getSavedPRs(guestId),
        getSavedWalks(guestId),
        getSavedFolders(guestId),
      ]);
      if (loadedRoutines.length === 0 && DEFAULT_ROUTINES.length > 0) {
        loadedRoutines = DEFAULT_ROUTINES.map((r) => ({
          ...r,
          id: `rt-init-${guestId}-${r.id}`,
          userId: guestId,
          createdAt: new Date().toISOString(),
        }));
        await saveRoutines(guestId, loadedRoutines);
        if (isFirebaseConfigured()) {
          loadedRoutines.forEach((r) => syncRoutineToFirestore(r).catch(console.warn));
        }
      }
      if (loadedFolders.length === 0 && DEFAULT_FOLDERS.length > 0) {
        loadedFolders = DEFAULT_FOLDERS;
        await saveFolders(guestId, loadedFolders);
        if (isFirebaseConfigured()) {
          syncFoldersToFirestore(guestId, loadedFolders).catch(console.warn);
        }
      }
      setWorkouts(loadedWorkouts);
      setRoutines(loadedRoutines);
      setPersonalRecords(loadedPrs);
      setWalkingLogs(loadedWalks);
      setFolders(loadedFolders);
    } catch (err) {
      console.warn('Error loading guest data:', err);
    }

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

  const setWeightUnit = useCallback(async (unit: WeightUnit) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, weightUnit: unit };
    await updateProfile(updated);
  }, [currentUser, updateProfile]);

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
      await addToSyncQueue(activeUser.id, 'upsert_workout', newWorkout);
    }

    if (isFirebaseConfigured() && activeUser?.id) {
      syncWorkoutToFirestore(newWorkout)
        .then(() => {
          removeSyncQueueItem(activeUser.id, newWorkout.id);
          setLastSyncedAt(new Date());
        })
        .catch((err) => {
          console.warn('Saved offline: workout queued to sync to database once internet returns', err);
        });
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
      await addToSyncQueue(activeUser.id, 'delete_workout', { id });
    }
    if (isFirebaseConfigured() && activeUser?.id) {
      deleteWorkoutFromFirestore(id)
        .then(() => removeSyncQueueItem(activeUser.id, id))
        .catch(console.warn);
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
      await addToSyncQueue(activeUser.id, 'sync_folders', next);
      if (isFirebaseConfigured()) {
        syncFoldersToFirestore(activeUser.id, next).catch(console.warn);
      }
    }
  }, [activeUser?.id, folders]);

  const updateFolderColor = useCallback(async (folderName: string, color: string) => {
    const next = folders.map((f) => (f.name === folderName ? { ...f, color } : f));
    setFolders(next);
    if (activeUser?.id) {
      await saveFolders(activeUser.id, next);
      await addToSyncQueue(activeUser.id, 'sync_folders', next);
      if (isFirebaseConfigured()) {
        syncFoldersToFirestore(activeUser.id, next).catch(console.warn);
      }
    }
  }, [activeUser?.id, folders]);

  const renameFolder = useCallback(async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase() && f.name.toLowerCase() !== oldName.toLowerCase())) {
      return;
    }
    const nextFolders = folders.map((f) => (f.name === oldName ? { ...f, name: trimmed } : f));
    const nextRoutines = routines.map((r) => (r.folder === oldName ? { ...r, folder: trimmed } : r));
    setFolders(nextFolders);
    setRoutines(nextRoutines);
    if (activeUser?.id) {
      await saveFolders(activeUser.id, nextFolders);
      await saveRoutines(activeUser.id, nextRoutines);
      await addToSyncQueue(activeUser.id, 'sync_folders', nextFolders);
      if (isFirebaseConfigured()) {
        syncFoldersToFirestore(activeUser.id, nextFolders).catch(console.warn);
        for (const nr of nextRoutines) {
          if (nr.folder === trimmed) {
            syncRoutineToFirestore({ ...nr, userId: activeUser.id }).catch(console.warn);
          }
        }
      }
    }
  }, [activeUser?.id, folders, routines]);

  const deleteFolder = useCallback(async (folderName: string, deleteContents: boolean = false) => {
    const next = folders.filter((f) => f.name !== folderName);
    setFolders(next);
    let nextRoutines: RoutineTemplate[];
    if (deleteContents) {
      nextRoutines = routines.filter((r) => r.folder !== folderName);
    } else {
      nextRoutines = routines.map((r) => (r.folder === folderName ? { ...r, folder: undefined } : r));
    }
    setRoutines(nextRoutines);
    if (activeUser?.id) {
      await saveFolders(activeUser.id, next);
      await saveRoutines(activeUser.id, nextRoutines);
      await addToSyncQueue(activeUser.id, 'sync_folders', next);
      if (isFirebaseConfigured()) {
        syncFoldersToFirestore(activeUser.id, next).catch(console.warn);
      }
      if (deleteContents) {
        const deletedRoutines = routines.filter((r) => r.folder === folderName);
        for (const dr of deletedRoutines) {
          await addToSyncQueue(activeUser.id, 'delete_routine', { id: dr.id });
        }
      } else {
        const updatedRoutines = nextRoutines.filter((r) =>
          routines.some((old) => old.id === r.id && old.folder === folderName)
        );
        for (const ur of updatedRoutines) {
          await addToSyncQueue(activeUser.id, 'upsert_routine', ur);
        }
      }
    }
  }, [activeUser?.id, folders, routines]);

  const setFolderRoutines = useCallback(async (folderName: string, assignedRoutineIds: string[]) => {
    const assignedSet = new Set(assignedRoutineIds);
    const nextRoutines = routines.map((r) => {
      const isAssigned = assignedSet.has(r.id);
      if (isAssigned) {
        return r.folder === folderName ? r : { ...r, folder: folderName };
      } else if (r.folder === folderName) {
        return { ...r, folder: undefined };
      }
      return r;
    });
    setRoutines(nextRoutines);
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, nextRoutines);
      const changed = nextRoutines.filter((r) => {
        const old = routines.find((o) => o.id === r.id);
        return old && old.folder !== r.folder;
      });
      for (const cr of changed) {
        await addToSyncQueue(activeUser.id, 'upsert_routine', cr);
      }
    }
  }, [activeUser?.id, routines]);

  const updateRoutineFolder = useCallback(async (id: string, folder: string) => {
    let nextList: RoutineTemplate[] = [];
    setRoutines((prev) => {
      nextList = prev.map((r) => (r.id === id ? { ...r, folder } : r));
      return nextList;
    });
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, nextList);
      const target = nextList.find((r) => r.id === id);
      if (target) {
        await addToSyncQueue(activeUser.id, 'upsert_routine', target);
      }
    }
    if (isFirebaseConfigured() && activeUser?.id) {
      const target = nextList.find((r) => r.id === id);
      if (target) {
        syncRoutineToFirestore(target)
          .then(() => removeSyncQueueItem(activeUser.id, id))
          .catch(console.warn);
      }
    }
  }, [activeUser?.id]);

  const updateRoutine = useCallback(async (routine: RoutineTemplate) => {
    let nextList: RoutineTemplate[] = [];
    setRoutines((prev) => {
      const exists = prev.some((r) => r.id === routine.id);
      nextList = exists ? prev.map((r) => (r.id === routine.id ? routine : r)) : [routine, ...prev];
      return nextList;
    });
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, nextList);
      await addToSyncQueue(activeUser.id, 'upsert_routine', routine);
    }
    if (isFirebaseConfigured() && activeUser?.id) {
      syncRoutineToFirestore(routine)
        .then(() => removeSyncQueueItem(activeUser.id, routine.id))
        .catch(console.warn);
    }
  }, [activeUser?.id]);

  const createRoutine = useCallback(async (
    title: string,
    description: string,
    category: string,
    exerciseIds: string[],
    folder?: string,
    routineExercises?: RoutineExerciseConfig[]
  ) => {
    const newRoutine: RoutineTemplate = {
      id: `rt-${Date.now()}`,
      userId: activeUser?.id || 'anonymous',
      title,
      description,
      category,
      folder: folder || 'General',
      exerciseIds,
      routineExercises,
    };
    let nextList: RoutineTemplate[] = [];
    setRoutines((prev) => {
      nextList = [newRoutine, ...prev.filter((r) => r.id !== newRoutine.id)];
      return nextList;
    });
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, nextList);
      await addToSyncQueue(activeUser.id, 'upsert_routine', newRoutine);
    }
    if (isFirebaseConfigured() && activeUser?.id) {
      syncRoutineToFirestore(newRoutine)
        .then(() => removeSyncQueueItem(activeUser.id, newRoutine.id))
        .catch(console.warn);
    }
  }, [activeUser?.id]);

  const deleteRoutine = useCallback(async (id: string) => {
    let nextList: RoutineTemplate[] = [];
    setRoutines((prev) => {
      nextList = prev.filter((r) => r.id !== id);
      return nextList;
    });
    if (activeUser?.id) {
      await saveRoutines(activeUser.id, nextList);
      await addToSyncQueue(activeUser.id, 'delete_routine', { id });
    }
    if (isFirebaseConfigured() && activeUser?.id) {
      deleteRoutineFromFirestore(id)
        .then(() => removeSyncQueueItem(activeUser.id, id))
        .catch(console.warn);
    }
  }, [activeUser?.id]);

  const seedDefaultRoutines = useCallback(async () => {
    if (!activeUser?.id) return;
    const uid = activeUser.id;

    const newSeeded: RoutineTemplate[] = DEFAULT_ROUTINES.map((r) => ({
      ...r,
      id: `rt-ppl-${Date.now()}-${r.id}`,
      userId: uid,
      createdAt: new Date().toISOString(),
    }));

    let nextRoutines: RoutineTemplate[] = [];
    setRoutines((prev) => {
      const existingTitles = new Set(prev.map((p) => p.title.toLowerCase().trim()));
      const toAdd = newSeeded.filter((r) => !existingTitles.has(r.title.toLowerCase().trim()));
      nextRoutines = [...prev, ...toAdd];
      return nextRoutines;
    });

    if (activeUser?.id) {
      await saveRoutines(uid, nextRoutines);
      for (const r of newSeeded) {
        await addToSyncQueue(uid, 'upsert_routine', r);
      }
    }

    let nextFolders: RoutineFolder[] = [];
    setFolders((prev) => {
      const hasFolder = prev.some((f) => f.name.toLowerCase() === 'push pull legs');
      if (!hasFolder) {
        nextFolders = [
          ...prev,
          {
            id: 'f-push-pull-legs',
            name: 'Push Pull Legs',
            color: '#EF4444',
          },
        ];
      } else {
        nextFolders = prev;
      }
      return nextFolders;
    });

    if (activeUser?.id) {
      await saveFolders(uid, nextFolders);
    }

    if (isFirebaseConfigured() && activeUser?.id) {
      for (const r of newSeeded) {
        syncRoutineToFirestore(r)
          .then(() => removeSyncQueueItem(uid, r.id))
          .catch(console.warn);
      }
      syncFoldersToFirestore(uid, nextFolders).catch(console.warn);
    }
  }, [activeUser?.id]);

  // -------------------------------------------------------------
  // Live Workout Session
  // -------------------------------------------------------------
  const startSession = useCallback((routine?: RoutineTemplate) => {
    let initialExercises: WorkoutExercise[] = [];

    if (routine && routine.exerciseIds.length > 0) {
      initialExercises = routine.exerciseIds.map((exId, idx) => {
        const def = EXERCISE_DATABASE.find((e) => e.id === exId);
        const name = def?.name || `Exercise ${idx + 1}`;
        const cat = def?.category || 'Chest';
        const prescription = PPL_PRESCRIPTIONS[exId];

        // Check if user set custom targetSets, targetReps, defaultWeight in routine template
        const customConfig = routine.routineExercises?.find((c) => c.exerciseId === exId);

        const targetSetsCount = customConfig ? customConfig.targetSets : (prescription?.sets || 3);
        const targetReps = customConfig ? customConfig.targetReps : (prescription?.targetReps || 10);
        const defaultWeight = customConfig
          ? customConfig.defaultWeight
          : (prescription?.defaultWeightKg || 0);
        const exerciseUnit = customConfig?.weightUnit || activeUser?.weightUnit || 'kg';

        return {
          id: `we-${Date.now()}-${idx}`,
          exerciseId: exId,
          exerciseName: name,
          category: cat,
          notes: prescription?.repRange || '',
          weightUnit: exerciseUnit,
          sets: Array.from({ length: targetSetsCount }, (_, sIdx) => ({
            id: `s-${Date.now()}-${idx}-${sIdx}`,
            setNumber: sIdx + 1,
            type: 'regular',
            weight: defaultWeight,
            reps: targetReps,
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
      weightUnit: activeUser?.weightUnit || 'kg',
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

    const sessionUnit = activeSession.weightUnit || activeUser?.weightUnit || 'kg';
    let totalVolume = 0;
    completedExercises.forEach((ex) => {
      const exUnit = ex.weightUnit || sessionUnit;
      ex.sets.forEach((s) => {
        if (!s.weight || !s.reps) return;
        let weightInSessionUnit = s.weight;
        if (exUnit === 'lbs' && sessionUnit === 'kg') {
          weightInSessionUnit = s.weight / 2.20462;
        } else if (exUnit === 'kg' && sessionUnit === 'lbs') {
          weightInSessionUnit = s.weight * 2.20462;
        }
        totalVolume += weightInSessionUnit * s.reps;
      });
    });

    const durationMins = Math.max(1, Math.round(workoutElapsedSeconds / 60) || 1);
    const finished: WorkoutLog = {
      ...activeSession,
      weightUnit: sessionUnit,
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalVolume: Math.round(totalVolume * 10) / 10,
      durationMinutes: durationMins,
      exercises: completedExercises,
    };

    await addWorkout(finished);
    if (activeUser?.id) {
      await saveActiveSession(activeUser.id, null);
    }
    workoutStartTimeRef.current = null;
    pausedAccumulatorRef.current = 0;
    pauseStartTimestampRef.current = null;
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


  // -------------------------------------------------------------
  // Offline-First Cloud Synchronization Engine
  // -------------------------------------------------------------
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const isSyncInProgressRef = React.useRef(false);

  const syncNow = useCallback(async (): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
    if (!isFirebaseConfigured() || !activeUser?.id) {
      return { success: false, syncedCount: 0, error: 'Firebase is not configured or user is not logged in.' };
    }

    if (isSyncInProgressRef.current) {
      return { success: false, syncedCount: 0, error: 'Sync already in progress.' };
    }

    isSyncInProgressRef.current = true;
    setIsSyncing(true);

    try {
      await ensureFirebaseAuthSession(activeUser.id);
      const uid = activeUser.id;
      let syncedCount = 0;

      // 1. Load all local records
      const localWorkouts = await getSavedWorkouts(uid);
      const localWalks = await getSavedWalks(uid);
      const localRoutines = await getSavedRoutines(uid);
      const localFolders = await getSavedFolders(uid);

      // 2. Process Sync Queue for pending mutations
      const queue = await getSyncQueue(uid);
      for (const item of queue) {
        try {
          if (item.action === 'upsert_workout') {
            await syncWorkoutToFirestore(item.payload);
            syncedCount++;
          } else if (item.action === 'delete_workout') {
            await deleteWorkoutFromFirestore(item.payload.id);
          } else if (item.action === 'upsert_walk') {
            await syncWalkToFirestore(item.payload);
          } else if (item.action === 'delete_walk') {
            await deleteWalkFromFirestore(item.payload.id);
          } else if (item.action === 'upsert_routine') {
            await syncRoutineToFirestore(item.payload);
          } else if (item.action === 'delete_routine') {
            await deleteRoutineFromFirestore(item.payload.id);
          } else if (item.action === 'sync_folders') {
            await syncFoldersToFirestore(uid, item.payload);
            syncedCount++;
          } else if (item.action === 'upsert_profile') {
            await syncProfileToFirestore(item.payload);
          }
          await removeSyncQueueItem(uid, item.id);
        } catch (queueErr) {
          console.warn('Queue item sync error, skipping item:', queueErr);
          // Do not break; continue with next items so one transient error doesn't block the rest
          continue;
        }
      }

      // 3. Full Workouts Cloud Reconciliation (Ensures zero lost offline workouts)
      const cloudWorkouts = await fetchWorkoutsFromFirestore(uid);
      const cloudWorkoutIds = new Set(cloudWorkouts.map((w) => w.id));

      for (const w of localWorkouts) {
        if (!cloudWorkoutIds.has(w.id)) {
          const toUpload = { ...w, userId: uid };
          await syncWorkoutToFirestore(toUpload);
          cloudWorkoutIds.add(w.id);
          syncedCount++;
        }
      }

      const localWorkoutIds = new Set(localWorkouts.map((w) => w.id));
      const missingWorkoutsLocally = cloudWorkouts.filter((w) => !localWorkoutIds.has(w.id));
      if (missingWorkoutsLocally.length > 0) {
        const merged = [...localWorkouts, ...missingWorkoutsLocally].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setWorkouts(merged);
        await saveWorkouts(uid, merged);
      }

      // 4. Walks Cloud Reconciliation
      const cloudWalks = await fetchWalksFromFirestore(uid);
      const cloudWalkIds = new Set(cloudWalks.map((w) => w.id));
      for (const walk of localWalks) {
        if (!cloudWalkIds.has(walk.id)) {
          await syncWalkToFirestore({ ...walk, userId: uid });
          cloudWalkIds.add(walk.id);
        }
      }
      const localWalkIds = new Set(localWalks.map((w) => w.id));
      const missingWalksLocally = cloudWalks.filter((w) => !localWalkIds.has(w.id));
      if (missingWalksLocally.length > 0) {
        const mergedWalks = [...localWalks, ...missingWalksLocally].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setWalkingLogs(mergedWalks);
        await saveWalks(uid, mergedWalks);
      }

      // 5. Routines Cloud Reconciliation
      const cloudRoutines = await fetchRoutinesFromFirestore(uid);
      for (const r of localRoutines) {
        await syncRoutineToFirestore({ ...r, userId: uid });
      }
      const localRoutineIds = new Set(localRoutines.map((r) => r.id));
      const missingRoutinesLocally = cloudRoutines.filter((r) => !localRoutineIds.has(r.id));
      if (missingRoutinesLocally.length > 0) {
        const mergedRoutines = [...localRoutines, ...missingRoutinesLocally];
        setRoutines(mergedRoutines);
        await saveRoutines(uid, mergedRoutines);
      }

      // 5b. Folders Cloud Reconciliation
      const cloudFolders = await fetchFoldersFromFirestore(uid);
      const folderMap = new Map<string, RoutineFolder>();
      cloudFolders.forEach((f) => folderMap.set(f.name.toLowerCase(), f));
      localFolders.forEach((f) => folderMap.set(f.name.toLowerCase(), f));
      const mergedFolders = Array.from(folderMap.values());
      if (mergedFolders.length > 0) {
        await syncFoldersToFirestore(uid, mergedFolders);
        setFolders(mergedFolders);
        await saveFolders(uid, mergedFolders);
      }

      // 6. Profile Sync
      if (activeUser) {
        await syncProfileToFirestore(activeUser);
      }

      setLastSyncedAt(new Date());
      return { success: true, syncedCount, error: undefined };
    } catch (err: any) {
      console.warn('Sync encounter error:', err);
      return { success: false, syncedCount: 0, error: err.message || 'Offline or network error' };
    } finally {
      setIsSyncing(false);
      isSyncInProgressRef.current = false;
    }
  }, [activeUser]);

  // Periodic Auto-Sync Interval (every 30 seconds when online)
  useEffect(() => {
    if (!activeUser?.id || !isFirebaseConfigured()) return;
    const interval = setInterval(() => {
      syncNow().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [activeUser?.id, syncNow]);

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
        setWeightUnit,
        workouts,
        addWorkout,
        deleteWorkout,
        routines,
        userRoutines: routines,
        updateRoutine,
        folders,
        createRoutine,
        deleteRoutine,
        updateRoutineFolder,
        createFolder,
        updateFolderColor,
        renameFolder,
        deleteFolder,
        setFolderRoutines,
        seedDefaultRoutines,
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
        isSyncing,
        lastSyncedAt,
        syncNow,
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
