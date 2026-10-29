import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Keyboard,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { PPL_PRESCRIPTIONS } from '../lib/seedData';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { WorkoutRestTimerBar } from '../components/WorkoutRestTimerBar';
import {
  WorkoutConfirmModal,
  WorkoutConfirmType,
  IncompleteExerciseItem,
} from '../components/WorkoutConfirmModal';
import { ExerciseDefinition, WorkoutSet, WeightUnit } from '../types';
import { getClayCardStyle, getClayPillStyle, getClayInputStyle } from '../theme/clay';

export const cleanRepTarget = (raw?: string | number): string => {
  if (raw === undefined || raw === null || raw === '') return '—';
  let str = String(raw).trim();
  str = str.replace(/^target[:\s]*/i, '');
  str = str.replace(/^\d+\s*[×x*X]\s*/i, '');
  str = str.replace(/\s*reps?$/i, '');
  return str.trim() || '—';
};

// Tactile Claymorphic Checkbox Button for Set Rows
const AnimatedSetCheckBtn: React.FC<{
  completed: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
  styles: any;
}> = ({ completed, onPress, colors, isDark, styles }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 90, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.checkBtn,
          completed && styles.checkBtnCompleted,
        ]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name="check"
          size={18}
          color={completed ? colors.accentContrastText : colors.textDim}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ActiveWorkoutModal: React.FC<{ visible: boolean; onClose: () => void }> = ({
  visible,
  onClose,
}) => {
  const {
    activeSession,
    updateActiveSession,
    finishSession,
    cancelSession,
    restTimer,
    personalRecords,
    activeUser,
    colors,
    isDark,
    isWorkoutStarted: isStarted,
    isWorkoutPaused: isPaused,
    workoutElapsedSeconds: elapsedSeconds,
    startActiveWorkout,
    togglePauseActiveWorkout,
  } = useFitness();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0
  );

  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<ExerciseDefinition | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Selected set for deletion/editing: { exIdx: number, setIdx: number } | null
  const [selectedSet, setSelectedSet] = useState<{ exIdx: number; setIdx: number } | null>(null);

  // Local string buffer for weight inputs to preserve decimal point while typing
  const [weightInputTexts, setWeightInputTexts] = useState<Record<string, string>>({});

  // Custom Animated Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: WorkoutConfirmType;
    exerciseIndex?: number;
    setIndex?: number;
    setNumber?: number;
    exerciseName?: string;
    incompleteExercises?: IncompleteExerciseItem[];
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Opening animation
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (visible) {
      modalFadeAnim.setValue(0);
      modalSlideAnim.setValue(18);
      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Fluid Shape Morph Animation for Floating Controls
  const targetPillWidth = !isStarted ? 210 : (!isPaused ? 58 : 220);
  const morphWidth = useRef(new Animated.Value(targetPillWidth)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Floating bottom controls position animation: elevated comfortably above bottom
  const isRestTimerActive = (restTimer.isRunning && restTimer.secondsRemaining > 0) || !!restTimer.isFinished;
  const baseBottomOffset = Math.max(insets.bottom + 20, 52);
  const controlsBottomAnim = useRef(new Animated.Value(isRestTimerActive ? 168 : baseBottomOffset)).current;

  useEffect(() => {
    Animated.timing(controlsBottomAnim, {
      toValue: isRestTimerActive ? 168 : baseBottomOffset,
      duration: 280,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [isRestTimerActive, baseBottomOffset]);

  useEffect(() => {
    setConfirmModal(null);
  }, [activeSession?.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(morphWidth, {
        toValue: targetPillWidth,
        duration: 260,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(contentFadeAnim, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [isStarted, isPaused, targetPillWidth]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!activeSession || !activeUser) return null;

  const timerMins = Math.floor(elapsedSeconds / 60);
  const timerSecs = elapsedSeconds % 60;
  const timeFormatted = `${timerMins < 10 ? '0' : ''}${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  const workoutUnit = activeSession.weightUnit || activeUser.weightUnit || 'kg';

  // Safe exercise indexing
  const exerciseCount = activeSession.exercises.length;
  const safeExerciseIndex = Math.min(Math.max(0, selectedExerciseIndex), Math.max(0, exerciseCount - 1));
  const currentExercise = exerciseCount > 0 ? activeSession.exercises[safeExerciseIndex] : null;
  const currentExerciseDef = currentExercise
    ? EXERCISE_DATABASE.find((e) => e.id === currentExercise.exerciseId)
    : null;

  const totalVolume = Math.round(
    activeSession.exercises.reduce((acc, ex) => {
      const exUnit = ex.weightUnit || workoutUnit;
      return (
        acc +
        ex.sets.reduce((sAcc, s) => {
          if (!s.completed || !s.weight || !s.reps) return sAcc;
          let weightInWorkoutUnit = s.weight;
          if (exUnit === 'lbs' && workoutUnit === 'kg') {
            weightInWorkoutUnit = s.weight / 2.20462;
          } else if (exUnit === 'kg' && workoutUnit === 'lbs') {
            weightInWorkoutUnit = s.weight * 2.20462;
          }
          return sAcc + weightInWorkoutUnit * s.reps;
        }, 0)
      );
    }, 0) * 10
  ) / 10;

  const completedSetsTotal = activeSession.exercises.reduce((count, ex) => {
    return count + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    if (!isStarted) {
      startActiveWorkout();
    }

    const currentEx = activeSession.exercises[exIdx];
    if (!currentEx) return;
    const currentSet = currentEx.sets[setIdx];
    if (!currentSet) return;

    const willComplete = !currentSet.completed;

    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      const targetSet = { ...updatedSets[setIdx], completed: willComplete };
      updatedSets[setIdx] = targetSet;
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });

    if (willComplete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const def = EXERCISE_DATABASE.find((e) => e.id === currentEx.exerciseId);
      const restSecs = def?.defaultRestSeconds || 90;
      restTimer.start(restSecs, currentEx.exerciseName);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleUpdateWeight = (exIdx: number, setIdx: number, val: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], weight: Math.max(0, val) };
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
  };

  const handleUpdateReps = (exIdx: number, setIdx: number, delta: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      const currentReps = updatedSets[setIdx].reps;
      updatedSets[setIdx] = { ...updatedSets[setIdx], reps: Math.max(1, currentReps + delta) };
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetDirectReps = (exIdx: number, setIdx: number, val: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], reps: Math.max(1, val) };
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
  };

  const handleAddSet = (exIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      const targetRepRange = lastSet?.targetRepRange || (targetEx.notes?.replace(/^Target:\s*/i, '') || undefined);
      const newSet: WorkoutSet = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        setNumber: targetEx.sets.length + 1,
        type: 'regular',
        weight: lastSet ? lastSet.weight : 50,
        reps: lastSet ? lastSet.reps : 10,
        targetRepRange,
        targetReps: lastSet?.targetReps,
        completed: false,
      };
      targetEx.sets = [...targetEx.sets, newSet];
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    // Do not auto-select newly added set
    setSelectedSet(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // When deleting a set it should be selected again!
  const handleRemoveSetAction = (exIdx: number) => {
    const targetEx = activeSession.exercises[exIdx];
    if (!targetEx || targetEx.sets.length <= 1) return;

    let deleteIdx = targetEx.sets.length - 1;
    if (selectedSet && selectedSet.exIdx === exIdx) {
      deleteIdx = selectedSet.setIdx;
    }

    const remainingCount = targetEx.sets.length - 1;
    const nextSelectedIdx = Math.min(deleteIdx, remainingCount - 1);

    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const updatedEx = { ...updatedExs[exIdx] };
      const filtered = updatedEx.sets.filter((_, idx) => idx !== deleteIdx);
      updatedEx.sets = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      updatedExs[exIdx] = updatedEx;
      return { ...prev, exercises: updatedExs };
    });

    // Auto-select the adjacent set so the user can continue managing sets seamlessly
    setSelectedSet({ exIdx, setIdx: nextSelectedIdx });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMoveExercise = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= activeSession.exercises.length) return;

    updateActiveSession((prev) => {
      const updated = [...prev.exercises];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return { ...prev, exercises: updated };
    });
    setSelectedExerciseIndex(toIdx);
    setSelectedSet(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleToggleExerciseUnit = (exIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const currentUnit = targetEx.weightUnit || prev.weightUnit || activeUser.weightUnit;
      const nextUnit: WeightUnit = currentUnit === 'kg' ? 'lbs' : 'kg';
      const factor = nextUnit === 'lbs' ? 2.20462 : 1 / 2.20462;
      const updatedSets = targetEx.sets.map((s) => ({
        ...s,
        weight: s.weight ? Math.round(s.weight * factor * 10) / 10 : 0,
      }));
      targetEx.sets = updatedSets;
      targetEx.weightUnit = nextUnit;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveExercise = (exIdx: number) => {
    const targetEx = activeSession.exercises[exIdx];
    setConfirmModal({
      visible: true,
      type: 'remove_exercise',
      exerciseIndex: exIdx,
      exerciseName: targetEx?.exerciseName,
    });
  };

  const handleStartWorkout = () => {
    if (activeSession.exercises.length === 0) {
      setIsPickerOpen(true);
      return;
    }
    startActiveWorkout();
  };

  const handleTogglePause = () => {
    togglePauseActiveWorkout();
  };

  const handleFinish = async () => {
    if (!isStarted || activeSession.exercises.length === 0) {
      return;
    }

    if (completedSetsTotal === 0) {
      setConfirmModal({
        visible: true,
        type: 'finish_empty',
      });
      return;
    }

    const incompleteExercises = activeSession.exercises
      .map((ex) => ({
        name: ex.exerciseName,
        completedSets: ex.sets.filter((s) => s.completed).length,
        totalSets: ex.sets.length,
      }))
      .filter((ex) => ex.completedSets < ex.totalSets);

    setConfirmModal({
      visible: true,
      type: 'finish_workout',
      incompleteExercises,
    });
  };

  // Exit / Cancel Workout Handler (prompt confirmation modal)
  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isStarted) {
      setConfirmModal({
        visible: true,
        type: 'exit_staging',
      });
      return;
    }

    setConfirmModal({
      visible: true,
      type: 'exit_started',
    });
  };

  const handleModalConfirm = async () => {
    if (!confirmModal) return;
    const modalType = confirmModal.type;
    const exIdx = confirmModal.exerciseIndex;
    setConfirmModal(null);

    if (modalType === 'exit_staging' || modalType === 'exit_started' || modalType === 'finish_empty') {
      cancelSession();
      onClose();
    } else if (modalType === 'finish_workout') {
      await finishSession();
      onClose();
    } else if (modalType === 'remove_exercise' && typeof exIdx === 'number') {
      updateActiveSession((prev) => ({
        ...prev,
        exercises: prev.exercises.filter((_, idx) => idx !== exIdx),
      }));
      setSelectedExerciseIndex((prev) => Math.max(0, prev - 1));
      setSelectedSet(null);
    } else if (
      modalType === 'remove_set' &&
      typeof exIdx === 'number' &&
      typeof confirmModal.setIndex === 'number'
    ) {
      const setIdx = confirmModal.setIndex;
      const targetEx = activeSession.exercises[exIdx];
      const remainingCount = targetEx ? targetEx.sets.length - 1 : 0;
      const nextSelectedIdx = Math.min(setIdx, remainingCount - 1);

      updateActiveSession((prev) => {
        const updatedExs = [...prev.exercises];
        const updatedEx = { ...updatedExs[exIdx] };
        if (updatedEx.sets.length <= 1) return prev;
        const filtered = updatedEx.sets.filter((_, idx) => idx !== setIdx);
        updatedEx.sets = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        updatedExs[exIdx] = updatedEx;
        return { ...prev, exercises: updatedExs };
      });
      // When deleting a set it should be selected again!
      setSelectedSet({ exIdx, setIdx: nextSelectedIdx });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleBackRequest = () => {
    if (confirmModal?.visible) {
      setConfirmModal(null);
      return;
    }
    if (isActionSheetOpen) {
      setIsActionSheetOpen(false);
      return;
    }
    if (selectedGuideExercise) {
      setSelectedGuideExercise(null);
      return;
    }
    if (isPickerOpen) {
      setIsPickerOpen(false);
      return;
    }
    onClose();
  };

  const exerciseUnit = currentExercise?.weightUnit || workoutUnit;
  const currentExUserPr = currentExercise
    ? personalRecords.find((p) => p.exerciseId === currentExercise.exerciseId)
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={handleBackRequest}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.containerInner,
            {
              opacity: modalFadeAnim,
              transform: [{ translateY: modalSlideAnim }],
            },
          ]}
        >
          {/* Top Bar: Left group has Minimize AND Exit, Right group has Timer and Three-Dots */}
          <View style={[styles.topHeader, { paddingTop: topInset + 6 }]}>
            <View style={styles.topHeaderLeftGroup}>
              {/* 1. Minimize Button */}
              <TouchableOpacity
                style={styles.topCircleBtn}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Minimize workout"
              >
                <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textPrimary} />
              </TouchableOpacity>

              {/* 2. Exit / Discard Button (Allows exiting the workout, not just minimizing) */}
              <TouchableOpacity
                style={[styles.topCircleBtn, styles.exitCircleBtn]}
                onPress={handleCancel}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Exit workout"
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.danger || '#EF4444'} />
              </TouchableOpacity>
            </View>

            <View style={styles.topHeaderRightGroup}>
              {/* 3. Timer Pill */}
              <TouchableOpacity
                style={styles.timerPill}
                onPress={handleTogglePause}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isPaused ? 'pause-circle' : 'clock-outline'}
                  size={14}
                  color={isPaused ? '#F59E0B' : colors.accent}
                />
                <Text style={[styles.timerPillText, isPaused && { color: '#F59E0B' }]}>
                  {!isStarted ? '00:00' : timeFormatted}
                </Text>
              </TouchableOpacity>

              {/* 4. Three-Dots Menu Button */}
              <TouchableOpacity
                style={styles.topCircleBtn}
                onPress={() => setIsActionSheetOpen(true)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Workout actions"
              >
                <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Body ScrollView */}
          <ScrollView
            ref={scrollRef}
            style={[styles.scrollView, { marginBottom: keyboardHeight }]}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: (restTimer.isRunning || restTimer.isFinished) ? 260 : 180,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeSession.exercises.length === 0 ? (
              <View style={styles.emptyStagingBox}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="lightning-bolt" size={36} color={colors.accent} />
                </View>
                <Text style={styles.emptyStagingTitle}>BUILD YOUR WORKOUT</Text>
                <Text style={styles.emptyStagingSubtitle}>
                  Add exercises to your session to start logging sets.
                </Text>
                <TouchableOpacity
                  style={styles.bigAddExerciseBtn}
                  onPress={() => setIsPickerOpen(true)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="plus" size={20} color={colors.accentContrastText} />
                  <Text style={styles.bigAddExerciseText}>Add Exercise to Workout</Text>
                </TouchableOpacity>
              </View>
            ) : currentExercise ? (
              <>
                {/* 1. Volumetric Clay Exercise Illustration Card */}
                <View style={styles.mainIllustrationCard}>
                  {currentExerciseDef?.exerciseDbGifUrl || currentExerciseDef?.animationGifUrl ? (
                    <Image
                      source={{ uri: currentExerciseDef.exerciseDbGifUrl || currentExerciseDef.animationGifUrl }}
                      style={styles.mainIllustrationImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.illustrationPlaceholder}>
                      <MaterialCommunityIcons name="dumbbell" size={64} color={colors.accent} />
                      <Text style={styles.illustrationCategoryText}>
                        {currentExercise.category.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 2. Horizontal Clay Thumbnail Selection Carousel */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailStripContent}
                  style={styles.thumbnailStrip}
                >
                  {activeSession.exercises.map((ex, idx) => {
                    const isSelected = idx === safeExerciseIndex;
                    const exDef = EXERCISE_DATABASE.find((e) => e.id === ex.exerciseId);
                    const isCompleted = ex.sets.length > 0 && ex.sets.every((s) => s.completed);

                    return (
                      <TouchableOpacity
                        key={ex.id}
                        style={[
                          styles.thumbnailCard,
                          isSelected && styles.thumbnailCardSelected,
                        ]}
                        onPress={() => {
                          setSelectedExerciseIndex(idx);
                          setSelectedSet(null);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        activeOpacity={0.8}
                      >
                        {exDef?.exerciseDbGifUrl || exDef?.animationGifUrl ? (
                          <Image
                            source={{ uri: exDef.exerciseDbGifUrl || exDef.animationGifUrl }}
                            style={styles.thumbnailImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.thumbnailFallback}>
                            <MaterialCommunityIcons
                              name="dumbbell"
                              size={22}
                              color={isSelected ? colors.accent : colors.textMuted}
                            />
                          </View>
                        )}

                        {isCompleted && (
                          <View style={styles.thumbnailCheckBadge}>
                            <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* 3. Exercise Title & Details */}
                <View style={styles.exerciseTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseTitle} numberOfLines={2}>
                      {currentExercise.exerciseName}
                    </Text>
                    {currentExercise.notes ? (
                      <Text style={styles.exerciseNotes}>{currentExercise.notes}</Text>
                    ) : null}
                  </View>
                </View>

                {/* 4. Clay Table Column Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, styles.thSet]}>SET</Text>
                  <Text style={[styles.thText, styles.thPrev]}>PREV</Text>
                  <Text style={[styles.thText, styles.thKg]}>{exerciseUnit.toUpperCase()}</Text>
                  <Text style={[styles.thText, styles.thReps]}>REPS</Text>
                  <Text style={[styles.thText, styles.thCheck]}>✓</Text>
                </View>

                {/* 5. Tactile Clay SETS Divider */}
                <View style={styles.setsDividerRow}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerBadge}>
                    <Text style={styles.dividerBadgeText}>SETS</Text>
                  </View>
                  <View style={styles.dividerLine} />
                </View>

                {/* 6. Clay Set Rows List */}
                {currentExercise.sets.map((set, setIdx) => {
                  const isThisSetSelected =
                    selectedSet?.exIdx === safeExerciseIndex && selectedSet?.setIdx === setIdx;

                  const prevDisplay = currentExUserPr
                    ? `${currentExUserPr.maxWeight}${exerciseUnit}×${currentExUserPr.repsAtMax}`
                    : (set.targetRepRange ? set.targetRepRange : '—');

                  return (
                    <View
                      key={set.id}
                      style={[
                        styles.claySetRow,
                        set.completed && styles.claySetRowCompleted,
                        isThisSetSelected && styles.claySetRowSelected,
                      ]}
                    >
                      {/* Set Number Clay Badge (Tap toggles selection) */}
                      <TouchableOpacity
                        style={[
                          styles.setNumberBadge,
                          isThisSetSelected && styles.setNumberBadgeSelected,
                        ]}
                        onPress={() => {
                          if (isThisSetSelected) {
                            setSelectedSet(null);
                          } else {
                            setSelectedSet({ exIdx: safeExerciseIndex, setIdx });
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        {isThisSetSelected ? (
                          <MaterialCommunityIcons name="minus-circle" size={16} color={colors.danger || '#EF4444'} />
                        ) : (
                          <Text style={[styles.setNumberText, isThisSetSelected && styles.setNumberTextSelected]}>
                            {set.setNumber}
                          </Text>
                        )}
                      </TouchableOpacity>

                      {/* PREV Weight / Reps */}
                      <View style={styles.prevCol}>
                        <Text style={styles.prevText} numberOfLines={1}>
                          {prevDisplay}
                        </Text>
                      </View>

                      {/* Weight Inset Well Pill */}
                      <View style={styles.weightCol}>
                        <View style={styles.clayInputPill}>
                          <TextInput
                            style={styles.pillInputText}
                            keyboardType="decimal-pad"
                            value={
                              weightInputTexts[set.id] !== undefined
                                ? weightInputTexts[set.id]
                                : (set.weight > 0 ? String(set.weight) : '')
                            }
                            onChangeText={(txt) => {
                              const clean = txt.replace(/[^0-9.]/g, '');
                              const parts = clean.split('.');
                              const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                              setWeightInputTexts((prev) => ({ ...prev, [set.id]: sanitized }));
                              const parsed = parseFloat(sanitized);
                              handleUpdateWeight(safeExerciseIndex, setIdx, isNaN(parsed) ? 0 : parsed);
                            }}
                            onBlur={() => {
                              setWeightInputTexts((prev) => {
                                const next = { ...prev };
                                delete next[set.id];
                                return next;
                              });
                            }}
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                          />
                        </View>
                      </View>

                      {/* Reps Inset Well Stepper Pill */}
                      <View style={styles.repsCol}>
                        <View style={styles.clayRepsPill}>
                          <TouchableOpacity
                            style={styles.repsStepBtn}
                            onPress={() => handleUpdateReps(safeExerciseIndex, setIdx, -1)}
                            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          >
                            <MaterialCommunityIcons name="minus" size={12} color={colors.textMuted} />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.repsInputText}
                            keyboardType="number-pad"
                            value={String(set.reps || 0)}
                            onChangeText={(txt) => {
                              const parsed = parseInt(txt.replace(/[^0-9]/g, ''), 10);
                              handleSetDirectReps(safeExerciseIndex, setIdx, isNaN(parsed) ? 1 : Math.max(1, parsed));
                            }}
                          />
                          <TouchableOpacity
                            style={styles.repsStepBtn}
                            onPress={() => handleUpdateReps(safeExerciseIndex, setIdx, 1)}
                            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          >
                            <MaterialCommunityIcons name="plus" size={12} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Tactile Animated Check Button */}
                      <View style={styles.checkCol}>
                        <AnimatedSetCheckBtn
                          completed={set.completed}
                          onPress={() => handleToggleSetComplete(safeExerciseIndex, setIdx)}
                          colors={colors}
                          isDark={isDark}
                          styles={styles}
                        />
                      </View>
                    </View>
                  );
                })}

                {/* 7. Tactile Clay Actions Row: Add Set & Remove Set */}
                <View style={styles.setActionsRow}>
                  <TouchableOpacity
                    style={styles.addSetClayBtn}
                    onPress={() => handleAddSet(safeExerciseIndex)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.accent} />
                    <Text style={styles.addSetClayBtnText}>Add Set</Text>
                  </TouchableOpacity>

                  {currentExercise.sets.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeSetClayBtn}
                      onPress={() => handleRemoveSetAction(safeExerciseIndex)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name="minus" size={16} color={colors.danger || '#EF4444'} />
                      <Text style={styles.removeSetClayBtnText}>
                        {selectedSet?.exIdx === safeExerciseIndex
                          ? `Remove Set ${selectedSet.setIdx + 1}`
                          : 'Remove Set'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>

          {/* Live Floating Rest Timer Bar */}
          <WorkoutRestTimerBar />

          {/* Floating Bottom Controls (START WORKOUT / Pause / Finish) - Moved a bit up */}
          <Animated.View
            style={[
              styles.floatingBottomControls,
              {
                bottom: controlsBottomAnim,
              },
            ]}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.morphPillContainer,
                {
                  width: morphWidth,
                  backgroundColor: !isStarted
                    ? (activeSession.exercises.length > 0 ? colors.accent : colors.surface)
                    : colors.surface,
                  borderColor: !isStarted
                    ? (activeSession.exercises.length > 0 ? colors.accent : colors.surfaceBorder)
                    : (isPaused ? colors.surfaceBorder : colors.accent),
                },
              ]}
            >
              <Animated.View style={[styles.morphContentInner, { opacity: contentFadeAnim }]}>
                {!isStarted ? (
                  activeSession.exercises.length > 0 ? (
                    <TouchableOpacity
                      style={styles.floatingStartBtnPill}
                      onPress={handleStartWorkout}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="play" size={20} color={colors.accentContrastText} />
                      <Text style={styles.floatingStartBtnPillText}>START WORKOUT</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.floatingStartBtnPillDisabled}
                      onPress={() => setIsPickerOpen(true)}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={colors.textMuted} />
                      <Text style={styles.floatingStartBtnPillDisabledText}>ADD EXERCISES FIRST</Text>
                    </TouchableOpacity>
                  )
                ) : !isPaused ? (
                  <TouchableOpacity
                    style={styles.pausePill1x1}
                    onPress={handleTogglePause}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="pause" size={26} color={colors.accent} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pausedPill2x1}>
                    <TouchableOpacity
                      style={styles.pillHalfLeft}
                      onPress={handleTogglePause}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="play" size={20} color={colors.textPrimary} />
                      <Text style={styles.pillHalfLeftText}>Resume</Text>
                    </TouchableOpacity>

                    <View style={styles.pillDivider} />

                    <TouchableOpacity
                      style={styles.pillHalfRight}
                      onPress={handleFinish}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="check-bold" size={18} color={colors.accentContrastText} />
                      <Text style={styles.pillHalfRightText}>Finish</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </Animated.View>
          </Animated.View>

          {/* Three-Dots Action Bottom Sheet */}
          <BottomSheetModal
            visible={isActionSheetOpen}
            onClose={() => setIsActionSheetOpen(false)}
            containerStyle={{ paddingHorizontal: 20, paddingTop: 6 }}
          >
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {currentExercise?.exerciseName}
                </Text>

                {/* 1. Add Exercise to Workout */}
                <TouchableOpacity
                  style={styles.sheetActionItem}
                  onPress={() => {
                    setIsActionSheetOpen(false);
                    setIsPickerOpen(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetActionIcon}>
                    <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetActionText}>Add Exercise to Workout</Text>
                    <Text style={styles.sheetActionSub}>Pick movements from library for this session</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. Exercise Guide / Biomechanics */}
                <TouchableOpacity
                  style={styles.sheetActionItem}
                  onPress={() => {
                    setIsActionSheetOpen(false);
                    if (currentExerciseDef) setSelectedGuideExercise(currentExerciseDef);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetActionIcon}>
                    <MaterialCommunityIcons name="information-outline" size={22} color={colors.textPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetActionText}>Exercise Guide & Form</Text>
                    <Text style={styles.sheetActionSub}>View anatomy cues, instructions, and video</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Switch Unit (KG / LBS) */}
                <TouchableOpacity
                  style={styles.sheetActionItem}
                  onPress={() => {
                    handleToggleExerciseUnit(safeExerciseIndex);
                    setIsActionSheetOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetActionIcon}>
                    <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetActionText}>Switch Unit (KG / LBS)</Text>
                    <Text style={styles.sheetActionSub}>Current: {exerciseUnit.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Reorder: Move Earlier / Later */}
                {activeSession.exercises.length > 1 && (
                  <View style={styles.reorderRow}>
                    <TouchableOpacity
                      style={[styles.reorderSheetBtn, safeExerciseIndex === 0 && { opacity: 0.3 }]}
                      disabled={safeExerciseIndex === 0}
                      onPress={() => {
                        handleMoveExercise(safeExerciseIndex, 'up');
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="arrow-left" size={18} color={colors.textPrimary} />
                      <Text style={styles.reorderSheetBtnText}>Move Earlier</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reorderSheetBtn,
                        safeExerciseIndex === activeSession.exercises.length - 1 && { opacity: 0.3 },
                      ]}
                      disabled={safeExerciseIndex === activeSession.exercises.length - 1}
                      onPress={() => {
                        handleMoveExercise(safeExerciseIndex, 'down');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reorderSheetBtnText}>Move Later</Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* 5. Remove Exercise from Workout */}
                <TouchableOpacity
                  style={styles.sheetActionItem}
                  onPress={() => {
                    setIsActionSheetOpen(false);
                    handleRemoveExercise(safeExerciseIndex);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: colors.dangerBg || 'rgba(239,68,68,0.12)' }]}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger || '#EF4444'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetActionText, { color: colors.danger || '#EF4444' }]}>Remove Exercise</Text>
                    <Text style={styles.sheetActionSub}>Delete this movement from current session</Text>
                  </View>
                </TouchableOpacity>

                {/* 6. Exit & Discard Workout */}
                <TouchableOpacity
                  style={[styles.sheetActionItem, { borderBottomWidth: 0, marginTop: 4 }]}
                  onPress={() => {
                    setIsActionSheetOpen(false);
                    handleCancel();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: colors.dangerBg || 'rgba(239,68,68,0.12)' }]}>
                    <MaterialCommunityIcons name="exit-to-app" size={22} color={colors.danger || '#EF4444'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetActionText, { color: colors.danger || '#EF4444' }]}>Exit & Discard Workout</Text>
                    <Text style={styles.sheetActionSub}>Stop workout session and return to app</Text>
                  </View>
                </TouchableOpacity>
              </BottomSheetModal>

          {/* Exercise Picker Bottom Sheet */}
          <ExercisePickerModal
            visible={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            selectedIds={activeSession.exercises.map((e) => e.exerciseId)}
            onSelect={(ex) => {
              const prescription = PPL_PRESCRIPTIONS[ex.id];
              const setCount = prescription?.sets || 3;
              const targetRepRange = prescription?.repRange || (prescription?.targetReps ? String(prescription.targetReps) : undefined);
              const targetReps = prescription?.targetReps || 10;
              const defaultWeight = prescription?.defaultWeightKg || 50;

              const initialSets: WorkoutSet[] = Array.from({ length: setCount }, (_, i) => ({
                id: `s-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                setNumber: i + 1,
                type: 'regular',
                weight: defaultWeight,
                reps: targetReps,
                targetRepRange,
                targetReps,
                completed: false,
              }));

              updateActiveSession((prev) => ({
                ...prev,
                exercises: [
                  ...prev.exercises,
                  {
                    id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    exerciseId: ex.id,
                    exerciseName: ex.name,
                    category: ex.category,
                    notes: targetRepRange ? `Target: ${targetRepRange}` : undefined,
                    weightUnit: prev.weightUnit || activeUser.weightUnit,
                    sets: initialSets,
                  },
                ],
              }));
              setSelectedExerciseIndex(activeSession.exercises.length);
              setSelectedSet(null);
            }}
          />

          {/* Exercise Guide Bottom Sheet */}
          <ExerciseGuideModal
            exercise={selectedGuideExercise}
            visible={!!selectedGuideExercise}
            onClose={() => setSelectedGuideExercise(null)}
          />

          {/* Centered Confirmation Modal */}
          <WorkoutConfirmModal
            visible={!!confirmModal}
            type={confirmModal?.type || 'exit_staging'}
            exerciseName={confirmModal?.exerciseName}
            setNumber={confirmModal?.setNumber}
            timeFormatted={timeFormatted}
            completedSets={completedSetsTotal}
            totalVolume={totalVolume}
            weightUnit={workoutUnit}
            incompleteExercises={confirmModal?.incompleteExercises}
            onClose={() => setConfirmModal(null)}
            onConfirm={handleModalConfirm}
          />
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerInner: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    topHeaderLeftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    topHeaderRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    topCircleBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.40 : 0.08,
      shadowRadius: 8,
    },
    exitCircleBtn: {
      backgroundColor: colors.dangerBg,
      borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.30)',
    },
    timerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 9999,
      elevation: 4,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.40 : 0.08,
      shadowRadius: 8,
    },
    timerPillText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
    },
    mainIllustrationCard: {
      width: '100%',
      height: 220,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      marginBottom: 10,
      elevation: 6,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.40 : 0.08,
      shadowRadius: 12,
      overflow: 'hidden',
    },
    mainIllustrationImage: {
      width: '100%',
      height: 180,
    },
    illustrationPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 170,
    },
    illustrationCategoryText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '900',
      color: colors.textMuted,
      letterSpacing: 1,
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.20)',
    },
    dotActive: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    thumbnailStrip: {
      marginVertical: 10,
    },
    thumbnailStripContent: {
      gap: 10,
      paddingHorizontal: 2,
    },
    thumbnailCard: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 6,
    },
    thumbnailCardSelected: {
      borderColor: colors.accent,
      borderWidth: 2.5,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.50,
      shadowRadius: 10,
      elevation: 6,
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    thumbnailFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbnailCheckBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.emerald || '#10B981',
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 14,
    },
    exerciseTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    exerciseNotes: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginTop: 2,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginBottom: 6,
    },
    thText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.textDim,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      letterSpacing: 0.8,
    },
    thSet: {
      width: 44,
      textAlign: 'center',
    },
    thPrev: {
      flex: 1,
      paddingHorizontal: 8,
    },
    thKg: {
      width: 82,
      textAlign: 'center',
    },
    thReps: {
      width: 76,
      textAlign: 'center',
    },
    thCheck: {
      width: 42,
      textAlign: 'center',
    },
    setsDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    dividerBadge: {
      backgroundColor: colors.surfaceRaised,
      paddingVertical: 3,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 28, 45, 0.08)',
    },
    dividerBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 1.2,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    claySetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      paddingVertical: 8,
      paddingHorizontal: 8,
      marginBottom: 8,
      elevation: 2,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 6,
    },
    claySetRowCompleted: {
      backgroundColor: isDark ? 'rgba(132, 204, 22, 0.08)' : 'rgba(132, 204, 22, 0.06)',
      borderColor: colors.accent,
    },
    claySetRowSelected: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerBg,
    },
    setNumberBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 28, 45, 0.08)',
    },
    setNumberBadgeSelected: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
    },
    setNumberText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    setNumberTextSelected: {
      color: colors.danger,
    },
    prevCol: {
      flex: 1,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    prevText: {
      fontSize: 11.5,
      color: colors.textMuted,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    weightCol: {
      width: 82,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clayInputPill: {
      width: '100%',
      height: 38,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 28, 45, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    pillInputText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      textAlign: 'center',
      width: '100%',
      padding: 0,
    },
    repsCol: {
      width: 76,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clayRepsPill: {
      width: '100%',
      height: 38,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 28, 45, 0.08)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    repsStepBtn: {
      width: 18,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    repsInputText: {
      flex: 1,
      color: colors.warning,
      fontSize: 13,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      textAlign: 'center',
      padding: 0,
    },
    checkCol: {
      width: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(17, 28, 45, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.30 : 0.05,
      shadowRadius: 4,
    },
    checkBtnCompleted: {
      backgroundColor: colors.accent,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.60)',
      shadowColor: colors.accent,
      shadowOpacity: 0.40,
    },
    setActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: 8,
      marginBottom: 24,
    },
    addSetClayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 9999,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      elevation: 3,
      shadowColor: isDark ? '#000000' : colors.surfaceSubtle,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 8,
    },
    addSetClayBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    removeSetClayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 9999,
      backgroundColor: colors.dangerBg,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.30)',
      elevation: 3,
      shadowColor: colors.danger,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.30 : 0.15,
      shadowRadius: 8,
    },
    removeSetClayBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.danger || '#EF4444',
    },
    floatingBottomControls: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500,
    },
    morphPillContainer: {
      height: 58,
      borderRadius: 29,
      borderWidth: 1.5,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 12,
      shadowColor: isDark ? '#000000' : '#111C2D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.50 : 0.20,
      shadowRadius: 14,
    },
    morphContentInner: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingStartBtnPill: {
      flex: 1,
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    floatingStartBtnPillText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
    floatingStartBtnPillDisabled: {
      flex: 1,
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    floatingStartBtnPillDisabledText: {
      fontSize: 12.5,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    pausePill1x1: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pausedPill2x1: {
      width: '100%',
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    pillHalfLeft: {
      flex: 1,
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    pillHalfLeftText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
    pillDivider: {
      width: 1,
      height: '60%',
      backgroundColor: colors.surfaceBorder,
    },
    pillHalfRight: {
      flex: 1,
      height: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accent,
    },
    pillHalfRightText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    emptyStagingBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
      paddingHorizontal: 24,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      borderStyle: 'dashed',
      marginTop: 40,
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 24,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyStagingTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    emptyStagingSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: 24,
    },
    bigAddExerciseBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 9999,
      width: '100%',
    },
    bigAddExerciseText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    actionBottomSheet: {
      width: '100%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 40 : 28,
      borderWidth: 1.5,
      borderBottomWidth: 0,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      gap: 6,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.15)',
      alignSelf: 'center',
      marginBottom: 14,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sheetActionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
    },
    sheetActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetActionText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    sheetActionSub: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    reorderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginVertical: 6,
    },
    reorderSheetBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.surfaceRaised,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(17, 28, 45, 0.08)',
    },
    reorderSheetBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
  });
