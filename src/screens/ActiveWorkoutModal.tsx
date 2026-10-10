import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { EXERCISE_DATABASE } from '../lib/exercises';
import { ExercisePickerModal } from '../components/ExercisePickerModal';
import { ExerciseGuideModal } from '../components/ExerciseGuideModal';
import { ExerciseDefinition, WorkoutSet } from '../types';

// Elapsed session timer
const WorkoutTimerText = memo(() => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <Text style={styles.timerText}>
      {mins}:{secs < 10 ? '0' : ''}{secs}
    </Text>
  );
});

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
  } = useFitness();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedGuideExercise, setSelectedGuideExercise] = useState<ExerciseDefinition | null>(null);

  if (!activeSession || !activeUser) return null;

  const totalVolume = activeSession.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        return sAcc + (s.completed ? s.weight * s.reps : 0);
      }, 0)
    );
  }, 0);

  const handleToggleSetComplete = (exIdx: number, setIdx: number) => {
    updateActiveSession((prev) => {
      const updatedExs = [...prev.exercises];
      const targetEx = { ...updatedExs[exIdx] };
      const updatedSets = [...targetEx.sets];
      const targetSet = { ...updatedSets[setIdx] };

      const willComplete = !targetSet.completed;
      targetSet.completed = willComplete;
      updatedSets[setIdx] = targetSet;
      targetEx.sets = updatedSets;
      updatedExs[exIdx] = targetEx;

      if (willComplete) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        restTimer.start(90, targetEx.exerciseName);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return { ...prev, exercises: updatedExs };
    });
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
        id: `s-${Date.now()}`,
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

  const handleFinish = async () => {
    Alert.alert(
      'Finish Workout',
      `Complete this workout? Total volume: ${totalVolume.toLocaleString()} ${activeUser.weightUnit}`,
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
      <SafeAreaView style={styles.safeArea}>
        {/* Sticky Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <MaterialCommunityIcons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {activeSession.title}
            </Text>
            <View style={styles.timerRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.volt} />
              <WorkoutTimerText />
            </View>
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
            <MaterialCommunityIcons name="check" size={16} color="#000000" />
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Exercises Scroll View */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
                        <MaterialCommunityIcons name="trophy" size={12} color={Colors.volt} />
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
                        if (def) setSelectedGuideExercise(def);
                      }}
                    >
                      <MaterialCommunityIcons name="information-outline" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.guideIconBtn}
                      onPress={() => handleRemoveExercise(exIdx)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Set Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.colHeader, { width: 40 }]}>SET</Text>
                  <Text style={[styles.colHeader, { flex: 1 }]}>{activeUser.weightUnit.toUpperCase()}</Text>
                  <Text style={[styles.colHeader, { width: 85 }]}>REPS</Text>
                  <Text style={[styles.colHeader, { width: 44, textAlign: 'center' }]}>DONE</Text>
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
                        placeholder="0"
                        placeholderTextColor={Colors.textDim}
                      />
                    </View>

                    {/* Reps Stepper */}
                    <View style={styles.repsCol}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateReps(exIdx, setIdx, -1)}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.repsValueText}>{set.reps}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateReps(exIdx, setIdx, 1)}
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
                        color={set.completed ? '#000000' : Colors.textDim}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetBtn}
                  onPress={() => handleAddSet(exIdx)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={Colors.textMuted} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add Exercise Button */}
          <TouchableOpacity
            style={styles.addExerciseCard}
            onPress={() => setIsPickerOpen(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus-circle" size={20} color={Colors.volt} />
            <Text style={styles.addExerciseText}>Add Exercise to Workout</Text>
          </TouchableOpacity>
        </ScrollView>

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
                  id: `we-${Date.now()}`,
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  cancelBtn: {
    padding: 6,
  },
  topCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.volt,
    fontFamily: 'monospace',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.volt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  finishBtnText: {
    color: '#000000',
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
    paddingBottom: 40,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  exerciseNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  targetNoteText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.volt,
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
    color: Colors.volt,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  exerciseHeaderActions: {
    flexDirection: 'row',
    gap: 8,
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
    borderBottomColor: Colors.surfaceBorder,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textDim,
    fontFamily: 'monospace',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  setRowCompleted: {
    backgroundColor: Colors.voltSubtle,
  },
  setNumberBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  weightCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  weightInput: {
    backgroundColor: Colors.surfaceRaised,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
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
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stepBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  repsValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnCompleted: {
    backgroundColor: Colors.volt,
    borderColor: Colors.volt,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  addSetText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  addExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 8,
  },
  addExerciseText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
});
