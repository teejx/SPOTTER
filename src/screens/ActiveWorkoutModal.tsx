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
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { WorkoutRestTimerBar } from '../components/WorkoutRestTimerBar';
import {
  WorkoutConfirmModal,
  WorkoutConfirmType,
  IncompleteExerciseItem,
} from '../components/WorkoutConfirmModal';
import { ExerciseDefinition, WorkoutSet, WeightUnit, WorkoutExercise } from '../types';

export const cleanRepTarget = (raw?: string | number): string => {
  if (raw === undefined || raw === null || raw === '') return '—';
  let str = String(raw).trim();
  str = str.replace(/^target[:\s]*/i, '');
  str = str.replace(/^\d+\s*[×x*X]\s*/i, '');
  str = str.replace(/\s*reps?$/i, '');
  return str.trim() || '—';
};

// Animated Tactile Checkbox Button for Set Rows (Claymorphic)
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
          size={16}
          color={completed ? '#0B0C10' : colors.textDim}
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

  // Active focused exercise index for the carousel & visualizer
  const [activeExIdx, setActiveExIdx] = useState(0);

  // Selected movement angle / thumbnail stage frame (0 to 4)
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(2);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<ExerciseDefinition | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Exercise options overflow menu modal state
  const [exerciseMenuIdx, setExerciseMenuIdx] = useState<number | null>(null);

  // Selected set for deletion/editing: { exIdx: number, setIdx: number } | null
  const [selectedSet, setSelectedSet] = useState<{ exIdx: number; setIdx: number } | null>(null);

  // Local string buffer for weight inputs to preserve decimal point while typing
  const [weightInputTexts, setWeightInputTexts] = useState<Record<string, string>>({});
  const [repsInputTexts, setRepsInputTexts] = useState<Record<string, string>>({});

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

  // Rest Timer bar state
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

  useEffect(() => {
    setConfirmModal(null);
  }, [activeSession?.id]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!activeSession || !activeUser) return null;

  const currentExerciseCount = activeSession.exercises.length;
  const safeExIdx = Math.min(activeExIdx, Math.max(0, currentExerciseCount - 1));
  const currentExercise = activeSession.exercises[safeExIdx] as WorkoutExercise | undefined;

  const exerciseDef = useMemo(() => {
    if (!currentExercise) return null;
    return EXERCISE_DATABASE.find((e) => e.id === currentExercise.exerciseId) || null;
  }, [currentExercise?.exerciseId]);

  const timerMins = Math.floor(elapsedSeconds / 60);
  const timerSecs = elapsedSeconds % 60;
  const timeFormatted = `${timerMins < 10 ? '0' : ''}${timerMins}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  const workoutUnit = activeSession.weightUnit || activeUser.weightUnit || 'kg';

  // Calculate completed sets
  const completedSetsTotal = activeSession.exercises.reduce((count, ex) => {
    return count + ex.sets.filter((s) => s.completed).length;
  }, 0);

  // Movement demonstration angles / phase mock thumbnails
  const movementFrames = [
    { id: 'f0', label: 'Setup', icon: 'dumbbell' as const },
    { id: 'f1', label: 'Unrack', icon: 'weight-lifter' as const },
    { id: 'f2', label: 'Eccentric', icon: 'arrow-down-bold' as const },
    { id: 'f3', label: 'Concentric', icon: 'arrow-up-bold' as const },
    { id: 'f4', label: 'Lockout', icon: 'trophy-outline' as const },
  ];

  // Set management
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
      updatedSets[setIdx] = { ...updatedSets[setIdx], completed: willComplete };
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

  const handleUpdateReps = (exIdx: number, setIdx: number, repsVal: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], reps: Math.max(0, repsVal) };
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
  };

  const handleAddSet = (exIdx: number, isWarmup: boolean = false) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      const newSet: WorkoutSet = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        setNumber: targetEx.sets.length + 1,
        type: isWarmup ? 'warmup' : 'regular',
        weight: lastSet ? (isWarmup ? Math.round(lastSet.weight * 0.5) : lastSet.weight) : 50,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      };
      targetEx.sets = [...targetEx.sets, newSet];
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleSetType = (exIdx: number, setIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      const curType = updatedSets[setIdx].type;
      updatedSets[setIdx] = {
        ...updatedSets[setIdx],
        type: curType === 'warmup' ? 'regular' : 'warmup',
      };
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      if (targetEx.sets.length <= 1) return prev;
      targetEx.sets = targetEx.sets.filter((_, idx) => idx !== setIdx);
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    setSelectedSet(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveExercise = (exIdx: number) => {
    const targetEx = activeSession.exercises[exIdx];
    setExerciseMenuIdx(null);
    setConfirmModal({
      visible: true,
      type: 'remove_exercise',
      exerciseIndex: exIdx,
      exerciseName: targetEx?.exerciseName,
    });
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
    setActiveExIdx(toIdx);
    setExerciseMenuIdx(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleFinish = async () => {
    if (!isStarted || activeSession.exercises.length === 0) return;
    if (completedSetsTotal === 0) {
      setConfirmModal({
        visible: true,
        type: 'finish_empty',
      });
      return;
    }
    const incomplete: IncompleteExerciseItem[] = [];
    activeSession.exercises.forEach((ex) => {
      const completedCount = ex.sets.filter((s) => s.completed).length;
      if (completedCount < ex.sets.length) {
        incomplete.push({
          name: ex.exerciseName,
          completedSets: completedCount,
          totalSets: ex.sets.length,
        });
      }
    });

    if (incomplete.length > 0) {
      setConfirmModal({
        visible: true,
        type: 'finish_workout',
        incompleteExercises: incomplete,
      });
      return;
    }

    try {
      await finishSession();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  // Divide sets into Warmup vs Working Sets
  const warmupSets = useMemo(() => {
    if (!currentExercise) return [];
    return currentExercise.sets
      .map((s, idx) => ({ ...s, originalIndex: idx }))
      .filter((s) => s.type === 'warmup');
  }, [currentExercise?.sets]);

  const workingSets = useMemo(() => {
    if (!currentExercise) return [];
    return currentExercise.sets
      .map((s, idx) => ({ ...s, originalIndex: idx }))
      .filter((s) => s.type !== 'warmup');
  }, [currentExercise?.sets]);

  // Target muscle breakdown string
  const targetMuscleText = exerciseDef?.targetMuscles?.join(', ') || currentExercise?.category || 'Upper Body';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={[styles.topBar, { paddingTop: topInset + 6 }]}>
          {/* Dismiss / Minimize Circle Button */}
          <TouchableOpacity
            style={styles.circleDismissBtn}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="chevron-down" size={26} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Exercise Index Indicator / Pill */}
          {currentExerciseCount > 1 && (
            <View style={styles.exerciseIndexPill}>
              <Text style={styles.exerciseIndexText}>
                EXERCISE {safeExIdx + 1} OF {currentExerciseCount}
              </Text>
            </View>
          )}

          {/* Session Running Timer Pill */}
          <TouchableOpacity
            style={[styles.timerPill, isPaused && styles.timerPillPaused]}
            onPress={togglePauseActiveWorkout}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isPaused ? 'pause' : 'clock-outline'}
              size={15}
              color={isPaused ? '#F59E0B' : colors.textPrimary}
            />
            <Text style={[styles.timerText, isPaused && { color: '#F59E0B' }]}>
              {timeFormatted}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isRestTimerActive ? 180 : 130 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {currentExercise ? (
            <>
              {/* Exercise Visual Stage: 3D / Anatomical Diagram Carousel */}
              <View style={styles.visualStageCard}>
                <View style={styles.visualStageIllustration}>
                  {exerciseDef?.exerciseDbGifUrl ? (
                    <Image
                      source={{ uri: exerciseDef.exerciseDbGifUrl }}
                      style={styles.exerciseImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.placeholderVisual}>
                      <MaterialCommunityIcons
                        name="weight-lifter"
                        size={84}
                        color={colors.accent}
                      />
                      <Text style={styles.targetMusclesPill}>
                        TARGET: {targetMuscleText.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Pagination Dots */}
                {currentExerciseCount > 1 && (
                  <View style={styles.paginationRow}>
                    {activeSession.exercises.map((_, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setActiveExIdx(i)}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                      >
                        <View
                          style={[
                            styles.paginationDot,
                            i === safeExIdx && styles.paginationDotActive,
                          ]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Horizontal Execution Angle / Phase Thumbnails */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailStrip}
                >
                  {movementFrames.map((frame, fIdx) => {
                    const isSelected = selectedFrameIdx === fIdx;
                    return (
                      <TouchableOpacity
                        key={frame.id}
                        style={[
                          styles.thumbnailBox,
                          isSelected && styles.thumbnailBoxActive,
                        ]}
                        onPress={() => {
                          setSelectedFrameIdx(fIdx);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={frame.icon}
                          size={24}
                          color={isSelected ? '#F97316' : colors.textDim}
                        />
                        <Text
                          style={[
                            styles.thumbnailLabel,
                            isSelected && styles.thumbnailLabelActive,
                          ]}
                        >
                          {frame.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Exercise Title & Action Menu */}
              <View style={styles.exerciseHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseTitle}>
                    {currentExercise.exerciseName}
                  </Text>
                  <Text style={styles.exerciseCategory}>
                    {currentExercise.category} • {exerciseDef?.equipment || 'Free Weight'}
                  </Text>
                </View>

                {/* 3-Dots Action Button */}
                <TouchableOpacity
                  style={styles.moreActionBtn}
                  onPress={() => setExerciseMenuIdx(safeExIdx)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons
                    name="dots-horizontal"
                    size={24}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* AI Coach / Telemetry Readiness Card */}
              <View style={styles.coachInsightCard}>
                <View style={styles.coachInsightHeader}>
                  <View style={styles.coachBatteryIcon}>
                    <MaterialCommunityIcons
                      name="battery-charging-60"
                      size={18}
                      color="#A855F7"
                    />
                  </View>
                  <Text style={styles.coachInsightTag}>ADJUSTED FOR TODAY</Text>
                </View>
                <Text style={styles.coachInsightBody}>
                  {exerciseDef?.targetMuscles
                    ? `Biomechanic load calibrated for ${exerciseDef.targetMuscles[0]}. Maintain controlled 3-second eccentric tempo and explosive concentric drive.`
                    : "You reported moderate energy, so I've eased weights slightly. Hit your reps clean and you're right on track."}
                </Text>
              </View>

              {/* Set Table Column Headers */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colHeader, { width: 50 }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1.2 }]}>PREV</Text>
                <Text style={[styles.colHeader, { width: 90, textAlign: 'center' }]}>
                  {workoutUnit.toUpperCase()}
                </Text>
                <Text style={[styles.colHeader, { width: 65, textAlign: 'center' }]}>
                  REPS
                </Text>
                <Text style={[styles.colHeader, { width: 44, textAlign: 'center' }]}>
                  ✓
                </Text>
              </View>

              {/* WARMUP SECTION (if any warmup sets exist) */}
              {warmupSets.length > 0 && (
                <>
                  <View style={styles.sectionDividerRow}>
                    <View style={styles.dividerLine} />
                    <View style={styles.dividerBadge}>
                      <Text style={styles.dividerBadgeText}>WARMUP</Text>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>

                  {warmupSets.map((set, wIdx) => {
                    const originalIdx = set.originalIndex;
                    const prevWeight = wIdx > 0 ? warmupSets[wIdx - 1].weight : 0;
                    const isIncreased = prevWeight > 0 && set.weight > prevWeight;
                    const isDecreased = prevWeight > 0 && set.weight < prevWeight;

                    return (
                      <View key={set.id} style={styles.claySetRow}>
                        {/* W1 / W2 Badge */}
                        <TouchableOpacity
                          style={styles.setNumberBadge}
                          onPress={() => handleToggleSetType(safeExIdx, originalIdx)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.setNumberText}>W{wIdx + 1}</Text>
                        </TouchableOpacity>

                        {/* PREV Weight / Reps */}
                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.prevText}>
                            {set.weight > 0 ? `${set.weight} ${workoutUnit}×${set.reps}` : '—'}
                          </Text>
                        </View>

                        {/* KG Input Pill with Trend Indicator */}
                        <View style={[styles.clayInputPill, { width: 90 }]}>
                          <TextInput
                            style={[
                              styles.pillInputText,
                              isIncreased && { color: '#10B981' },
                              isDecreased && { color: '#F59E0B' },
                            ]}
                            keyboardType="decimal-pad"
                            value={
                              weightInputTexts[set.id] !== undefined
                                ? weightInputTexts[set.id]
                                : set.weight > 0
                                ? String(set.weight)
                                : ''
                            }
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                            onChangeText={(txt) => {
                              const clean = txt.replace(/[^0-9.]/g, '');
                              setWeightInputTexts((prev) => ({ ...prev, [set.id]: clean }));
                              const parsed = parseFloat(clean);
                              handleUpdateWeight(safeExIdx, originalIdx, isNaN(parsed) ? 0 : parsed);
                            }}
                          />
                          {isIncreased && (
                            <MaterialCommunityIcons name="arrow-up" size={13} color="#10B981" />
                          )}
                          {isDecreased && (
                            <MaterialCommunityIcons name="arrow-down" size={13} color="#F59E0B" />
                          )}
                        </View>

                        {/* REPS Input Pill */}
                        <View style={[styles.clayInputPill, { width: 65 }]}>
                          <TextInput
                            style={[styles.pillInputText, { color: '#F97316' }]}
                            keyboardType="number-pad"
                            value={
                              repsInputTexts[set.id] !== undefined
                                ? repsInputTexts[set.id]
                                : set.reps > 0
                                ? String(set.reps)
                                : ''
                            }
                            placeholder="0"
                            placeholderTextColor={colors.textDim}
                            onChangeText={(txt) => {
                              const clean = txt.replace(/[^0-9]/g, '');
                              setRepsInputTexts((prev) => ({ ...prev, [set.id]: clean }));
                              const parsed = parseInt(clean, 10);
                              handleUpdateReps(safeExIdx, originalIdx, isNaN(parsed) ? 0 : parsed);
                            }}
                          />
                        </View>

                        {/* Completion Check Button */}
                        <AnimatedSetCheckBtn
                          completed={set.completed}
                          onPress={() => handleToggleSetComplete(safeExIdx, originalIdx)}
                          colors={colors}
                          styles={styles}
                        />
                      </View>
                    );
                  })}
                </>
              )}

              {/* WORKING SETS SECTION */}
              <View style={styles.sectionDividerRow}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerBadge}>
                  <Text style={styles.dividerBadgeText}>SETS</Text>
                </View>
                <View style={styles.dividerLine} />
              </View>

              {workingSets.map((set, sIdx) => {
                const originalIdx = set.originalIndex;
                const prevWeight = sIdx > 0 ? workingSets[sIdx - 1].weight : 0;
                const isIncreased = prevWeight > 0 && set.weight > prevWeight;
                const isDecreased = prevWeight > 0 && set.weight < prevWeight;

                return (
                  <View key={set.id} style={styles.claySetRow}>
                    {/* Working Set Number Badge: Tap toggles to warmup */}
                    <TouchableOpacity
                      style={styles.setNumberBadge}
                      onPress={() => handleToggleSetType(safeExIdx, originalIdx)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.setNumberText}>{sIdx + 1}</Text>
                    </TouchableOpacity>

                    {/* PREV Weight / Reps */}
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.prevText}>
                        {set.weight > 0 ? `${set.weight} ${workoutUnit}×${set.reps}` : '—'}
                      </Text>
                    </View>

                    {/* KG Input Pill with Trend Indicator */}
                    <View style={[styles.clayInputPill, { width: 90 }]}>
                      <TextInput
                        style={[
                          styles.pillInputText,
                          isIncreased && { color: '#10B981' },
                          isDecreased && { color: '#F97316' },
                        ]}
                        keyboardType="decimal-pad"
                        value={
                          weightInputTexts[set.id] !== undefined
                            ? weightInputTexts[set.id]
                            : set.weight > 0
                            ? String(set.weight)
                            : ''
                        }
                        placeholder="0"
                        placeholderTextColor={colors.textDim}
                        onChangeText={(txt) => {
                          const clean = txt.replace(/[^0-9.]/g, '');
                          setWeightInputTexts((prev) => ({ ...prev, [set.id]: clean }));
                          const parsed = parseFloat(clean);
                          handleUpdateWeight(safeExIdx, originalIdx, isNaN(parsed) ? 0 : parsed);
                        }}
                      />
                      {isIncreased && (
                        <MaterialCommunityIcons name="arrow-up" size={13} color="#10B981" />
                      )}
                      {isDecreased && (
                        <MaterialCommunityIcons name="arrow-down" size={13} color="#F97316" />
                      )}
                    </View>

                    {/* REPS Input Pill */}
                    <View style={[styles.clayInputPill, { width: 65 }]}>
                      <TextInput
                        style={[styles.pillInputText, { color: '#F97316' }]}
                        keyboardType="number-pad"
                        value={
                          repsInputTexts[set.id] !== undefined
                            ? repsInputTexts[set.id]
                            : set.reps > 0
                            ? String(set.reps)
                            : ''
                        }
                        placeholder="0"
                        placeholderTextColor={colors.textDim}
                        onChangeText={(txt) => {
                          const clean = txt.replace(/[^0-9]/g, '');
                          setRepsInputTexts((prev) => ({ ...prev, [set.id]: clean }));
                          const parsed = parseInt(clean, 10);
                          handleUpdateReps(safeExIdx, originalIdx, isNaN(parsed) ? 0 : parsed);
                        }}
                      />
                    </View>

                    {/* Completion Check Button */}
                    <AnimatedSetCheckBtn
                      completed={set.completed}
                      onPress={() => handleToggleSetComplete(safeExIdx, originalIdx)}
                      colors={colors}
                      styles={styles}
                    />
                  </View>
                );
              })}

              {/* Set Addition & Action Bar */}
              <View style={styles.setButtonsRow}>
                <TouchableOpacity
                  style={styles.addSetPillBtn}
                  onPress={() => handleAddSet(safeExIdx, false)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={17} color={colors.textPrimary} />
                  <Text style={styles.addSetPillText}>Add Set</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addWarmupBtn}
                  onPress={() => handleAddSet(safeExIdx, true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="fire" size={15} color="#F59E0B" />
                  <Text style={styles.addWarmupText}>+ Warmup</Text>
                </TouchableOpacity>
              </View>

              {/* Exercise Switcher Navigation Tabs */}
              {currentExerciseCount > 1 && (
                <View style={styles.exerciseNavRow}>
                  <TouchableOpacity
                    style={[styles.navArrowBtn, safeExIdx === 0 && { opacity: 0.3 }]}
                    onPress={() => setActiveExIdx(Math.max(0, safeExIdx - 1))}
                    disabled={safeExIdx === 0}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
                    <Text style={styles.navArrowText}>PREVIOUS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.navArrowBtn,
                      safeExIdx === currentExerciseCount - 1 && { opacity: 0.3 },
                    ]}
                    onPress={() => setActiveExIdx(Math.min(currentExerciseCount - 1, safeExIdx + 1))}
                    disabled={safeExIdx === currentExerciseCount - 1}
                  >
                    <Text style={styles.navArrowText}>NEXT</Text>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyStagingCard}>
              <MaterialCommunityIcons name="dumbbell" size={56} color={colors.accent} />
              <Text style={styles.emptyTitle}>Ready to Train</Text>
              <Text style={styles.emptyDesc}>
                Add your exercises to build your session or start a routine.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setIsPickerOpen(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#000" />
                <Text style={styles.emptyAddBtnText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* "+ Add Another Exercise" Card */}
          {currentExercise && (
            <TouchableOpacity
              style={styles.addExerciseCard}
              onPress={() => setIsPickerOpen(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.addExerciseCardText}>Add Another Exercise to Workout</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Floating Rest Timer Bar */}
        <WorkoutRestTimerBar />

        {/* Floating Clay Bottom Island Controls */}
        <Animated.View style={[styles.floatingBottomIsland, { bottom: controlsBottomAnim }]}>
          {!isStarted ? (
            <TouchableOpacity
              style={styles.startWorkoutPill}
              onPress={startActiveWorkout}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="play" size={20} color="#000" />
              <Text style={styles.startWorkoutPillText}>START WORKOUT</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inSessionControlsRow}>
              <TouchableOpacity
                style={styles.pausePillBtn}
                onPress={togglePauseActiveWorkout}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={isPaused ? 'play' : 'pause'}
                  size={18}
                  color={isPaused ? '#10B981' : '#F59E0B'}
                />
                <Text style={[styles.pausePillText, { color: isPaused ? '#10B981' : '#F59E0B' }]}>
                  {isPaused ? 'RESUME' : 'PAUSE'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishPillBtn}
                onPress={handleFinish}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="flag-checkered" size={18} color="#000" />
                <Text style={styles.finishPillText}>FINISH WORKOUT</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Exercise Action Overflow Modal */}
        <Modal
          visible={exerciseMenuIdx !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setExerciseMenuIdx(null)}
        >
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setExerciseMenuIdx(null)}
          >
            <View style={styles.menuCard}>
              <Text style={styles.menuTitle}>Exercise Actions</Text>

              {exerciseDef && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setSelectedGuideExercise(exerciseDef);
                    setExerciseMenuIdx(null);
                  }}
                >
                  <MaterialCommunityIcons name="book-open-outline" size={20} color={colors.accent} />
                  <Text style={styles.menuItemText}>Movement Guide & Form Cues</Text>
                </TouchableOpacity>
              )}

              {safeExIdx > 0 && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMoveExercise(safeExIdx, 'up')}
                >
                  <MaterialCommunityIcons name="arrow-up" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuItemText}>Move Exercise Up</Text>
                </TouchableOpacity>
              )}

              {safeExIdx < currentExerciseCount - 1 && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMoveExercise(safeExIdx, 'down')}
                >
                  <MaterialCommunityIcons name="arrow-down" size={20} color={colors.textPrimary} />
                  <Text style={styles.menuItemText}>Move Exercise Down</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                onPress={() => handleRemoveExercise(safeExIdx)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Remove Exercise</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Exercise Picker Modal */}
        <ExercisePickerModal
          visible={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={(selectedEx: ExerciseDefinition) => {
            updateActiveSession((prev) => {
              const newEx: WorkoutExercise = {
                id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                exerciseId: selectedEx.id,
                exerciseName: selectedEx.name,
                category: selectedEx.category,
                weightUnit: prev.weightUnit || activeUser.weightUnit,
                sets: [
                  {
                    id: `s-${Date.now()}-1`,
                    setNumber: 1,
                    type: 'regular',
                    weight: 60,
                    reps: 10,
                    completed: false,
                  },
                  {
                    id: `s-${Date.now()}-2`,
                    setNumber: 2,
                    type: 'regular',
                    weight: 60,
                    reps: 10,
                    completed: false,
                  },
                  {
                    id: `s-${Date.now()}-3`,
                    setNumber: 3,
                    type: 'regular',
                    weight: 60,
                    reps: 10,
                    completed: false,
                  },
                ],
              };
              return { ...prev, exercises: [...prev.exercises, newEx] };
            });
            setIsPickerOpen(false);
            setActiveExIdx(activeSession.exercises.length);
          }}
        />

        {/* Exercise Guide Modal */}
        {selectedGuideExercise && (
          <ExerciseGuideModal
            exercise={selectedGuideExercise}
            visible={!!selectedGuideExercise}
            onClose={() => setSelectedGuideExercise(null)}
          />
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <WorkoutConfirmModal
            visible={confirmModal.visible}
            type={confirmModal.type}
            exerciseName={confirmModal.exerciseName}
            setNumber={confirmModal.setNumber}
            incompleteExercises={confirmModal.incompleteExercises}
            onClose={() => setConfirmModal(null)}
            onConfirm={async () => {
              if (confirmModal.type === 'remove_exercise' && confirmModal.exerciseIndex !== undefined) {
                const targetIdx = confirmModal.exerciseIndex;
                updateActiveSession((prev) => {
                  const updated = prev.exercises.filter((_, idx) => idx !== targetIdx);
                  return { ...prev, exercises: updated };
                });
                setActiveExIdx(Math.max(0, safeExIdx - 1));
              } else if (confirmModal.type === 'finish_empty') {
                cancelSession();
                onClose();
              } else if (confirmModal.type === 'finish_workout') {
                await finishSession();
                onClose();
              }
              setConfirmModal(null);
            }}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? '#0C0D12' : '#F1F4F9',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    circleDismissBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000' : '#64748B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.45 : 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    exerciseIndexPill: {
      backgroundColor: isDark ? '#1C1F2B' : '#E2E8F0',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 14,
    },
    exerciseIndexText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.textDim,
    },
    timerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000' : '#64748B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    timerPillPaused: {
      borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    timerText: {
      fontSize: 13,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: colors.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    visualStageCard: {
      backgroundColor: isDark ? '#14161F' : '#FFFFFF',
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
      paddingTop: 16,
      paddingBottom: 16,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.16,
      shadowRadius: 16,
      elevation: 6,
      alignItems: 'center',
      marginBottom: 16,
    },
    visualStageIllustration: {
      width: '100%',
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseImage: {
      width: '90%',
      height: '100%',
    },
    placeholderVisual: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    targetMusclesPill: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.accent,
      backgroundColor: isDark ? '#1F1A2E' : '#EDE9FE',
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    paginationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
    },
    paginationDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
    },
    paginationDotActive: {
      width: 18,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    thumbnailStrip: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      gap: 10,
    },
    thumbnailBox: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: isDark ? '#1C1F2B' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      gap: 3,
    },
    thumbnailBoxActive: {
      borderColor: '#F97316',
      borderWidth: 2,
      shadowColor: '#F97316',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 4,
    },
    thumbnailLabel: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.textDim,
    },
    thumbnailLabelActive: {
      color: '#F97316',
      fontWeight: '900',
    },
    exerciseHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    exerciseTitle: {
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 0.2,
      color: colors.textPrimary,
    },
    exerciseCategory: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: 2,
    },
    moreActionBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: isDark ? '#000' : '#64748B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 5,
      elevation: 3,
    },
    coachInsightCard: {
      backgroundColor: isDark ? '#1A1528' : '#FAF5FF',
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(192, 132, 252, 0.35)' : 'rgba(147, 51, 234, 0.25)',
      padding: 14,
      marginBottom: 18,
      shadowColor: isDark ? '#A855F7' : '#9333EA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    coachInsightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6,
    },
    coachBatteryIcon: {
      width: 24,
      height: 24,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(147, 51, 234, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    coachInsightTag: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: '#C084FC',
    },
    coachInsightBody: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
      color: colors.textSecondary,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    colHeader: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textDim,
    },
    sectionDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    dividerBadge: {
      backgroundColor: isDark ? '#1C1F2B' : '#E2E8F0',
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    dividerBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.2,
      color: colors.textDim,
    },
    claySetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#161822' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.95)',
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 8,
      gap: 8,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    setNumberBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isDark ? '#202434' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    setNumberText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    prevText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    clayInputPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#0F1118' : '#F8FAFC',
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      paddingVertical: 6,
      paddingHorizontal: 6,
      height: 38,
    },
    pillInputText: {
      fontSize: 13,
      fontWeight: '900',
      textAlign: 'center',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: colors.textPrimary,
      padding: 0,
      marginRight: 2,
    },
    checkBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? '#202434' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: isDark ? '#000' : '#CBD5E1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 2,
    },
    checkBtnCompleted: {
      backgroundColor: '#10B981',
      borderColor: '#34D399',
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 4,
    },
    setButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 10,
      marginBottom: 16,
    },
    addSetPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#202434' : '#FFFFFF',
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.95)',
      paddingVertical: 10,
      paddingHorizontal: 22,
      shadowColor: isDark ? '#000' : '#64748B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    addSetPillText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    addWarmupBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: isDark ? '#281E10' : '#FEF3C7',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(245, 158, 11, 0.25)',
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    addWarmupText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#F59E0B',
    },
    exerciseNavRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 16,
    },
    navArrowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.95)',
    },
    navArrowText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textPrimary,
    },
    addExerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? '#151722' : '#FFFFFF',
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.95)',
      paddingVertical: 14,
      marginTop: 6,
      marginBottom: 20,
    },
    addExerciseCardText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
    },
    emptyStagingCard: {
      backgroundColor: isDark ? '#14161F' : '#FFFFFF',
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.95)',
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    emptyDesc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    emptyAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: 24,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginTop: 10,
    },
    emptyAddBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#000000',
    },
    floatingBottomIsland: {
      position: 'absolute',
      left: 16,
      right: 16,
      borderRadius: 32,
      backgroundColor: isDark ? '#161924' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.95)',
      padding: 8,
      shadowColor: isDark ? '#000000' : '#475569',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDark ? 0.65 : 0.22,
      shadowRadius: 18,
      elevation: 16,
    },
    startWorkoutPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 24,
      paddingVertical: 14,
    },
    startWorkoutPillText: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: '#000000',
    },
    inSessionControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pausePillBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#202434' : '#F1F5F9',
      borderRadius: 22,
      paddingVertical: 12,
    },
    pausePillText: {
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
    },
    finishPillBtn: {
      flex: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      borderRadius: 22,
      paddingVertical: 12,
    },
    finishPillText: {
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: '#000000',
    },
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
      padding: 16,
    },
    menuCard: {
      backgroundColor: isDark ? '#1C1F2B' : '#FFFFFF',
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.95)',
      padding: 16,
      gap: 4,
    },
    menuTitle: {
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: colors.textDim,
      marginBottom: 10,
      paddingHorizontal: 8,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    },
    menuItemText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
