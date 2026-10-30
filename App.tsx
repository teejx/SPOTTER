import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FitnessProvider, useFitness } from './src/context/FitnessContext';
import { Header } from './src/components/Header';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { RestTimerBanner } from './src/components/RestTimerBanner';
import { MinimizedWorkoutBar } from './src/components/MinimizedWorkoutBar';
import { WorkoutConfirmModal } from './src/components/WorkoutConfirmModal';
import { LogScreen } from './src/screens/LogScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { RoutinesScreen } from './src/screens/RoutinesScreen';
import { MetricsScreen } from './src/screens/MetricsScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ActiveWorkoutModal } from './src/screens/ActiveWorkoutModal';
import { SettingsModal } from './src/components/SettingsModal';
import { ChangelogModal } from './src/components/ChangelogModal';
import { NotificationPermissionModal } from './src/components/NotificationPermissionModal';
import { SplashScreen } from './src/components/SplashScreen';
import {
  LogScreenSkeleton,
  MetricsScreenSkeleton,
  HistoryScreenSkeleton,
} from './src/components/ClaySkeleton';
import { APP_VERSION } from './src/utils/changelog';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoutineTemplate } from './src/types';

function MainApp() {
  const {
    isLoading,
    activeSession,
    startSession,
    cancelSession,
    workoutElapsedSeconds,
    isAuthenticated,
    activeUser,
    themeVersion,
    colors,
    isDark,
  } = useFitness();
  const [currentTab, setCurrentTab] = useState<TabKey>('log');
  const [isLiveModalVisible, setIsLiveModalVisible] = useState(false);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [pendingRoutine, setPendingRoutine] = useState<RoutineTemplate | undefined>(undefined);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isChangelogModalVisible, setIsChangelogModalVisible] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // Background loading: Load silently without blocking. Only show skeletons if data takes long (> 450ms)
  const [showSlowLoadSkeleton, setShowSlowLoadSkeleton] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isLoading && !activeUser) {
      timer = setTimeout(() => {
        setShowSlowLoadSkeleton(true);
      }, 450);
    } else {
      setShowSlowLoadSkeleton(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, activeUser]);

  // Check if changelog for current version has been seen
  useEffect(() => {
    if (!isAuthenticated || !activeUser) return;
    const checkChangelog = async () => {
      try {
        const lastSeen = await AsyncStorage.getItem('spotter_last_seen_changelog_version');
        if (lastSeen !== APP_VERSION) {
          setIsChangelogModalVisible(true);
        }
      } catch (e) {
        // ignore
      }
    };
    checkChangelog();
  }, [isAuthenticated, activeUser?.id]);

  // Check if notification permission prompt is needed
  useEffect(() => {
    if (!isAuthenticated || !activeUser) return;
    const checkNotificationPrompt = async () => {
      try {
        const asked = await AsyncStorage.getItem('spotter_notification_permission_asked');
        if (!asked) {
          setTimeout(() => {
            setIsNotificationModalVisible(true);
          }, 1500);
        }
      } catch (e) {
        // ignore
      }
    };
    checkNotificationPrompt();
  }, [isAuthenticated, activeUser?.id]);

  const handleAllowNotifications = async () => {
    setIsNotificationModalVisible(false);
    try {
      await AsyncStorage.setItem('spotter_notification_permission_asked', 'true');
    } catch (e) {}
  };

  const handleDismissNotifications = async () => {
    setIsNotificationModalVisible(false);
    try {
      await AsyncStorage.setItem('spotter_notification_permission_asked', 'true');
    } catch (e) {}
  };

  const handleCloseChangelog = async () => {
    setIsChangelogModalVisible(false);
    try {
      await AsyncStorage.setItem('spotter_last_seen_changelog_version', APP_VERSION);
    } catch (e) {
      // ignore
    }
  };

  // Premium animated page switch transition
  const pageFadeAnim = useRef(new Animated.Value(1)).current;
  const pageSlideAnim = useRef(new Animated.Value(0)).current;
  const pageScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pageFadeAnim.setValue(0.2);
    pageSlideAnim.setValue(8);
    pageScaleAnim.setValue(0.99);

    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pageScaleAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentTab]);

  useEffect(() => {
    const onBackPress = () => {
      if (isLiveModalVisible) {
        return false; // Let Modal's onRequestClose trigger exit confirmation dialog
      }
      if (currentTab !== 'log') {
        setCurrentTab('log');
        return true;
      }
      return false; // Exit app only when on main 'log' screen with no modal open
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isLiveModalVisible, currentTab]);

  const handleStartWorkout = (routine?: RoutineTemplate) => {
    if (activeSession) {
      setPendingRoutine(routine);
      setConflictModalVisible(true);
      return;
    }
    startSession(routine);
    setIsLiveModalVisible(true);
  };

  if (isLoading && !activeUser && showSlowLoadSkeleton) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Header currentTab={currentTab} />
        {currentTab === 'metrics' ? (
          <MetricsScreenSkeleton />
        ) : currentTab === 'history' ? (
          <HistoryScreenSkeleton />
        ) : (
          <LogScreenSkeleton />
        )}
      </SafeAreaView>
    );
  }

  // If user is not authenticated, show Login & Registration screen
  if (!isAuthenticated || !activeUser) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthScreen key={`auth_${themeVersion}`} />
        {isSplashVisible && (
          <SplashScreen
            isDark={isDark}
            onAnimationComplete={() => setIsSplashVisible(false)}
          />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView
      key={`app_${themeVersion}`}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onOpenLiveWorkout={() => setIsLiveModalVisible(true)}
        onNavigateToProfile={() => setCurrentTab('profile')}
        onOpenSettings={() => setIsSettingsModalVisible(true)}
      />

      {/* Active Rest Timer Banner */}
      <RestTimerBanner onOpenLiveWorkout={() => setIsLiveModalVisible(true)} />

      {/* Screen Router with Premium Switch Animation */}
      <Animated.View
        style={[
          styles.screenContainer,
          {
            backgroundColor: colors.background,
            opacity: pageFadeAnim,
            transform: [{ translateY: pageSlideAnim }, { scale: pageScaleAnim }],
          },
        ]}
      >
        {currentTab === 'log' && (
          <LogScreen
            onStartRoutine={handleStartWorkout}
            onNavigateToRoutines={() => setCurrentTab('routines')}
          />
        )}
        {currentTab === 'history' && <HistoryScreen />}
        {currentTab === 'routines' && (
          <RoutinesScreen onStartRoutine={handleStartWorkout} />
        )}
        {currentTab === 'metrics' && <MetricsScreen />}
        {currentTab === 'profile' && (
          <ProfileScreen onOpenSettings={() => setIsSettingsModalVisible(true)} />
        )}
      </Animated.View>

      {/* Minimized Workout Floating Bar (Lets user minimize routine & navigate the app) */}
      {!!activeSession && !isLiveModalVisible && (
        <MinimizedWorkoutBar onExpand={() => setIsLiveModalVisible(true)} />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
      />

      {/* Ongoing Workout Conflict Confirmation Modal */}
      {!!activeSession && (
        <WorkoutConfirmModal
          visible={conflictModalVisible}
          type="replace_with_empty"
          exerciseName={activeSession.title}
          targetRoutineName={pendingRoutine?.title}
          timeFormatted={`${Math.floor(workoutElapsedSeconds / 60)}:${workoutElapsedSeconds % 60 < 10 ? '0' : ''}${workoutElapsedSeconds % 60}`}
          completedSets={
            activeSession.exercises.reduce(
              (count, ex) => count + ex.sets.filter((s) => s.completed).length,
              0
            )
          }
          onClose={() => {
            setConflictModalVisible(false);
            setPendingRoutine(undefined);
          }}
          onCancel={() => {
            setConflictModalVisible(false);
            setPendingRoutine(undefined);
            setIsLiveModalVisible(true);
          }}
          onConfirm={() => {
            const routineToStart = pendingRoutine;
            setConflictModalVisible(false);
            setPendingRoutine(undefined);
            cancelSession();
            startSession(routineToStart);
            setIsLiveModalVisible(true);
          }}
        />
      )}

      {/* Live Full-Screen Workout Modal */}
      {!!activeSession && (
        <ActiveWorkoutModal
          key={activeSession.id}
          visible={isLiveModalVisible}
          onClose={() => setIsLiveModalVisible(false)}
        />
      )}

      {/* App Settings Modal */}
      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
        onOpenChangelog={() => setIsChangelogModalVisible(true)}
      />

      {/* Version Changelog / What's New Modal */}
      <ChangelogModal
        visible={isChangelogModalVisible}
        onClose={handleCloseChangelog}
      />

      {/* Workout Reminders & Notifications Permission Modal */}
      <NotificationPermissionModal
        visible={isNotificationModalVisible}
        colors={colors}
        isDark={isDark}
        onAllow={handleAllowNotifications}
        onDismiss={handleDismissNotifications}
      />

      {/* 5-Phase Animated Splash Screen Overlay */}
      {isSplashVisible && (
        <SplashScreen
          isDark={isDark}
          onAnimationComplete={() => setIsSplashVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <FitnessProvider>
        <MainApp />
      </FitnessProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
  },
});
