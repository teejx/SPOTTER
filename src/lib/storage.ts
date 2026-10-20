import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, WorkoutLog, RoutineTemplate, PersonalRecord, WalkingLog, ThemeId, ColorMode, RoutineFolder } from '../types';
import { DEFAULT_FOLDER_COLORS, DEFAULT_ROUTINES, DEFAULT_FOLDERS } from './seedData';

const CURRENT_USER_KEY = 'kinetic_native_auth_user_v2';
const REGISTERED_ACCOUNTS_KEY = 'kinetic_native_accounts_v2';
const SAVED_THEME_KEY = 'spotter_app_theme_v1';
const SAVED_COLOR_MODE_KEY = 'spotter_app_color_mode_v1';

export interface LocalAccountRecord {
  id: string;
  email: string;
  password?: string;
  profile: UserProfile;
}

// -------------------------------------------------------------
// Multi-Account Registry
// -------------------------------------------------------------
export async function getRegisteredAccounts(): Promise<LocalAccountRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    const parsed: LocalAccountRecord[] = raw ? JSON.parse(raw) : [];
    const cleaned = parsed.filter((a) => a.id !== 'athlete-titan-demo' && a.email.toLowerCase() !== 'titan@spotter.app');
    if (cleaned.length !== parsed.length) {
      await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export async function saveRegisteredAccount(record: LocalAccountRecord): Promise<void> {
  try {
    const accounts = await getRegisteredAccounts();
    const filtered = accounts.filter((a) => a.id !== record.id && a.email.toLowerCase() !== record.email.toLowerCase());
    filtered.push(record);
    await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save account record:', e);
  }
}

export async function findRegisteredAccount(email: string): Promise<LocalAccountRecord | null> {
  const q = email.trim().toLowerCase();
  const accounts = await getRegisteredAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === q);
  return found || null;
}

// -------------------------------------------------------------
// Active Authenticated Profile
// -------------------------------------------------------------
export async function getSavedProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!data) {
      return null;
    }
    const parsed = JSON.parse(data);
    if (parsed && (parsed.id === 'athlete-titan-demo' || parsed.email === 'titan@spotter.app')) {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    if (parsed && parsed.name && parsed.name.includes('@')) {
      parsed.name = parsed.name.split('@')[0];
      parsed.handle = `@${parsed.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile | null): Promise<void> {
  try {
    if (profile) {
      const cleanName = profile.name.includes('@') ? profile.name.split('@')[0] : profile.name;
      const cleanProfile: UserProfile = {
        ...profile,
        name: cleanName,
        handle: profile.handle && !profile.handle.includes('@')
          ? `@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
          : profile.handle,
      };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cleanProfile));
    } else {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

const PERSISTENT_GUEST_ID_KEY = 'kinetic_native_guest_user_id_v1';

export async function getPersistentGuestId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(PERSISTENT_GUEST_ID_KEY);
    if (!id) {
      id = `guest_${Date.now()}`;
      await AsyncStorage.setItem(PERSISTENT_GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return `guest_athlete_${Date.now()}`;
  }
}

// -------------------------------------------------------------
// Workouts (User-Isolated, Pure User Data Only)
// -------------------------------------------------------------
export async function getSavedWorkouts(userId: string): Promise<WorkoutLog[]> {
  if (!userId) return [];
  try {
    const data = await AsyncStorage.getItem(`kinetic_workouts_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Strip out any built-in sample workouts
        const clean = parsed.filter((w) => !w.id.startsWith('sample-w-'));
        if (clean.length !== parsed.length) {
          await AsyncStorage.setItem(`kinetic_workouts_${userId}`, JSON.stringify(clean));
        }
        return clean;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveWorkouts(userId: string, workouts: WorkoutLog[]): Promise<void> {
  if (!userId) return;
  try {
    const clean = workouts.filter((w) => !w.id.startsWith('sample-w-'));
    await AsyncStorage.setItem(`kinetic_workouts_${userId}`, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save workouts:', e);
  }
}

// -------------------------------------------------------------
// Routines (User-Isolated, Never Overwrites User Edits)
// -------------------------------------------------------------
export async function getSavedRoutines(userId: string): Promise<RoutineTemplate[]> {
  if (!userId) return [];
  try {
    const data = await AsyncStorage.getItem(`kinetic_routines_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveRoutines(userId: string, routines: RoutineTemplate[]): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(`kinetic_routines_${userId}`, JSON.stringify(routines));
  } catch (e) {
    console.error('Failed to save routines:', e);
  }
}

// -------------------------------------------------------------
// Routine Folders (User-Isolated, Fully User-Managed)
// -------------------------------------------------------------
export async function getSavedFolders(userId: string): Promise<RoutineFolder[]> {
  if (!userId) return [];
  try {
    const data = await AsyncStorage.getItem(`spotter_folders_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (typeof item === 'string') {
            return {
              id: `f-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: item,
              color: DEFAULT_FOLDER_COLORS[item] || '#3B82F6',
            };
          }
          return {
            id: item.id || `f-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name: item.name,
            color: item.color || DEFAULT_FOLDER_COLORS[item.name] || '#3B82F6',
          };
        });
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveFolders(userId: string, folders: RoutineFolder[]): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(`spotter_folders_${userId}`, JSON.stringify(folders));
  } catch (e) {
    console.error('Failed to save folders:', e);
  }
}

// -------------------------------------------------------------
// Personal Records (User-Isolated)
// -------------------------------------------------------------
export async function getSavedPRs(userId: string): Promise<PersonalRecord[]> {
  if (!userId) return [];
  try {
    const data = await AsyncStorage.getItem(`kinetic_prs_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePRs(userId: string, prs: PersonalRecord[]): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(`kinetic_prs_${userId}`, JSON.stringify(prs));
  } catch (e) {
    console.error('Failed to save PRs:', e);
  }
}

// Calculate Epley 1RM formula
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// -------------------------------------------------------------
// Walking Activity Logs (User-Isolated, Pure User Data Only)
// -------------------------------------------------------------
export async function getSavedWalks(userId: string): Promise<WalkingLog[]> {
  if (!userId) return [];
  try {
    const data = await AsyncStorage.getItem(`spotter_walks_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((w) => !w.id.startsWith('sample-walk-'));
        if (clean.length !== parsed.length) {
          await AsyncStorage.setItem(`spotter_walks_${userId}`, JSON.stringify(clean));
        }
        return clean;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveWalks(userId: string, walks: WalkingLog[]): Promise<void> {
  if (!userId) return;
  try {
    const clean = walks.filter((w) => !w.id.startsWith('sample-walk-'));
    await AsyncStorage.setItem(`spotter_walks_${userId}`, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save walking logs:', e);
  }
}

// -------------------------------------------------------------
// Active Workout Session Background Persistence
// -------------------------------------------------------------
export interface SavedActiveSessionState {
  session: WorkoutLog;
  isStarted: boolean;
  isPaused: boolean;
  workoutStartTime: number | null;
  pausedAccumulator: number;
  pauseStartTimestamp: number | null;
  restTimerTargetEndMs: number | null;
  restTimerTotalSeconds: number;
  restTimerExerciseName?: string;
}

export async function getSavedActiveSession(userId: string): Promise<SavedActiveSessionState | null> {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(`spotter_active_session_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveActiveSession(userId: string, state: SavedActiveSessionState | null): Promise<void> {
  if (!userId) return;
  try {
    if (state) {
      await AsyncStorage.setItem(`spotter_active_session_${userId}`, JSON.stringify(state));
    } else {
      await AsyncStorage.removeItem(`spotter_active_session_${userId}`);
    }
  } catch (e) {
    console.error('Failed to save active session state:', e);
  }
}

// -------------------------------------------------------------
// App Theme
// -------------------------------------------------------------
export async function getSavedTheme(): Promise<ThemeId | null> {
  try {
    const theme = await AsyncStorage.getItem(SAVED_THEME_KEY);
    return theme as ThemeId | null;
  } catch {
    return null;
  }
}

export async function saveTheme(themeId: ThemeId): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_THEME_KEY, themeId);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

// -------------------------------------------------------------
// App Color Mode (system | dark | light)
// -------------------------------------------------------------
export async function getSavedColorMode(): Promise<ColorMode | null> {
  try {
    const mode = await AsyncStorage.getItem(SAVED_COLOR_MODE_KEY);
    return mode as ColorMode | null;
  } catch {
    return null;
  }
}

export async function saveColorMode(colorMode: ColorMode): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_COLOR_MODE_KEY, colorMode);
  } catch (e) {
    console.error('Failed to save color mode:', e);
  }
}

// -------------------------------------------------------------
// Offline Cloud Sync Queue
// -------------------------------------------------------------
export interface SyncQueueItem {
  id: string;
  action: 'upsert_workout' | 'delete_workout' | 'upsert_profile' | 'upsert_walk' | 'delete_walk' | 'upsert_routine' | 'delete_routine' | 'sync_folders';
  payload: any;
  timestamp: string;
}

const SYNC_QUEUE_KEY = 'spotter_sync_queue_v1';

export async function getSyncQueue(userId: string): Promise<SyncQueueItem[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(`${SYNC_QUEUE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addToSyncQueue(userId: string, action: SyncQueueItem['action'], payload: any): Promise<void> {
  if (!userId) return;
  try {
    const queue = await getSyncQueue(userId);
    const filtered = queue.filter(
      (item) => !(item.action === action && item.payload?.id === payload?.id)
    );
    filtered.push({
      id: `sq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      payload,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(`${SYNC_QUEUE_KEY}_${userId}`, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to add to sync queue:', e);
  }
}

export async function removeSyncQueueItem(userId: string, itemId: string): Promise<void> {
  if (!userId) return;
  try {
    const queue = await getSyncQueue(userId);
    const filtered = queue.filter((item) => item.id !== itemId);
    await AsyncStorage.setItem(`${SYNC_QUEUE_KEY}_${userId}`, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to remove sync queue item:', e);
  }
}

export async function clearSyncQueue(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(`${SYNC_QUEUE_KEY}_${userId}`);
  } catch {}
}
