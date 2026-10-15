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
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { calculateOneRepMax } from '../lib/storage';
import { WeightUnit } from '../types';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

const convertWeight = (val: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return val;
  if (from === 'kg' && to === 'lbs') return val * KG_TO_LBS;
  return val * LBS_TO_KG;
};

export const MetricsScreen: React.FC = () => {
  const { workouts, personalRecords, activeUser, walkingLogs, colors, isDark } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Active display unit toggle across metrics (KG vs LBS)
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(activeUser?.weightUnit || 'kg');

  const totalSteps = walkingLogs.reduce((acc, w) => acc + (w.steps || 0), 0);
  const totalWalkKm = walkingLogs.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  const totalWalkHours = (
    walkingLogs.reduce((acc, w) => acc + (w.durationMinutes || 0), 0) / 60
  ).toFixed(1);
  const totalWalkCalories = walkingLogs.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

  // 1RM Calculator Interactive State (Defaults to 0 per user requirement)
  const [calcWeight, setCalcWeight] = useState('0');
  const [calcReps, setCalcReps] = useState(0);

  const estimated1RM = useMemo(() => {
    const w = parseFloat(calcWeight) || 0;
    if (w <= 0 || calcReps <= 0) return 0;
    return calculateOneRepMax(w, calcReps);
  }, [calcWeight, calcReps]);

  // Weight Converter Tool Interactive State (KG ⇄ LBS)
  const [converterDirection, setConverterDirection] = useState<'kg_to_lbs' | 'lbs_to_kg'>('kg_to_lbs');
  const [converterKg, setConverterKg] = useState('100');
  const [converterLbs, setConverterLbs] = useState('220.5');

  const handleUpdateConverterKg = (txt: string) => {
    const clean = txt.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
    setConverterKg(sanitized);
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed > 0) {
      setConverterLbs((parsed * KG_TO_LBS).toFixed(1));
    } else if (sanitized === '' || parsed === 0) {
      setConverterLbs('0');
    }
  };

  const handleUpdateConverterLbs = (txt: string) => {
    const clean = txt.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
    setConverterLbs(sanitized);
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed > 0) {
      setConverterKg((parsed * LBS_TO_KG).toFixed(1));
    } else if (sanitized === '' || parsed === 0) {
      setConverterKg('0');
    }
  };

  const handleSwapConverter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newDir = converterDirection === 'kg_to_lbs' ? 'lbs_to_kg' : 'kg_to_lbs';
    setConverterDirection(newDir);
    if (newDir === 'lbs_to_kg') {
      const parsed = parseFloat(converterKg);
      if (!isNaN(parsed) && parsed > 0) {
        setConverterLbs(converterKg);
        setConverterKg((parsed * LBS_TO_KG).toFixed(1));
      }
    } else {
      const parsed = parseFloat(converterLbs);
      if (!isNaN(parsed) && parsed > 0) {
        setConverterKg(converterLbs);
        setConverterLbs((parsed * KG_TO_LBS).toFixed(1));
      }
    }
  };

  const handleSelectConverterPreset = (val: number, unit: 'kg' | 'lbs') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (unit === 'kg') {
      setConverterKg(String(val));
      setConverterLbs((val * KG_TO_LBS).toFixed(1));
    } else {
      setConverterLbs(String(val));
      setConverterKg((val * LBS_TO_KG).toFixed(1));
    }
  };

  // Lifetime Volume in selected displayUnit
  const totalVolumeInDisplayUnit = useMemo(() => {
    return workouts.reduce((acc, w) => {
      const wUnit = w.weightUnit || activeUser?.weightUnit || 'kg';
      const vol = w.totalVolume || 0;
      return acc + convertWeight(vol, wUnit, displayUnit);
    }, 0);
  }, [workouts, displayUnit, activeUser?.weightUnit]);

  const totalVolumeFormatted = (totalVolumeInDisplayUnit / 1000).toFixed(1);

  // Volume distribution by muscle group in selected displayUnit
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
      const defaultUnit = w.weightUnit || activeUser?.weightUnit || 'kg';
      w.exercises.forEach((ex) => {
        const cat = ex.category || 'Chest';
        const exUnit = ex.weightUnit || defaultUnit;
        const vol = ex.sets.reduce((acc, s) => {
          if (!s.completed) return acc;
          const weightInUnit = convertWeight(s.weight, exUnit, displayUnit);
          return acc + weightInUnit * s.reps;
        }, 0);
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
        volume: Math.round(vol),
        percentage: Math.round((vol / total) * 100),
      }))
      .filter((m) => m.volume > 0)
      .sort((a, b) => b.volume - a.volume);
  }, [workouts, displayUnit, activeUser?.weightUnit]);

  const totalSets = workouts.reduce(
    (acc, w) => acc + w.exercises.reduce((sAcc, ex) => sAcc + ex.sets.length, 0),
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with KG / LBS Unit Switcher */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.title}>Metrics & Analytics</Text>
              <Text style={styles.subtitle}>Performance overview & tools</Text>
            </View>
            <View style={styles.unitToggleGroup}>
              <TouchableOpacity
                style={[styles.unitToggleBtn, displayUnit === 'kg' && styles.unitToggleBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDisplayUnit('kg');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.unitToggleText, displayUnit === 'kg' && styles.unitToggleTextActive]}>
                  KG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitToggleBtn, displayUnit === 'lbs' && styles.unitToggleBtnActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDisplayUnit('lbs');
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.unitToggleText, displayUnit === 'lbs' && styles.unitToggleTextActive]}>
                  LBS
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Global Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LIFETIME VOL</Text>
            <Text style={[styles.statVal, { color: colors.accent }]}>
              {totalVolumeFormatted}k <Text style={styles.statUnit}>{displayUnit.toUpperCase()}</Text>
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

        {/* Weight Converter Tool (KG ⇄ LBS) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithAction}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="swap-horizontal-bold" size={18} color={colors.accent} />
              <Text style={styles.cardHeaderTitle}>WEIGHT CONVERTER (KG ⇄ LBS)</Text>
            </View>
          </View>

          {/* Interactive Bidirectional Inputs with Swap Button */}
          <View style={styles.converterInputsRow}>
            {converterDirection === 'kg_to_lbs' ? (
              <>
                {/* KG Field */}
                <View style={styles.converterInputCol}>
                  <Text style={styles.inputLabel}>KILOGRAMS (KG)</Text>
                  <View style={styles.converterInputWrap}>
                    <TextInput
                      style={styles.converterInput}
                      keyboardType="decimal-pad"
                      value={converterKg}
                      onChangeText={handleUpdateConverterKg}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={styles.converterInputSuffix}>KG</Text>
                  </View>
                </View>

                {/* Swap Button */}
                <TouchableOpacity
                  style={styles.converterSwapButton}
                  onPress={handleSwapConverter}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.accent} />
                </TouchableOpacity>

                {/* LBS Field */}
                <View style={styles.converterInputCol}>
                  <Text style={styles.inputLabel}>POUNDS (LBS)</Text>
                  <View style={styles.converterInputWrap}>
                    <TextInput
                      style={styles.converterInput}
                      keyboardType="decimal-pad"
                      value={converterLbs}
                      onChangeText={handleUpdateConverterLbs}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={styles.converterInputSuffix}>LBS</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* LBS Field */}
                <View style={styles.converterInputCol}>
                  <Text style={styles.inputLabel}>POUNDS (LBS)</Text>
                  <View style={styles.converterInputWrap}>
                    <TextInput
                      style={styles.converterInput}
                      keyboardType="decimal-pad"
                      value={converterLbs}
                      onChangeText={handleUpdateConverterLbs}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={styles.converterInputSuffix}>LBS</Text>
                  </View>
                </View>

                {/* Swap Button */}
                <TouchableOpacity
                  style={styles.converterSwapButton}
                  onPress={handleSwapConverter}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.accent} />
                </TouchableOpacity>

                {/* KG Field */}
                <View style={styles.converterInputCol}>
                  <Text style={styles.inputLabel}>KILOGRAMS (KG)</Text>
                  <View style={styles.converterInputWrap}>
                    <TextInput
                      style={styles.converterInput}
                      keyboardType="decimal-pad"
                      value={converterKg}
                      onChangeText={handleUpdateConverterKg}
                      placeholder="0"
                      placeholderTextColor={colors.textDim}
                    />
                    <Text style={styles.converterInputSuffix}>KG</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Quick Presets / Gym Benchmarks */}
          <View style={{ gap: 6 }}>
            <Text style={styles.inputLabel}>QUICK GYM BENCHMARKS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
              {converterDirection === 'kg_to_lbs'
                ? [
                    { label: 'Olympic Bar (20 kg / 44.1 lbs)', val: 20, unit: 'kg' as const },
                    { label: '1 Plate (60 kg / 132.3 lbs)', val: 60, unit: 'kg' as const },
                    { label: '2 Plates (100 kg / 220.5 lbs)', val: 100, unit: 'kg' as const },
                    { label: '3 Plates (140 kg / 308.6 lbs)', val: 140, unit: 'kg' as const },
                    { label: '4 Plates (180 kg / 396.8 lbs)', val: 180, unit: 'kg' as const },
                    { label: '5 Plates (220 kg / 485.0 lbs)', val: 220, unit: 'kg' as const },
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.label}
                      style={styles.presetChip}
                      onPress={() => handleSelectConverterPreset(p.val, p.unit)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.presetChipText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))
                : [
                    { label: 'Olympic Bar (45 lbs / 20.4 kg)', val: 45, unit: 'lbs' as const },
                    { label: '1 Plate (135 lbs / 61.2 kg)', val: 135, unit: 'lbs' as const },
                    { label: '2 Plates (225 lbs / 102.1 kg)', val: 225, unit: 'lbs' as const },
                    { label: '3 Plates (315 lbs / 142.9 kg)', val: 315, unit: 'lbs' as const },
                    { label: '4 Plates (405 lbs / 183.7 kg)', val: 405, unit: 'lbs' as const },
                    { label: '5 Plates (495 lbs / 224.5 kg)', val: 495, unit: 'lbs' as const },
                  ].map((p) => (
                    <TouchableOpacity
                      key={p.label}
                      style={styles.presetChip}
                      onPress={() => handleSelectConverterPreset(p.val, p.unit)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.presetChipText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        </View>

        {/* 1RM Calculator (Defaults to 0) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithAction}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="calculator-variant" size={18} color={colors.accent} />
              <Text style={styles.cardHeaderTitle}>ONE-REP MAX ESTIMATOR (EPLEY)</Text>
            </View>
            <TouchableOpacity
              style={styles.unitPillSmall}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDisplayUnit((u) => (u === 'kg' ? 'lbs' : 'kg'));
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.unitPillSmallText}>{displayUnit.toUpperCase()}</Text>
                <MaterialCommunityIcons name="swap-horizontal" size={12} color={colors.accent} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.calcInputsRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.inputLabel}>LIFTED WEIGHT ({displayUnit.toUpperCase()})</Text>
              <TextInput
                style={styles.calcInput}
                keyboardType="decimal-pad"
                value={calcWeight}
                onChangeText={(txt) => {
                  const clean = txt.replace(/[^0-9.]/g, '');
                  const parts = clean.split('.');
                  const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
                  setCalcWeight(sanitized);
                }}
                placeholder="0"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.inputLabel}>REPS PERFORMED</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCalcReps((r) => Math.max(0, r - 1))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.repsDisplay}>{calcReps}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setCalcReps((r) => Math.min(30, r + 1))}
                  activeOpacity={0.7}
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
                {estimated1RM} <Text style={styles.resultUnit}>{displayUnit.toUpperCase()}</Text>
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
                  {estimated1RM > 0 ? Math.round(estimated1RM * (pct / 100)) : 0} {displayUnit.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Volume Distribution by Muscle Group */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="chart-donut" size={18} color={colors.accent} />
            <Text style={styles.cardHeaderTitle}>VOLUME BY MUSCLE GROUP ({displayUnit.toUpperCase()})</Text>
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
                      {m.percentage}% ({m.volume.toLocaleString()} {displayUnit.toUpperCase()})
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

        {/* Personal Records Showcase */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.flame} />
            <Text style={styles.cardHeaderTitle}>ALL-TIME PERSONAL RECORDS ({displayUnit.toUpperCase()})</Text>
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
              {personalRecords.map((pr) => {
                const userDefaultUnit: WeightUnit = activeUser?.weightUnit || 'kg';
                const convertedMax = Math.round(convertWeight(pr.maxWeight, userDefaultUnit, displayUnit) * 10) / 10;
                const converted1RM = Math.round(convertWeight(pr.estimatedOneRepMax, userDefaultUnit, displayUnit) * 10) / 10;
                return (
                  <View key={pr.exerciseId} style={styles.prCard}>
                    <View style={styles.prHeader}>
                      <Text style={styles.prExerciseName}>{pr.exerciseName}</Text>
                      <Text style={styles.prDate}>{pr.date}</Text>
                    </View>
                    <View style={styles.prBottom}>
                      <Text style={styles.prWeightText}>
                        {convertedMax} {displayUnit.toUpperCase()}
                      </Text>
                      <Text style={styles.prRepsText}>× {pr.repsAtMax} reps</Text>
                      <View style={{ flex: 1 }} />
                      <View style={styles.pr1rmBadge}>
                        <Text style={styles.pr1rmText}>Est. 1RM: {converted1RM} {displayUnit.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
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
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    unitToggleGroup: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 10,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    unitToggleBtn: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 7,
    },
    unitToggleBtnActive: {
      backgroundColor: colors.accent,
    },
    unitToggleText: {
      fontSize: 10,
      fontWeight: '800',
      fontFamily: 'monospace',
      color: colors.textMuted,
    },
    unitToggleTextActive: {
      color: colors.accentContrastText,
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
    cardHeaderWithAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    unitPillSmall: {
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    unitPillSmallText: {
      fontSize: 9,
      fontWeight: '900',
      fontFamily: 'monospace',
      color: colors.accent,
    },
    converterBadge: {
      backgroundColor: colors.accentSubtle,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    converterBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      fontFamily: 'monospace',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    converterInputsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    converterInputCol: {
      flex: 1,
      gap: 6,
    },
    converterInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderColor: colors.surfaceBorder,
      borderWidth: 1,
      borderRadius: 12,
      height: 48,
      paddingHorizontal: 12,
    },
    converterInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 18,
      fontFamily: 'monospace',
      fontWeight: '900',
      padding: 0,
    },
    converterInputSuffix: {
      fontSize: 11,
      fontWeight: '900',
      fontFamily: 'monospace',
      color: colors.accent,
      marginLeft: 6,
    },
    converterSwapButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    presetScroll: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    presetChip: {
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    presetChipText: {
      fontSize: 10,
      fontWeight: '800',
      fontFamily: 'monospace',
      color: colors.textSecondary,
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
