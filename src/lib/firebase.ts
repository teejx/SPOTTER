import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore - Exported in react-native entry point by Firebase SDK
  getReactNativePersistence,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { UserProfile, WorkoutLog, WalkingLog, RoutineTemplate, RoutineFolder } from '../types';

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD36l0RTNhNinCwNMxg-979wuacdNyDG1o",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "fitness-f8f01.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "fitness-f8f01",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "fitness-f8f01.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "680929522542",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:680929522542:web:251fa154b34f8b71a6c77f",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-654JK95RWC"
};

export const firebaseConfig = FIREBASE_CONFIG;

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== 'api key here' &&
    FIREBASE_CONFIG.projectId
  );
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, any>)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean as any;
  }
  return data;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
    cachedApp = app;
    try {
      cachedAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      cachedAuth = getAuth(app);
    }
    cachedDb = getFirestore(app);
    return cachedApp;
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  getFirebaseApp();
  return cachedAuth;
}

export function getFirebaseDb(): Firestore | null {
  getFirebaseApp();
  return cachedDb;
}

export async function registerFirebaseUser(
  email: string,
  pass: string,
  name: string
): Promise<{ user: FirebaseUser | null; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase is not configured.' };
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    return { user: cred.user };
  } catch (err: any) {
    let msg = err.message || 'Registration failed.';
    const code = err.code || '';
    if (code === 'auth/configuration-not-found' || msg.includes('configuration-not-found')) {
      msg = 'Authentication provider is not enabled in Firebase Console. Enable "Email/Password" in Firebase Authentication.';
    } else if (code === 'auth/operation-not-allowed') {
      msg = 'Email/Password sign-in is disabled in Firebase Authentication.';
    } else if (code === 'auth/email-already-in-use') {
      msg = 'This email is already registered. Try signing in instead.';
    } else if (code === 'auth/weak-password') {
      msg = 'Password should be at least 8 characters long.';
    } else if (code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return { user: null, error: msg };
  }
}

export async function loginFirebaseUser(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser | null; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase is not configured.' };
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { user: cred.user };
  } catch (err: any) {
    let msg = err.message || 'Login failed.';
    const code = err.code || '';
    if (code === 'auth/configuration-not-found' || msg.includes('configuration-not-found')) {
      msg = 'Authentication provider is not enabled in Firebase Console.';
    } else if (code === 'auth/operation-not-allowed') {
      msg = 'Email/Password sign-in is disabled in Firebase Authentication.';
    } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      msg = 'Invalid email or password.';
    } else if (code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    }
    return { user: null, error: msg };
  }
}

export async function lookupEmailByUsername(username: string): Promise<string | null> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return null;
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    // 1. Direct usernames index mapping
    const uRef = doc(db, 'usernames', clean);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      const data = uSnap.data();
      if (data && data.email) return data.email;
    }

    // 2. Query profiles collection by handle
    const qHandle = query(collection(db, 'profiles'), where('handle', '==', `@${clean}`));
    const snapHandle = await getDocs(qHandle);
    if (!snapHandle.empty) {
      const pData = snapHandle.docs[0].data();
      if (pData && (pData as any).email) return (pData as any).email;
    }

    // 3. Query profiles collection by athlete name
    const qName = query(collection(db, 'profiles'), where('name', '==', username.trim()));
    const snapName = await getDocs(qName);
    if (!snapName.empty) {
      const pData = snapName.docs[0].data();
      if (pData && (pData as any).email) return (pData as any).email;
    }
  } catch (e) {
    console.warn('Firestore lookupEmailByUsername warning:', e);
  }

  return null;
}

export async function saveUsernameMapping(username: string, email: string, uid: string): Promise<void> {
  const clean = username.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return;
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const docRef = doc(db, 'usernames', clean);
    await setDoc(docRef, { email: email.trim().toLowerCase(), uid, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('saveUsernameMapping error:', e);
  }
}

export async function loginAnonymousFirebaseUser(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Firebase anonymous auth error:', err);
    return null;
  }
}

export async function ensureFirebaseAuthSession(userId?: string): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;

  // Wait for persisted auth state to initialize if available
  if (typeof (auth as any).authStateReady === 'function') {
    try {
      await (auth as any).authStateReady();
      if (auth.currentUser) return auth.currentUser;
    } catch (e) {
      console.warn('authStateReady error:', e);
    }
  }

  // If a registered user is logged in (ID does not start with guest_), do not force anonymous auth!
  if (userId && !userId.startsWith('guest_') && !userId.startsWith('guest-')) {
    return auth.currentUser;
  }

  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Firebase ensureFirebaseAuthSession error:', err);
    return null;
  }
}

export async function logoutFirebaseUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function onFirebaseAuthStateChanged(callback: (user: FirebaseUser | null) => void): (() => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function syncWorkoutToFirestore(workout: WorkoutLog): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Database not initialized');
  const docRef = doc(db, 'workouts', workout.id);
  await setDoc(docRef, sanitizeForFirestore(workout), { merge: true });
}

export async function deleteWorkoutFromFirestore(workoutId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const docRef = doc(db, 'workouts', workoutId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore delete error:', e);
  }
}

export async function syncProfileToFirestore(profile: UserProfile): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Database not initialized');
  const docRef = doc(db, 'profiles', profile.id);
  await setDoc(docRef, sanitizeForFirestore(profile), { merge: true });
}

export async function fetchProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const docRef = doc(db, 'profiles', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (e) {
    console.warn('Firestore profile fetch error:', e);
    return null;
  }
}

export async function fetchWorkoutsFromFirestore(userId: string): Promise<WorkoutLog[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'workouts'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: WorkoutLog[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as WorkoutLog);
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.warn('Firestore workouts fetch error:', e);
    return [];
  }
}

export async function syncWalkToFirestore(walk: WalkingLog): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Database not initialized');
  const docRef = doc(db, 'walks', walk.id);
  await setDoc(docRef, sanitizeForFirestore(walk), { merge: true });
}

export async function deleteWalkFromFirestore(walkId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const docRef = doc(db, 'walks', walkId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore walk delete error:', e);
  }
}

export async function fetchWalksFromFirestore(userId: string): Promise<WalkingLog[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'walks'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: WalkingLog[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as WalkingLog);
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (e) {
    console.warn('Firestore walks fetch error:', e);
    return [];
  }
}

export async function syncRoutineToFirestore(routine: RoutineTemplate): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Database not initialized');
  const docRef = doc(db, 'routines', routine.id);
  await setDoc(docRef, sanitizeForFirestore(routine), { merge: true });
}

export async function deleteRoutineFromFirestore(routineId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const docRef = doc(db, 'routines', routineId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore routine delete error:', e);
  }
}

export async function fetchRoutinesFromFirestore(userId: string): Promise<RoutineTemplate[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  try {
    const q = query(collection(db, 'routines'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: RoutineTemplate[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as RoutineTemplate);
    });
    return list;
  } catch (e) {
    console.warn('Firestore routines fetch error:', e);
    return [];
  }
}

export async function syncFoldersToFirestore(userId: string, folders: RoutineFolder[]): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase Database not initialized');
  const docRef = doc(db, 'user_folders', userId);
  await setDoc(docRef, {
    userId,
    folders: sanitizeForFirestore(folders),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function fetchFoldersFromFirestore(userId: string): Promise<RoutineFolder[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  try {
    const docRef = doc(db, 'user_folders', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.folders)) {
        return data.folders as RoutineFolder[];
      }
    }
    return [];
  } catch (e) {
    console.warn('Firestore folders fetch error:', e);
    return [];
  }
}


