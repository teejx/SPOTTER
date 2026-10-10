import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { calculateOneRepMax } from '../lib/storage';

export const MetricsScreen: React.FC = () => {
  const { workouts, personalRecords, activeUser, walkingLogs, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const totalSteps = walkingLogs.reduce((acc, w) => acc + (w.steps || 0), 0);
  const totalWalkKm = walkingLogs.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  const totalWalkHours = (
    walkingLogs.reduce((acc, w) => acc + (w.durationMinutes || 0), 0) / 60
  ).toFixed(1);
  const totalWalkCalories = walkingLogs.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

  // 1RM Calculator Interactive State
  const [calcWeight, setCalcWeight] = useState('100');
  const [calcReps, setCalcReps] = useState(5);

  const estimated1RM = useMemo(() => {
    const w = parseFloat(calcWeight) || 0;
    return calculateOneRepMax(w, calcReps);
  }, [calcWeight, calcReps]);

  // Volume distribution by muscle group
  const muscleDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0,
      Cardio: 0,
    };

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const cat = ex.category || 'Chest';
        const vol = ex.sets.reduce((acc, s) => acc + (s.completed ? s.weight * s.reps : 0), 0);
        if (counts[cat] !== undefined) {
          counts[cat] += vol;
        } else {
          counts['Chest'] += vol;
        }
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .map(([name, vol]) => ({
        name,
        volume: vol,
        percentage: Math.round((vol / total) * 100),
      }))
      .filter((m) => m.volume > 0)
      .sort((a, b) => b.volume - a.volume);
  }, [workouts]);

  const totalVolumeTons = (
    workouts.reduce((acc, w) => acc + (w.totalVolume || 0), 0) / 1000
  ).toFixed(1);

  const totalSets = workouts.reduce(
    (acc, w) => acc + w.exercises.reduce((sAcc, ex) => sAcc + ex.sets.length, 0),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Metrics & Analytics</Text>
          <Text style={styles.subtitle}>Performance overview & tools</Text>
        </View>

        {/* Global Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LIFETIME VOL</Text>
            <Text style={[styles.statVal, { color: colors.accent }]}>
              {totalVolumeTons}k <Text style={styles.statUnit}>{activeUser?.weightUnit}</Text>
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL SETS</Text>
            <Text style={styles.statVal}>{totalSets}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PRS LOGGED</Text>
            <Text style={[styles.statVal, { color: colors.flame }]}>{personalRecords.length}</Text>
          </View>
        </View>

        {/* Walking & Movement Analytics */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="walk" size={18} color={colors.accent} />
            <Text style={styles.cardHeaderTitle}>WALKING & MOVEMENT ANALYTICS</Text>
          </View>

          <View style={styles.walkingGrid}>
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricValue}>{totalSteps.toLocaleString()}</Text>
              <Text style={styles.walkingMetricLabel}>TOTAL STEPS</Text>
            </View>
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricValue}>{totalWalkKm.toFixed(1)} km</Text>
              <Text style={styles.walkingMetricLabel}>TOTAL DISTANCE</Text>
            </View>
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricValue}>{totalWalkHours} hrs</Text>
              <Text style={styles.walkingMetricLabel}>ACTIVE TIME</Text>
            </View>
            <View style={styles.walkingMetricBox}>
              <Text style={styles.walkingMetricValue}>{totalWalkCalories.toLocaleString()} kcal</Text>
              <Text style={styles.walkingMetricLabel}>CALORIES BURNED</Text>
            </View>
          </View>

          <View style={styles.walkingSessionsBadge}>
            <MaterialCommunityIcons name="history" size={14} color={colors.textMuted} />
            <Text style={styles.walkingSessionsText}>
              {walkingLogs.length} total walking sessions recorded
            </Text>
          </View>
        </View>

        {/* 1RM Calculator */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="calculator-variant" size={18} color={colors.accent} />
            <Text style={styles.cardHeaderTitle}>ONE-REP MAX ESTIMATOR (EPLEY)</Text>
          </View>

          <View style={styles.calcInputsRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.inputLabel}>LIFTED WEIGHT ({activeUser?.weightUnit.toUpperCase()})</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="decimal-pad"
                value={calcWeight}
                onChangeText={setCalcWeight}
                placeholder="100"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.inputLabel}>REPS PERFORMED</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCalcReps(Math.max(1, calcReps - 1))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.repsDisplay}>{calcReps}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCalcReps(Math.min(30, calcReps + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Result Banner */}
          <View style={styles.resultBanner}>
            <View>
              <Text style={styles.resultLabel}>ESTIMATED 1RM</Text>
              <Text style={styles.resultBigVal}>
                {estimated1RM} <Text style={styles.resultUnit}>{activeUser?.weightUnit}</Text>
              </Text>
            </View>
            <View style={styles.formulaTag}>
              <Text style={styles.formulaText}>EPLEY 1RM</Text>
            </View>
          </View>

          {/* Percentage Table Grid */}
          <View style={styles.pctGrid}>
            {[95, 90, 85, 80, 75, 70].map((pct) => (
              <View key={pct} style={styles.pctChip}>
                <Text style={styles.pctLabel}>{pct}%</Text>
                <Text style={styles.pctVal}>
                  {Math.round(estimated1RM * (pct / 100))} {activeUser?.weightUnit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Volume Distribution by Muscle Group */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="chart-donut" size={18} color={colors.accent} />
            <Text style={styles.cardHeaderTitle}>VOLUME BY MUSCLE GROUP</Text>
          </View>

          {muscleDistribution.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No volume data recorded yet</Text>
              <Text style={styles.emptySub}>
                Finish a workout to view your target muscle distribution breakdown.
              </Text>
            </View>
          ) : (
            <View style={styles.barList}>
              {muscleDistribution.map((m) => (
                <View key={m.name} style={styles.barItem}>
                  <View style={styles.barHeader}>
                    <Text style={styles.barName}>{m.name}</Text>
                    <Text style={styles.barVal}>
                      {m.percentage}% ({m.volume.toLocaleString()} {activeUser?.weightUnit})
                    </Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${m.percentage}%`, backgroundColor: colors.accent }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Personal Records Showcase */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.flame} />
            <Text style={styles.cardHeaderTitle}>ALL-TIME PERSONAL RECORDS</Text>
          </View>

          {personalRecords.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No PRs yet</Text>
              <Text style={styles.emptySub}>
                Complete exercise sets with weight to track your personal bests here.
              </Text>
            </View>
          ) : (
            <View style={styles.prGrid}>
              {personalRecords.map((pr) => (
                <View key={pr.exerciseId} style={styles.prCard}>
                  <View style={styles.prHeader}>
                    <Text style={styles.prExerciseName}>{pr.exerciseName}</Text>
                    <Text style={styles.prDate}>{pr.date}</Text>
                  </View>
                  <View style={styles.prBottom}>
                    <Text style={styles.prWeightText}>
                      {pr.maxWeight} {activeUser?.weightUnit}
                    </Text>
                    <Text style={styles.prRepsText}>× {pr.repsAtMax} reps</Text>
                    <View style={{ flex: 1 }} />
                    <View style={styles.pr1rmBadge}>
                      <Text style={styles.pr1rmText}>Est. 1RM: {pr.estimatedOneRepMax} {activeUser?.weightUnit}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 110,
    },
    header: {
      marginTop: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 10,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 9,
      fontFamily: 'monospace',
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    statVal: {
      fontSize: 15,
      fontFamily: 'monospace',
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 4,
    },
    statUnit: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textMuted,
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 18,
      gap: 14,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardHeaderTitle: {
      fontSize: 11,
      fontFamily: 'monospace',
      fontWeight: '900',
      color: colors.textDim,
      letterSpacing: 1,
    },
    calcInputsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    inputLabel: {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    calcInput: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 12,
      height: 44,
      paddingHorizontal: 12,
      color: colors.textPrimary,
      fontSize: 15,
      fontFamily: 'monospace',
      fontWeight: '800',
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 12,
      height: 44,
      paddingHorizontal: 6,
      justifyContent: 'space-between',
    },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBtnText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '900',
    },
    repsDisplay: {
      color: colors.accent,
      fontSize: 16,
      fontFamily: 'monospace',
      fontWeight: '900',
    },
    resultBanner: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.accent,
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resultLabel: {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
    },
    resultBigVal: {
      fontSize: 26,
      fontFamily: 'monospace',
      fontWeight: '900',
      color: colors.accent,
      marginTop: 2,
    },
    resultUnit: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    formulaTag: {
      backgroundColor: colors.accentSubtle,
      borderColor: colors.accent,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    formulaText: {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: '800',
      color: colors.accent,
    },
    pctGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    pctChip: {
      flex: 1,
      minWidth: 70,
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: 'center',
    },
    pctLabel: {
      fontSize: 9,
      fontFamily: 'monospace',
      color: colors.textDim,
      fontWeight: '800',
    },
    pctVal: {
      fontSize: 13,
      fontFamily: 'monospace',
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    emptyBox: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 4,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    emptySub: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
    },
    barList: {
      gap: 12,
    },
    barItem: {
      gap: 6,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    barName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    barVal: {
      fontSize: 11,
      fontFamily: 'monospace',
      color: colors.textMuted,
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceRaised,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
    prGrid: {
      gap: 10,
    },
    prCard: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    prHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    prExerciseName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      flex: 1,
    },
    prDate: {
      fontSize: 10,
      fontFamily: 'monospace',
      color: colors.textDim,
    },
    prBottom: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    prWeightText: {
      fontSize: 18,
      fontFamily: 'monospace',
      fontWeight: '900',
      color: colors.accent,
    },
    prRepsText: {
      fontSize: 11,
      fontFamily: 'monospace',
      color: colors.textDim,
    },
    pr1rmBadge: {
      backgroundColor: colors.surfaceBorder,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    pr1rmText: {
      fontSize: 10,
      fontFamily: 'monospace',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    walkingGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    walkingMetricBox: {
      width: '48%',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      padding: 12,
      alignItems: 'center',
    },
    walkingMetricValue: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    walkingMetricLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
      fontFamily: 'monospace',
      letterSpacing: 0.8,
      marginTop: 4,
    },
    walkingSessionsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    walkingSessionsText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '700',
    },
  });
