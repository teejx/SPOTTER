import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { calculateOneRepMax } from '../lib/storage';
import { WeightUnit } from '../types';
import {
  ClayVolumeProgressionChart,
  ClayMuscleDistributionRadar,
  ClayStepTelemetryDial,
} from '../components/ClayCharts';

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

  // Walking summary
  const totalSteps = walkingLogs.reduce((acc, w) => acc + (w.steps || 0), 0);
  const totalWalkKm = walkingLogs.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
  const totalWalkCalories = walkingLogs.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

  // 1RM Calculator Interactive State
  const [calcWeight, setCalcWeight] = useState('100');
  const [calcReps, setCalcReps] = useState(5);

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
    setConverterKg(clean);
    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed > 0) {
      setConverterLbs((parsed * KG_TO_LBS).toFixed(1));
    } else {
      setConverterLbs('0');
    }
  };

  const handleUpdateConverterLbs = (txt: string) => {
    const clean = txt.replace(/[^0-9.]/g, '');
    setConverterLbs(clean);
    const parsed = parseFloat(clean);
    if (!isNaN(parsed) && parsed > 0) {
      setConverterKg((parsed * LBS_TO_KG).toFixed(1));
    } else {
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

  // Volume progression mock data based on actual workouts or realistic progression
  const volumeProgressionData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mockValues = [12400, 18500, 0, 16800, 21200, 8900, 0];
    return days.map((day, i) => ({
      day,
      volume: mockValues[i] || 0,
      label: `${day} Training Session`,
      isPeak: i === 4,
    }));
  }, []);

  // Muscle groups data
  const muscleGroupsData = useMemo(() => {
    const groups: {
      name: string;
      volume: number;
      percent: number;
      status: 'OPTIMAL' | 'RECOVERING' | 'FRESH';
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
    }[] = [
      { name: 'Chest', volume: 28400, percent: 28, status: 'OPTIMAL', icon: 'shield-outline' },
      { name: 'Back', volume: 24200, percent: 24, status: 'OPTIMAL', icon: 'human-handsdown' },
      { name: 'Legs (Quads & Hams)', volume: 21500, percent: 21, status: 'RECOVERING', icon: 'run' },
      { name: 'Shoulders (Delts)', volume: 14800, percent: 15, status: 'FRESH', icon: 'arm-flex' },
      { name: 'Arms (Bi & Tri)', volume: 11900, percent: 12, status: 'FRESH', icon: 'dumbbell' },
    ];
    return groups;
  }, []);

  // Weekly steps mock / real data
  const weeklyStepsData = useMemo(() => {
    return [8420, 10250, 7890, 11400, 9200, 12600, 8400];
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Title and KG / LBS Unit Switcher */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>ANALYTICS & TELEMETRY</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Performance Hub
            </Text>
          </View>

          {/* Unit Toggle Pill */}
          <View style={[styles.unitTogglePill, isDark ? styles.unitPillDark : styles.unitPillLight]}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                displayUnit === 'kg' && (isDark ? styles.unitBtnActiveDark : styles.unitBtnActiveLight),
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDisplayUnit('kg');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  displayUnit === 'kg' && { color: colors.accent, fontWeight: '900' },
                ]}
              >
                KG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unitBtn,
                displayUnit === 'lbs' && (isDark ? styles.unitBtnActiveDark : styles.unitBtnActiveLight),
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDisplayUnit('lbs');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.unitBtnText,
                  displayUnit === 'lbs' && { color: colors.accent, fontWeight: '900' },
                ]}
              >
                LBS
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4 Clay Bento Lifetime Stats Tiles */}
        <View style={styles.bentoGrid}>
          {/* Tile 1: Lifetime Volume */}
          <View style={[styles.bentoTile, isDark ? styles.bentoTileDark : styles.bentoTileLight]}>
            <View style={styles.bentoTop}>
              <MaterialCommunityIcons name="weight-kilogram" size={18} color={colors.accent} />
              <Text style={styles.bentoLabel}>TOTAL TONNAGE</Text>
            </View>
            <Text style={[styles.bentoNumber, { color: colors.textPrimary }]}>
              {totalVolumeFormatted}k
            </Text>
            <Text style={styles.bentoSub}>{displayUnit.toUpperCase()} LIFTED</Text>
          </View>

          {/* Tile 2: Sessions */}
          <View style={[styles.bentoTile, isDark ? styles.bentoTileDark : styles.bentoTileLight]}>
            <View style={styles.bentoTop}>
              <MaterialCommunityIcons name="calendar-check" size={18} color="#38BDF8" />
              <Text style={styles.bentoLabel}>SESSIONS</Text>
            </View>
            <Text style={[styles.bentoNumber, { color: colors.textPrimary }]}>
              {workouts.length}
            </Text>
            <Text style={styles.bentoSub}>LOGGED</Text>
          </View>

          {/* Tile 3: Personal Records */}
          <View style={[styles.bentoTile, isDark ? styles.bentoTileDark : styles.bentoTileLight]}>
            <View style={styles.bentoTop}>
              <MaterialCommunityIcons name="trophy" size={18} color="#F59E0B" />
              <Text style={styles.bentoLabel}>PRS BROKEN</Text>
            </View>
            <Text style={[styles.bentoNumber, { color: '#F59E0B' }]}>
              {personalRecords.length}
            </Text>
            <Text style={styles.bentoSub}>MILESTONES</Text>
          </View>

          {/* Tile 4: Movement Distance */}
          <View style={[styles.bentoTile, isDark ? styles.bentoTileDark : styles.bentoTileLight]}>
            <View style={styles.bentoTop}>
              <MaterialCommunityIcons name="fire" size={18} color="#EF4444" />
              <Text style={styles.bentoLabel}>ENERGY BURNT</Text>
            </View>
            <Text style={[styles.bentoNumber, { color: '#EF4444' }]}>
              {totalWalkCalories}
            </Text>
            <Text style={styles.bentoSub}>KCAL</Text>
          </View>
        </View>

        {/* 1. Volume Progression Interactive Column Chart */}
        <ClayVolumeProgressionChart
          colors={colors}
          isDark={isDark}
          unit={displayUnit}
          data={volumeProgressionData}
          totalVolumeFormatted={totalVolumeFormatted}
          deltaPercent={14.2}
        />

        {/* 2. Hypertrophy Muscle Group Balancing Radar */}
        <ClayMuscleDistributionRadar
          colors={colors}
          isDark={isDark}
          unit={displayUnit}
          groups={muscleGroupsData}
        />

        {/* 3. Daily Movement & Step Telemetry Dial */}
        <ClayStepTelemetryDial
          colors={colors}
          isDark={isDark}
          totalSteps={totalSteps || 8420}
          totalKm={totalWalkKm || 5.8}
          totalKcal={totalWalkCalories || 380}
          dailyGoal={10000}
          weeklySteps={weeklyStepsData}
        />

        {/* 4. Clay 1RM Strength Estimator */}
        <View style={[styles.toolCard, isDark ? styles.toolCardDark : styles.toolCardLight]}>
          <View style={styles.toolHeader}>
            <View>
              <Text style={styles.toolEyebrow}>STRENGTH BIOMECHANICS</Text>
              <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
                One Rep Max Estimator (1RM)
              </Text>
            </View>
            <MaterialCommunityIcons name="arm-flex" size={22} color={colors.accent} />
          </View>

          <View style={styles.calcInputsRow}>
            {/* Weight Input */}
            <View style={{ flex: 1 }}>
              <Text style={styles.calcInputLabel}>WEIGHT ({displayUnit.toUpperCase()})</Text>
              <View style={[styles.calcInputBox, isDark ? styles.inputDark : styles.inputLight]}>
                <TextInput
                  style={[styles.calcTextInput, { color: colors.textPrimary }]}
                  keyboardType="decimal-pad"
                  value={calcWeight}
                  onChangeText={setCalcWeight}
                  placeholder="100"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            {/* Reps Input with Stepper */}
            <View style={{ flex: 1 }}>
              <Text style={styles.calcInputLabel}>REPS PERFORMED</Text>
              <View style={[styles.repsStepperBox, isDark ? styles.inputDark : styles.inputLight]}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    setCalcReps((r) => Math.max(1, r - 1));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={[styles.stepperVal, { color: colors.textPrimary }]}>
                  {calcReps}
                </Text>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    setCalcReps((r) => Math.min(30, r + 1));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 1RM Result Banner */}
          <View style={[styles.resultBanner, isDark ? styles.resultBannerDark : styles.resultBannerLight]}>
            <Text style={styles.resultLabel}>ESTIMATED 1RM</Text>
            <View style={styles.resultValueWrap}>
              <Text style={[styles.resultBigNumber, { color: colors.accent }]}>
                {estimated1RM > 0 ? estimated1RM : '—'}
              </Text>
              <Text style={styles.resultUnit}>{displayUnit.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* 5. Clay Weight Converter Tool */}
        <View style={[styles.toolCard, isDark ? styles.toolCardDark : styles.toolCardLight]}>
          <View style={styles.toolHeader}>
            <View>
              <Text style={styles.toolEyebrow}>QUICK TOOLKIT</Text>
              <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
                Barbell Unit Converter (KG ⇄ LBS)
              </Text>
            </View>
            <MaterialCommunityIcons name="swap-horizontal-bold" size={22} color="#F59E0B" />
          </View>

          <View style={styles.converterInputsRow}>
            {converterDirection === 'kg_to_lbs' ? (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calcInputLabel}>KILOGRAMS</Text>
                  <View style={[styles.calcInputBox, isDark ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.calcTextInput, { color: colors.textPrimary }]}
                      keyboardType="decimal-pad"
                      value={converterKg}
                      onChangeText={handleUpdateConverterKg}
                    />
                    <Text style={styles.suffixText}>KG</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.swapBtn, isDark ? styles.swapBtnDark : styles.swapBtnLight]}
                  onPress={handleSwapConverter}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.accent} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={styles.calcInputLabel}>POUNDS</Text>
                  <View style={[styles.calcInputBox, isDark ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.calcTextInput, { color: colors.textPrimary }]}
                      keyboardType="decimal-pad"
                      value={converterLbs}
                      onChangeText={handleUpdateConverterLbs}
                    />
                    <Text style={styles.suffixText}>LBS</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={{ flex: 1 }}>
                  <Text style={styles.calcInputLabel}>POUNDS</Text>
                  <View style={[styles.calcInputBox, isDark ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.calcTextInput, { color: colors.textPrimary }]}
                      keyboardType="decimal-pad"
                      value={converterLbs}
                      onChangeText={handleUpdateConverterLbs}
                    />
                    <Text style={styles.suffixText}>LBS</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.swapBtn, isDark ? styles.swapBtnDark : styles.swapBtnLight]}
                  onPress={handleSwapConverter}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={colors.accent} />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={styles.calcInputLabel}>KILOGRAMS</Text>
                  <View style={[styles.calcInputBox, isDark ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.calcTextInput, { color: colors.textPrimary }]}
                      keyboardType="decimal-pad"
                      value={converterKg}
                      onChangeText={handleUpdateConverterKg}
                    />
                    <Text style={styles.suffixText}>KG</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Quick Preset Pills */}
          <View style={styles.presetsRow}>
            {[60, 80, 100, 140].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.presetPill, isDark ? styles.presetPillDark : styles.presetPillLight]}
                onPress={() => handleSelectConverterPreset(val, 'kg')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetText}>{val} kg</Text>
              </TouchableOpacity>
            ))}
          </View>
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
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    headerLeft: {
      flex: 1,
    },
    eyebrow: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.4,
      color: colors.accent,
      marginBottom: 3,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    unitTogglePill: {
      flexDirection: 'row',
      borderRadius: 16,
      padding: 3,
      borderWidth: 1.5,
    },
    unitPillDark: {
      backgroundColor: '#14161F',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    unitPillLight: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    unitBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    unitBtnActiveDark: {
      backgroundColor: '#202434',
    },
    unitBtnActiveLight: {
      backgroundColor: '#F1F5F9',
    },
    unitBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textDim,
    },
    bentoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    bentoTile: {
      width: '48.4%',
      borderRadius: 22,
      padding: 14,
      borderWidth: 1.5,
    },
    bentoTileDark: {
      backgroundColor: '#151722',
      borderColor: 'rgba(255, 255, 255, 0.10)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    bentoTileLight: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#475569',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
    },
    bentoTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    bentoLabel: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textDim,
    },
    bentoNumber: {
      fontSize: 24,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      letterSpacing: -0.5,
    },
    bentoSub: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.textDim,
      marginTop: 2,
    },
    toolCard: {
      borderRadius: 28,
      borderWidth: 1.5,
      padding: 18,
      marginBottom: 16,
    },
    toolCardDark: {
      backgroundColor: '#151722',
      borderColor: 'rgba(255, 255, 255, 0.10)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 6,
    },
    toolCardLight: {
      backgroundColor: '#FFFFFF',
      borderColor: 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#475569',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 4,
    },
    toolHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    toolEyebrow: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.4,
      color: colors.accent,
      marginBottom: 2,
    },
    toolTitle: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    calcInputsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    calcInputLabel: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
      color: colors.textDim,
      marginBottom: 6,
    },
    calcInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      borderWidth: 1.5,
      paddingHorizontal: 12,
      height: 44,
    },
    inputDark: {
      backgroundColor: '#0F1118',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    inputLight: {
      backgroundColor: '#F8FAFC',
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    calcTextInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    repsStepperBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      borderWidth: 1.5,
      paddingHorizontal: 8,
      height: 44,
    },
    stepperBtn: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    stepperVal: {
      fontSize: 15,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    resultBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
    },
    resultBannerDark: {
      backgroundColor: '#1E172E',
      borderColor: 'rgba(192, 132, 252, 0.35)',
    },
    resultBannerLight: {
      backgroundColor: '#F5F3FF',
      borderColor: 'rgba(124, 58, 237, 0.25)',
    },
    resultLabel: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1,
      color: '#A855F7',
    },
    resultValueWrap: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    resultBigNumber: {
      fontSize: 24,
      fontWeight: '900',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    resultUnit: {
      fontSize: 12,
      fontWeight: '900',
      color: '#A855F7',
    },
    converterInputsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    swapBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      borderWidth: 1.5,
    },
    swapBtnDark: {
      backgroundColor: '#1C1F2B',
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    swapBtnLight: {
      backgroundColor: '#F1F5F9',
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    suffixText: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.textDim,
    },
    presetsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    presetPill: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
    },
    presetPillDark: {
      backgroundColor: '#0F1118',
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    presetPillLight: {
      backgroundColor: '#F8FAFC',
      borderColor: 'rgba(0, 0, 0, 0.06)',
    },
    presetText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textDim,
    },
  });
