import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Keyboard,
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
import { ExerciseDefinition, WorkoutSet } from '../types';

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

  // Quick Workout flow: if opened with 0 exercises, user adds exercises first before starting
  const hasExercises = (activeSession?.exercises.length || 0) > 0;
  const [isStarted, setIsStarted] = useState(hasExercises);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const activeScrollYRef = useRef<number>(0);

  // When exercises are added to a quick workout, keep staging until user clicks Start
  useEffect(() => {
    if (activeSession && activeSession.exercises.length > 0 && !hasExercises) {
      // exercises were just added
    }
  }, [activeSession?.exercises.length]);

  // Session elapsed timer ticker - only ticks when isStarted is true
  useEffect(() => {
    if (!isStarted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted]);

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

  const totalVolume = activeSession.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return sAcc + (s.completed ? s.weight * s.reps : 0);
      }, 0)
    );
  }, 0);

  const completedSetsTotal = activeSession.exercises.reduce((count, ex) => {
    return count + ex.sets.filter((s) => s.completed).length;
  }, 0);

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    // If user completes a set, auto-start session if not already started
    if (!isStarted) {
      setIsStarted(true);
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

  // Reduce / remove last set
  const handleRemoveLastSet = (exIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      if (targetEx.sets.length <= 1) return prev; // Keep at least 1 set

      targetEx.sets = targetEx.sets.slice(0, -1);
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Remove specific set by index
  const handleRemoveSpecificSet = (exIdx: number, setIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      if (targetEx.sets.length <= 1) return prev;

      const filtered = targetEx.sets.filter((_, idx) => idx !== setIdx);
      targetEx.sets = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      updatedExs[exIdx] = targetEx;
      return { ...prev, exercises: updatedExs };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveExercise = (exIdx: number) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise from your workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          updateActiveSession((prev) => ({
            ...prev,
            exercises: prev.exercises.filter((_, idx) => idx !== exIdx),
          }));
        },
      },
    ]);
  };

  const handleStartWorkout = () => {
    setIsStarted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleFinish = async () => {
    if (!isStarted || activeSession.exercises.length === 0) {
      Alert.alert(
        'Empty Workout',
        'Add exercises and start the workout before finishing.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (completedSetsTotal === 0) {
      Alert.alert(
        'No Sets Completed',
        'You have not checked off any completed sets (✓). Do you want to keep training or discard this session?',
        [
          { text: 'Keep Training', style: 'cancel' },
          {
            text: 'Discard Session',
            style: 'destructive',
            onPress: () => {
              cancelSession();
              onClose();
            },
          },
        ]
      );
      return;
    }

    const uncompletedExCount = activeSession.exercises.filter(
      (ex) => !ex.sets.some((s) => s.completed && s.reps > 0)
    ).length;

    const message =
      uncompletedExCount > 0
        ? `Complete this workout? (${uncompletedExCount} untouched exercise${uncompletedExCount > 1 ? 's' : ''} will be excluded). Total volume: ${totalVolume.toLocaleString()} ${activeUser.weightUnit}`
        : `Complete this workout? Total volume: ${totalVolume.toLocaleString()} ${activeUser.weightUnit}`;

    Alert.alert(
      'Finish Workout',
      message,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Save & Log',
          onPress: async () => {
            await finishSession();
            onClose();
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    // If not started or empty, dismiss without confirmation alert
    if (!isStarted || activeSession.exercises.length === 0) {
      cancelSession();
      onClose();
      return;
    }

    Alert.alert('Discard Workout', 'Are you sure? This workout will not be saved.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          cancelSession();
          onClose();
        },
      },
    ]);
  };

  const handleBackRequest = () => {
    if (selectedGuideExercise) {
      setSelectedGuideExercise(null);
      return;
    }
    if (isPickerOpen) {
      setIsPickerOpen(false);
      return;
    }
    handleCancel();
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
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {activeSession.title}
            </Text>
            <View style={styles.timerRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={isStarted ? colors.accent : colors.textMuted}
              />
              <Text style={[styles.timerText, !isStarted && { color: colors.textMuted }]}>
                {isStarted ? timeFormatted : 'READY'}
              </Text>
            </View>
          </View>

          {isStarted ? (
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={handleFinish}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="check" size={16} color={colors.accentContrastText} />
              <Text style={styles.finishBtnText}>Finish</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cancelHeaderBtn}
              onPress={handleCancel}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cancelHeaderBtnText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Exercises Scroll View */}
        <ScrollView
          ref={scrollRef}
          style={[styles.scrollView, { marginBottom: keyboardHeight }]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: (restTimer.isRunning || restTimer.isFinished) ? 140 : (keyboardHeight > 0 ? 32 : 36) }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Empty Staging State (Quick Workout with 0 exercises) */}
          {activeSession.exercises.length === 0 ? (
            <View style={styles.emptyStagingBox}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="lightning-bolt" size={36} color={colors.accent} />
              </View>
              <Text style={styles.emptyStagingTitle}>BUILD YOUR QUICK WORKOUT</Text>
              <Text style={styles.emptyStagingSubtitle}>
                Add exercises to your session below. Once ready, hit Start to begin timing your training.
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
                  <Text style={[styles.colHeader, { flex: 1 }]}>{activeUser.weightUnit.toUpperCase()}</Text>
                  <Text style={[styles.colHeader, { width: 85 }]}>REPS</Text>
                  <Text style={[styles.colHeader, { width: 44, textAlign: 'center' }]}>DONE</Text>
                  {exercise.sets.length > 1 && (
                    <View style={{ width: 28 }} />
                  )}
                </View>

                {/* Sets List */}
                {exercise.sets.map((set, setIdx) => (
                  <View
                    key={set.id}
                    style={[styles.setRow, set.completed && styles.setRowCompleted]}
                  >
                    {/* Set Number */}
                    <View style={styles.setNumberBox}>
                      <Text style={styles.setNumberText}>{set.setNumber}</Text>
                    </View>

                    {/* Weight Input */}
                    <View style={styles.weightCol}>
                      <TextInput
                        style={styles.weightInput}
                        keyboardType="decimal-pad"
                        value={set.weight ? String(set.weight) : ''}
                        onChangeText={(txt) => handleUpdateWeight(exIdx, setIdx, parseFloat(txt) || 0)}
                        onFocus={() => {
                          const targetY = Math.max(0, exIdx * 240 + setIdx * 48 - 60);
                          activeScrollYRef.current = targetY;
                          setTimeout(() => {
                            scrollRef.current?.scrollTo({ y: targetY, animated: true });
                          }, 100);
                        }}
                        onBlur={() => {
                          activeScrollYRef.current = 0;
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

                    {/* Checkmark Button */}
                    <TouchableOpacity
                      style={[styles.checkBtn, set.completed && styles.checkBtnCompleted]}
                      onPress={() => handleToggleSetComplete(exIdx, setIdx)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={set.completed ? colors.accentContrastText : colors.textDim}
                      />
                    </TouchableOpacity>

                    {/* Quick remove specific set button */}
                    {exercise.sets.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeSetRowBtn}
                        onPress={() => handleRemoveSpecificSet(exIdx, setIdx)}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="close" size={16} color={colors.textDim} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

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
                      style={styles.removeSetBtn}
                      onPress={() => handleRemoveLastSet(exIdx)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="minus" size={15} color={colors.danger} />
                      <Text style={styles.removeSetText}>Remove Set</Text>
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

              {/* Start Workout button when session is not yet started */}
              {!isStarted && (
                <TouchableOpacity
                  style={styles.startWorkoutHeroBtn}
                  onPress={handleStartWorkout}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="play" size={20} color={colors.accentContrastText} />
                  <Text style={styles.startWorkoutHeroBtnText}>START WORKOUT</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Live Floating Rest Timer Bar */}
        <WorkoutRestTimerBar />

        {/* Modals */}
        <ExercisePickerModal
          visible={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
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
    cancelBtn: {
      padding: 6,
    },
    cancelHeaderBtn: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    cancelHeaderBtnText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
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
    finishBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      gap: 4,
    },
    finishBtnText: {
      color: colors.accentContrastText,
      fontSize: 12,
      fontWeight: '800',
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
      gap: 6,
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
    setNumberBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    setNumberText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
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
    removeSetText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
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
    startWorkoutHeroBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: colors.accent,
      gap: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    startWorkoutHeroBtnText: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.accentContrastText,
      letterSpacing: 0.8,
    },
  });
