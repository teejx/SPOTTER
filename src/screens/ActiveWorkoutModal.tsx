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
  PanResponder,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { WorkoutRestTimerBar } from '../components/WorkoutRestTimerBar';
import { WorkoutConfirmModal, WorkoutConfirmType } from '../components/WorkoutConfirmModal';
import { ExerciseDefinition, WorkoutSet, WeightUnit } from '../types';

// Animated Tactile Checkbox Button for Set Rows
const AnimatedSetCheckBtn: React.FC<{
  completed: boolean;
  onPress: () => void;
  colors: ThemeColors;
  styles: any;
}> = ({ completed, onPress, colors, styles }) => {
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
        style={[styles.checkBtn, completed && styles.checkBtnCompleted]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons
          name={completed ? 'check-bold' : 'check'}
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

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<ExerciseDefinition | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Selected set for deletion: { exIdx: number, setIdx: number } | null
  const [selectedSet, setSelectedSet] = useState<{ exIdx: number; setIdx: number } | null>(null);

  // Local string buffer for weight inputs to preserve decimal point while typing
  const [weightInputTexts, setWeightInputTexts] = useState<Record<string, string>>({});

  // Custom Animated Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: WorkoutConfirmType;
    exerciseIndex?: number;
    exerciseName?: string;
  } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const activeScrollYRef = useRef<number>(0);

  // Animations: Live dot pulse, Empty icon float
  const liveDotPulseAnim = useRef(new Animated.Value(1)).current;
  const emptyFloatAnim = useRef(new Animated.Value(0)).current;

  // Fluid Shape Morph Animation: Staging Start (210) <-> 1x1 Pause (58) <-> 2x1 Resume/Finish (220)
  const targetPillWidth = !isStarted ? 210 : (!isPaused ? 58 : 220);
  const morphWidth = useRef(new Animated.Value(targetPillWidth)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Floating bottom controls position animation: glides between 28 (no timer) and 154 (active timer)
  const isRestTimerActive = (restTimer.isRunning && restTimer.secondsRemaining > 0) || !!restTimer.isFinished;
  const controlsBottomAnim = useRef(new Animated.Value(isRestTimerActive ? 154 : 28)).current;

  useEffect(() => {
    Animated.timing(controlsBottomAnim, {
      toValue: isRestTimerActive ? 154 : 28,
      duration: 280,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [isRestTimerActive]);

  // Whenever active session changes, guarantee clean state
  useEffect(() => {
    setConfirmModal(null);
  }, [activeSession?.id]);

  // Fluid shape morph width animation (no bounce, pure cubic-bezier ease) + content cross-fade
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

  // Pulsing live badge animation
  useEffect(() => {
    if (isStarted && !isPaused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(liveDotPulseAnim, {
            toValue: 1.4,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(liveDotPulseAnim, {
            toValue: 0.9,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      liveDotPulseAnim.setValue(1);
    }
  }, [isStarted, isPaused]);

  // Floating bounce on empty staging icon
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(emptyFloatAnim, {
          toValue: -7,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(emptyFloatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          if (activeScrollYRef.current > 0) {
            scrollRef.current?.scrollTo({ y: activeScrollYRef.current, animated: true });
          }
        }, 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        activeScrollYRef.current = 0;
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
  const timeFormatted = `${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  const workoutUnit = activeSession.weightUnit || activeUser.weightUnit || 'kg';

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
    // If user completes a set, auto-start session if not already started
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

  const handleAddSet = (exIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      const newSet: WorkoutSet = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        setNumber: targetEx.sets.length + 1,
        type: 'regular',
        weight: lastSet ? lastSet.weight : 50,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      };
      targetEx.sets = [...targetEx.sets, newSet];
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Remove selected set or last set
  const handleRemoveSetAction = (exIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      if (targetEx.sets.length <= 1) return prev; // Keep at least 1 set

      // If user selected a set in this exercise, delete that specific set
      let targetSetIndex = targetEx.sets.length - 1;
      if (selectedSet && selectedSet.exIdx === exIdx) {
        targetSetIndex = selectedSet.setIdx;
      }

      const filtered = targetEx.sets.filter((_, idx) => idx !== targetSetIndex);
      targetEx.sets = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    setSelectedSet(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Reorder exercises up/down
  const handleMoveExercise = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= activeSession.exercises.length) return;

    updateActiveSession((prev) => {
      const updated = [...prev.exercises];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return { ...prev, exercises: updated };
    });
    setSelectedSet(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Toggle unit for a specific exercise
  const handleToggleExerciseUnit = (exIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const currentUnit = targetEx.weightUnit || prev.weightUnit || activeUser.weightUnit;
      const nextUnit: WeightUnit = currentUnit === 'kg' ? 'lbs' : 'kg';
      // Convert set weights accurately
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

  // Toggle unit for entire workout (multi-select / global workout toggle)
  const handleToggleWorkoutUnit = () => {
    const currentUnit = activeSession.weightUnit || activeUser.weightUnit;
    const nextUnit: WeightUnit = currentUnit === 'kg' ? 'lbs' : 'kg';
    const factor = nextUnit === 'lbs' ? 2.20462 : 1 / 2.20462;

    updateActiveSession((prev) => {
      const updatedExs = prev.exercises.map((ex) => ({
        ...ex,
        weightUnit: nextUnit,
        sets: ex.sets.map((s) => ({
          ...s,
          weight: s.weight ? Math.round(s.weight * factor * 10) / 10 : 0,
        })),
      }));
      return { ...prev, weightUnit: nextUnit, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

    setConfirmModal({
      visible: true,
      type: 'finish_workout',
    });
  };

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
    }
  };

  const handleBackRequest = () => {
    if (confirmModal?.visible) {
      setConfirmModal(null);
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
    // Android hardware back button / gesture minimizes the routine
    onClose();
  };

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
        {/* Sticky Header with safe clearance */}
        <View style={[styles.topBar, { paddingTop: topInset + 10 }]}>
          {/* Left: Minimize Routine Button */}
          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Minimize routine"
          >
            <MaterialCommunityIcons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Center: Title & Timer */}
          <View style={styles.topCenter}>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {activeSession.title}
            </Text>
            <View style={styles.timerRow}>
              <MaterialCommunityIcons
                name={isPaused ? 'pause-circle' : 'clock-outline'}
                size={14}
                color={isPaused ? '#F59E0B' : (isStarted ? colors.accent : colors.textMuted)}
              />
              <Text
                style={[
                  styles.timerText,
                  !isStarted && { color: colors.textMuted },
                  isPaused && { color: '#F59E0B' },
                ]}
              >
                {!isStarted ? '0:00' : (isPaused ? `PAUSED • ${timeFormatted}` : timeFormatted)}
              </Text>
            </View>
          </View>

          {/* Right Action Group: KG/LBS Toggle & Exit Button */}
          <View style={styles.topBarRightGroup}>
            <TouchableOpacity
              style={styles.workoutUnitToggleBtn}
              onPress={handleToggleWorkoutUnit}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.workoutUnitToggleText}>
                {(activeSession.weightUnit || activeUser.weightUnit).toUpperCase()}
              </Text>
              <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.topBarBtn}
              onPress={handleCancel}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Exit workout"
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercises Scroll View */}
        <ScrollView
          ref={scrollRef}
          style={[styles.scrollView, { marginBottom: keyboardHeight }]}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: (restTimer.isRunning || restTimer.isFinished) ? 230 : 130,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Empty Staging State (Quick Workout with 0 exercises) */}
          {activeSession.exercises.length === 0 ? (
            <View style={styles.emptyStagingBox}>
              <Animated.View
                style={[
                  styles.emptyIconCircle,
                  { transform: [{ translateY: emptyFloatAnim }] },
                ]}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={36} color={colors.accent} />
              </Animated.View>
              <Text style={styles.emptyStagingTitle}>BUILD YOUR QUICK WORKOUT</Text>
              <Text style={styles.emptyStagingSubtitle}>
                Add exercises to your session below. Once ready, hit Start Workout at the bottom to begin timing your training.
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
          ) : null}

          {/* Render Exercises */}
          {activeSession.exercises.map((exercise, exIdx) => {
            const userPr = personalRecords.find((p) => p.exerciseId === exercise.exerciseId);

            return (
              <View key={exercise.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exerciseCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseNameText}>{exercise.exerciseName}</Text>
                    {exercise.notes ? (
                      <Text style={styles.targetNoteText}>{exercise.notes}</Text>
                    ) : null}
                    {userPr ? (
                      <View style={styles.prBadgeRow}>
                        <MaterialCommunityIcons name="trophy" size={12} color={colors.accent} />
                        <Text style={styles.prText}>
                          PR: {userPr.maxWeight}{activeUser.weightUnit} × {userPr.repsAtMax}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.exerciseHeaderActions}>
                    {/* Up / Down Reorder buttons */}
                    {activeSession.exercises.length > 1 && (
                      <View style={styles.reorderButtonsGroup}>
                        <TouchableOpacity
                          style={[styles.reorderBtn, exIdx === 0 && { opacity: 0.25 }]}
                          onPress={() => handleMoveExercise(exIdx, 'up')}
                          disabled={exIdx === 0}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="chevron-up" size={18} color={colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.reorderBtn,
                            exIdx === activeSession.exercises.length - 1 && { opacity: 0.25 },
                          ]}
                          onPress={() => handleMoveExercise(exIdx, 'down')}
                          disabled={exIdx === activeSession.exercises.length - 1}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.guideIconBtn}
                      onPress={() => {
                        const def = EXERCISE_DATABASE.find((e) => e.id === exercise.exerciseId);
                        restTimer.start(def?.defaultRestSeconds || 90, exercise.exerciseName);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="timer-outline" size={18} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.guideIconBtn}
                      onPress={() => {
                        const def = EXERCISE_DATABASE.find((e) => e.id === exercise.exerciseId);
                        if (def) setSelectedGuideExercise(def);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.guideIconBtn}
                      onPress={() => handleRemoveExercise(exIdx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Set Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.colHeader, { width: 34 }]}>SET</Text>
                  <TouchableOpacity
                    style={styles.unitHeaderTouchable}
                    onPress={() => handleToggleExerciseUnit(exIdx)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={[styles.colHeader, { color: colors.accent }]}>
                      {(exercise.weightUnit || activeSession.weightUnit || activeUser.weightUnit).toUpperCase()}
                    </Text>
                    <MaterialCommunityIcons name="swap-horizontal" size={11} color={colors.accent} />
                  </TouchableOpacity>
                  <Text style={[styles.colHeader, { width: 85, marginLeft: 'auto' }]}>REPS</Text>
                  <Text style={[styles.colHeader, { width: 44, textAlign: 'center' }]}>DONE</Text>
                </View>

                {/* Sets List */}
                {exercise.sets.map((set, setIdx) => {
                  const isThisSetSelected =
                    selectedSet?.exIdx === exIdx && selectedSet?.setIdx === setIdx;

                  return (
                    <TouchableOpacity
                      key={set.id}
                      style={[
                        styles.setRow,
                        set.completed && styles.setRowCompleted,
                        isThisSetSelected && styles.setRowSelected,
                      ]}
                      onPress={() => {
                        // Pressing the set selects/highlights it so user can delete via Remove Set button
                        if (isThisSetSelected) {
                          setSelectedSet(null);
                        } else {
                          setSelectedSet({ exIdx, setIdx });
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      activeOpacity={0.88}
                    >
                      {/* Set Number */}
                      <View style={[styles.setNumberBox, isThisSetSelected && styles.setNumberBoxSelected]}>
                        <Text style={[styles.setNumberText, isThisSetSelected && styles.setNumberTextSelected]}>
                          {set.setNumber}
                        </Text>
                      </View>

                      {/* Weight Input */}
                      <View style={styles.weightCol}>
                        <TextInput
                          style={styles.weightInput}
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
                            handleUpdateWeight(exIdx, setIdx, isNaN(parsed) ? 0 : parsed);
                          }}
                          onFocus={() => {
                            setSelectedSet({ exIdx, setIdx });
                            const targetY = Math.max(0, exIdx * 240 + setIdx * 48 - 60);
                            activeScrollYRef.current = targetY;
                            setTimeout(() => {
                              scrollRef.current?.scrollTo({ y: targetY, animated: true });
                            }, 100);
                          }}
                          onBlur={() => {
                            activeScrollYRef.current = 0;
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

                      {/* Reps Stepper */}
                      <View style={styles.repsCol}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleUpdateReps(exIdx, setIdx, -1)}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        >
                          <Text style={styles.stepBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.repsValueText}>{set.reps}</Text>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleUpdateReps(exIdx, setIdx, 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Tactile Animated Checkmark Button */}
                      <AnimatedSetCheckBtn
                        completed={set.completed}
                        onPress={() => handleToggleSetComplete(exIdx, setIdx)}
                        colors={colors}
                        styles={styles}
                      />
                    </TouchableOpacity>
                  );
                })}

                {/* Set Actions Bar: Add Set & Remove Set */}
                <View style={styles.setRowActionsBar}>
                  <TouchableOpacity
                    style={styles.addSetBtn}
                    onPress={() => handleAddSet(exIdx)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="plus" size={15} color={colors.accent} />
                    <Text style={styles.addSetText}>Add Set</Text>
                  </TouchableOpacity>

                  {exercise.sets.length > 1 && (
                    <TouchableOpacity
                      style={[
                        styles.removeSetBtn,
                        selectedSet?.exIdx === exIdx && styles.removeSetBtnActive,
                      ]}
                      onPress={() => handleRemoveSetAction(exIdx)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={15}
                        color={selectedSet?.exIdx === exIdx ? '#EF4444' : colors.danger}
                      />
                      <Text
                        style={[
                          styles.removeSetText,
                          selectedSet?.exIdx === exIdx && styles.removeSetTextActive,
                        ]}
                      >
                        {selectedSet?.exIdx === exIdx
                          ? `Remove Set ${selectedSet.setIdx + 1}`
                          : 'Remove Set'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Actions at bottom when exercises exist */}
          {activeSession.exercises.length > 0 && (
            <View style={styles.bottomActionsArea}>
              <TouchableOpacity
                style={styles.addExerciseCard}
                onPress={() => setIsPickerOpen(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color={colors.accent} />
                <Text style={styles.addExerciseText}>Add Exercise to Workout</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Live Floating Rest Timer Bar */}
        <WorkoutRestTimerBar />

        {/* Floating Bottom Controls with Smooth Morphing Transition */}
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
                  ? (activeSession.exercises.length > 0 ? colors.accent : colors.cardBg)
                  : colors.cardBg,
                borderColor: !isStarted
                  ? (activeSession.exercises.length > 0 ? colors.accent : colors.cardBorder)
                  : (isPaused ? colors.cardBorder : colors.accent),
              },
            ]}
          >
            <Animated.View style={[styles.morphContentInner, { opacity: contentFadeAnim }]}>
              {!isStarted ? (
                // Staging Mode: START WORKOUT Pill
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
                // 1x1 Pause Button Pill
                <TouchableOpacity
                  style={styles.pausePill1x1}
                  onPress={handleTogglePause}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="pause" size={26} color={colors.accent} />
                </TouchableOpacity>
              ) : (
                // 2x1 Paused Pill: Resume on Left, Finish on Right
                <View style={styles.pausedPill2x1}>
                  <TouchableOpacity
                    style={styles.pillHalfLeft}
                    onPress={handleTogglePause}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="play" size={20} color={colors.text} />
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

        {/* Modals */}
        <ExercisePickerModal
          visible={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          selectedIds={activeSession.exercises.map((e) => e.exerciseId)}
          onSelect={(ex) => {
            updateActiveSession((prev) => ({
              ...prev,
              exercises: [
                ...prev.exercises,
                {
                  id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  exerciseId: ex.id,
                  exerciseName: ex.name,
                  category: ex.category,
                  weightUnit: prev.weightUnit || activeUser.weightUnit,
                  sets: [
                    { id: `s-1-${Date.now()}`, setNumber: 1, type: 'regular', weight: 50, reps: 10, completed: false },
                    { id: `s-2-${Date.now()}`, setNumber: 2, type: 'regular', weight: 50, reps: 10, completed: false },
                    { id: `s-3-${Date.now()}`, setNumber: 3, type: 'regular', weight: 50, reps: 10, completed: false },
                  ],
                },
              ],
            }));
          }}
        />

        <ExerciseGuideModal
          exercise={selectedGuideExercise}
          visible={!!selectedGuideExercise}
          onClose={() => setSelectedGuideExercise(null)}
        />

        {/* Custom Themed Animated Confirmation Dialog */}
        <WorkoutConfirmModal
          visible={!!confirmModal}
          type={confirmModal?.type || 'exit_staging'}
          exerciseName={confirmModal?.exerciseName}
          timeFormatted={timeFormatted}
          completedSets={completedSetsTotal}
          totalVolume={totalVolume}
          weightUnit={workoutUnit}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleModalConfirm}
        />
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
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.cardBg,
    },
    topBarRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    workoutUnitToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    workoutUnitToggleText: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.accent,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    topBarBtn: {
      padding: 8,
      borderRadius: 12,
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
    topCenter: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 10,
    },
    workoutTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    timerText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
      fontFamily: 'monospace',
    },
    topRightPlaceholder: {
      minWidth: 54,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    liveIndicatorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.3)',
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
      height: 56,
      borderRadius: 28,
      borderWidth: 1.5,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.45 : 0.22,
      shadowRadius: 12,
    },
    morphContentInner: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
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
      color: colors.text,
      letterSpacing: 0.3,
    },
    pillDivider: {
      width: 1,
      height: '60%',
      backgroundColor: colors.cardBorder,
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
    },
    emptyStagingBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 44,
      paddingHorizontal: 24,
      borderRadius: 20,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderStyle: 'dashed',
      marginTop: 20,
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 22,
      backgroundColor: colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyStagingTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
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
      borderRadius: 14,
      width: '100%',
    },
    bigAddExerciseText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.accentContrastText,
      letterSpacing: 0.5,
    },
    exerciseCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    exerciseCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    exerciseNameText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    targetNoteText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      fontFamily: 'monospace',
      marginTop: 2,
    },
    prBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 3,
    },
    prText: {
      fontSize: 11,
      color: colors.accent,
      fontFamily: 'monospace',
      fontWeight: '700',
    },
    exerciseHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reorderButtonsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: 2,
    },
    reorderBtn: {
      paddingHorizontal: 4,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guideIconBtn: {
      padding: 6,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    unitHeaderTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    colHeader: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      fontFamily: 'monospace',
    },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    setRowCompleted: {
      backgroundColor: colors.accentSubtle,
    },
    setRowSelected: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      borderColor: '#EF4444',
    },
    setNumberBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setNumberBoxSelected: {
      backgroundColor: '#EF4444',
    },
    setNumberText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
    },
    setNumberTextSelected: {
      color: '#FFFFFF',
    },
    weightCol: {
      flex: 1,
      paddingHorizontal: 8,
    },
    weightInput: {
      backgroundColor: colors.inputBg,
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      fontFamily: 'monospace',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    repsCol: {
      width: 85,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 6,
    },
    stepBtn: {
      width: 24,
      height: 28,
      backgroundColor: colors.inputBg,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    stepBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    repsValueText: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      fontFamily: 'monospace',
    },
    checkBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBtnCompleted: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    removeSetRowBtn: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    setRowActionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
    },
    addSetBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
    },
    addSetText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    removeSetBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
      borderLeftWidth: 1,
      borderLeftColor: colors.cardBorder,
    },
    removeSetBtnActive: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)',
    },
    removeSetText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
    },
    removeSetTextActive: {
      color: '#EF4444',
      fontWeight: '900',
    },
    bottomActionsArea: {
      gap: 12,
      marginTop: 4,
    },
    addExerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 8,
    },
    addExerciseText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
  });
