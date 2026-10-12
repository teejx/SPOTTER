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
import { LogScreen } from './src/screens/LogScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { RoutinesScreen } from './src/screens/RoutinesScreen';
import { MetricsScreen } from './src/screens/MetricsScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ActiveWorkoutModal } from './src/screens/ActiveWorkoutModal';
import { RoutineTemplate } from './src/types';

function MainApp() {
  const {
    isLoading,
    activeSession,
    startSession,
    isAuthenticated,
    activeUser,
    themeVersion,
    colors,
    isDark,
  } = useFitness();
  const [currentTab, setCurrentTab] = useState<TabKey>('log');
  const [isLiveModalVisible, setIsLiveModalVisible] = useState(false);

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
    if (!routine && activeSession) {
      setIsLiveModalVisible(true);
      return;
    }
    startSession(routine);
    setIsLiveModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // If user is not authenticated, show Login & Registration screen
  if (!isAuthenticated || !activeUser) {
    return <AuthScreen key={`auth_${themeVersion}`} />;
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
        onOpenLiveWorkout={() => setIsLiveModalVisible(true)}
        onNavigateToProfile={() => setCurrentTab('profile')}
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
        {currentTab === 'profile' && <ProfileScreen />}
      </Animated.View>

      {/* Minimized Workout Floating Bar (Lets user minimize routine & navigate the app) */}
      {!!activeSession && !isLiveModalVisible && (
        <MinimizedWorkoutBar onExpand={() => setIsLiveModalVisible(true)} />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'log' && activeSession) {
            setIsLiveModalVisible(true);
          } else {
            setCurrentTab(tab);
          }
        }}
      />

      {/* Live Full-Screen Workout Modal */}
      {!!activeSession && (
        <ActiveWorkoutModal
          key={activeSession.id}
          visible={isLiveModalVisible}
          onClose={() => setIsLiveModalVisible(false)}
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
