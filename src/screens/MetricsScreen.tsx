import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { MetricsScreenSkeleton } from '../components/ClaySkeleton';
import { ClayPressable, AnimatedEntrance } from '../components/ClayMotion';
import { useScreenLoading } from '../hooks/useScreenLoading';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';
import { useFitness } from '../context/FitnessContext';
import { calculateOneRepMax } from '../lib/storage';
import { WeightUnit } from '../types';
import {
  ClayVolumeProgressionChart,
  ClayMuscleDistributionRadar,
} from '../components/ClayCharts';
import {
  CircularProgressRing,
  EqualizerRhythmBars,
} from '../components/AnimatedProgressRing';
import { BottomSheetModal } from '../components/BottomSheetModal';
import { useScreenBottomPadding } from '../hooks/useScreenBottomPadding';
import {
  filterRecordsByDate,
  getTimeframeDescriptor,
  DateFilterType,
} from '../utils/dateFilters';
import { RefreshControl } from 'react-native';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

const convertWeight = (val: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return val;
  if (from === 'kg' && to === 'lbs') return val * KG_TO_LBS;
  return val * LBS_TO_KG;
};

export const MetricsScreen: React.FC = () => {
  const { workouts, personalRecords, activeUser, walkingLogs, colors, isDark, updateDailyStepGoal, isLoading } = useFitness();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const bottomPadding = useScreenBottomPadding(32);
  const [isGoalSheetVisible, setIsGoalSheetVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Active display unit toggle across metrics (KG vs LBS)
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(activeUser?.weightUnit || 'kg');

  // Timeframe filter state: Action-Driven Flow & Contextual Simplicity
  const [activeTimeframe, setActiveTimeframe] = useState<DateFilterType>('today');
  const descriptor = useMemo(() => getTimeframeDescriptor(activeTimeframe), [activeTimeframe]);

  // Interactive selected day in Weekly Activity Histogram
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Dynamically filtered workouts and walks according to activeTimeframe (local timezone safe)
  const filteredWorkouts = useMemo(
    () => filterRecordsByDate(workouts, activeTimeframe),
    [workouts, activeTimeframe]
  );

  const filteredWalks = useMemo(
    () => filterRecordsByDate(walkingLogs, activeTimeframe),
    [walkingLogs, activeTimeframe]
  );

  const displaySteps = useMemo(() => filteredWalks.reduce((acc, w) => acc + (w.steps || 0), 0), [filteredWalks]);
  const displayKm = useMemo(() => filteredWalks.reduce((acc, w) => acc + (w.distanceKm || 0), 0), [filteredWalks]);
  const displayWalkKcal = useMemo(() => filteredWalks.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0), [filteredWalks]);
  const displayWorkoutKcal = useMemo(() => filteredWorkouts.reduce((acc, w) => acc + Math.round((w.durationMinutes || 0) * 6), 0), [filteredWorkouts]);
  const displayKcal = displayWalkKcal + displayWorkoutKcal;

  const dailyStepGoal = activeUser?.dailyStepGoal || 10000;
  const effectiveStepGoal = useMemo(() => {
    if (activeTimeframe === 'week') return dailyStepGoal * 7;
    if (activeTimeframe === 'month') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return dailyStepGoal * daysInMonth;
    }
    if (activeTimeframe === 'all') {
      const loggedDays = new Set(walkingLogs.map((w) => (w.date ? w.date.split('T')[0] : ''))).size;
      return dailyStepGoal * Math.max(1, loggedDays);
    }
    return dailyStepGoal;
  }, [dailyStepGoal, activeTimeframe, walkingLogs]);

  const rawStepRatio = displaySteps / Math.max(1, effectiveStepGoal);
  const stepProgress = Math.min(rawStepRatio, 1);
  const stepPercentage = Math.round(rawStepRatio * 100);

  // Volume in selected displayUnit for the active timeframe
  const totalVolumeInDisplayUnit = useMemo(() => {
    const rawVolume = filteredWorkouts.reduce((acc, w) => {
      const wUnit = w.weightUnit || activeUser?.weightUnit || 'kg';
      const vol = w.totalVolume || 0;
      return acc + convertWeight(vol, wUnit, displayUnit);
    }, 0);
    return rawVolume;
  }, [filteredWorkouts, displayUnit, activeUser?.weightUnit]);

  const totalVolumeFormatted = (totalVolumeInDisplayUnit / 1000).toFixed(1);

  // Real Active Training Duration from logged workouts for active timeframe
  const totalWorkoutMinutes = useMemo(() => {
    return filteredWorkouts.reduce((acc, w) => acc + (w.durationMinutes || 0), 0);
  }, [filteredWorkouts]);

  const activeTrainingTimeFormatted = useMemo(() => {
    if (totalWorkoutMinutes <= 0) return '0 Mins';
    const hours = (totalWorkoutMinutes / 60).toFixed(1);
    if (parseFloat(hours) >= 1.0) {
      return `${hours} Hours`;
    }
    return `${totalWorkoutMinutes} Mins`;
  }, [totalWorkoutMinutes]);

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

  // Real Weekly Activity Data (Monday - Sunday of current week, no mock data)
  const weeklyActivityData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);

    const dayMeta = [
      { day: 'M', dayFull: 'Monday' },
      { day: 'T', dayFull: 'Tuesday' },
      { day: 'W', dayFull: 'Wednesday' },
      { day: 'T', dayFull: 'Thursday' },
      { day: 'F', dayFull: 'Friday' },
      { day: 'S', dayFull: 'Saturday' },
      { day: 'S', dayFull: 'Sunday' },
    ];

    const result = dayMeta.map((meta, i) => {
      const targetDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const datePrefix = `${year}-${month}-${day}`;

      const dayWalks = walkingLogs.filter((w) => w.date.startsWith(datePrefix));
      const steps = dayWalks.reduce((sum, w) => sum + (w.steps || 0), 0);

      const dayWorkouts = workouts.filter((w) => w.date.startsWith(datePrefix));
      const volume = dayWorkouts.reduce((sum, w) => {
        let v = w.totalVolume || 0;
        const wUnit = w.weightUnit || 'kg';
        if (wUnit === 'lbs' && displayUnit === 'kg') v /= 2.20462;
        else if (wUnit === 'kg' && displayUnit === 'lbs') v *= 2.20462;
        return sum + v;
      }, 0);

      return {
        day: meta.day,
        dayFull: meta.dayFull,
        steps,
        volume: Math.round(volume),
        isPeak: false,
      };
    });

    const maxActivity = Math.max(...result.map((d) => d.steps + d.volume), 0);
    if (maxActivity > 0) {
      const peak = result.find((d) => d.steps + d.volume === maxActivity);
      if (peak) peak.isPeak = true;
    }

    return result;
  }, [walkingLogs, workouts, displayUnit]);

  const peakDay = useMemo(() => weeklyActivityData.find((d) => d.isPeak), [weeklyActivityData]);

  const selectedDay = weeklyActivityData[selectedDayIdx] || weeklyActivityData[0];

  // Real Volume progression data for the 7 days of the current week (no mock data)
  const volumeProgressionData = useMemo(() => {
    return weeklyActivityData.map((d) => ({
      day: d.dayFull.slice(0, 3),
      volume: d.volume,
      label: `${d.dayFull} Volume`,
      isPeak: d.isPeak,
    }));
  }, [weeklyActivityData]);

  // Real Muscle groups data aggregated from user workouts (no mock data)
  const muscleGroupsData = useMemo(() => {
    const categories: Record<string, { volume: number; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
      Chest: { volume: 0, icon: 'shield-outline' },
      Back: { volume: 0, icon: 'human-handsdown' },
      Legs: { volume: 0, icon: 'run' },
      Shoulders: { volume: 0, icon: 'arm-flex' },
      Arms: { volume: 0, icon: 'dumbbell' },
    };

    workouts.forEach((w) => {
      const wUnit = w.weightUnit || 'kg';
      (w.exercises || []).forEach((ex) => {
        let cat = (ex.category as string) || 'Chest';
        const nameLower = (ex.exerciseName || '').toLowerCase();
        if (
          nameLower.includes('squat') ||
          nameLower.includes('leg') ||
          nameLower.includes('deadlift') ||
          nameLower.includes('calf') ||
          nameLower.includes('lunge')
        ) {
          cat = 'Legs';
        } else if (
          nameLower.includes('pull') ||
          nameLower.includes('row') ||
          nameLower.includes('lat') ||
          nameLower.includes('chin')
        ) {
          cat = 'Back';
        } else if (
          (nameLower.includes('press') &&
            (nameLower.includes('shoulder') ||
              nameLower.includes('overhead') ||
              nameLower.includes('military'))) ||
          nameLower.includes('lateral') ||
          nameLower.includes('rear delt')
        ) {
          cat = 'Shoulders';
        } else if (
          nameLower.includes('curl') ||
          nameLower.includes('tricep') ||
          nameLower.includes('dip') ||
          nameLower.includes('extension')
        ) {
          cat = 'Arms';
        } else if (
          nameLower.includes('press') ||
          nameLower.includes('chest') ||
          nameLower.includes('fly') ||
          nameLower.includes('push')
        ) {
          cat = 'Chest';
        }

        const exVol = (ex.sets || []).reduce((sAcc, s) => {
          let wVal = s.weight || 0;
          if (wUnit === 'lbs' && displayUnit === 'kg') wVal /= 2.20462;
          else if (wUnit === 'kg' && displayUnit === 'lbs') wVal *= 2.20462;
          return sAcc + wVal * (s.reps || 0);
        }, 0);

        if (categories[cat]) {
          categories[cat].volume += exVol;
        }
      });
    });

    const totalLoad = Object.values(categories).reduce((acc, c) => acc + c.volume, 0);

    return Object.entries(categories).map(([name, data]) => {
      const percent = totalLoad > 0 ? Math.round((data.volume / totalLoad) * 100) : 0;
      let status: 'OPTIMAL' | 'RECOVERING' | 'FRESH' = 'FRESH';
      if (percent >= 25) status = 'OPTIMAL';
      else if (percent > 0) status = 'RECOVERING';

      return {
        name,
        volume: Math.round(data.volume),
        percent,
        status,
        icon: data.icon,
      };
    });
  }, [workouts, displayUnit]);

  const currentDateString = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  const { showSkeleton, contentOpacity } = useScreenLoading({ isLoading: isLoading || !activeUser });

  if (showSkeleton) {
    return <MetricsScreenSkeleton />;
  }

  return (
    <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
      <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header: Approachable Greeting + Athlete Avatar + Date Pill */}
        <View style={styles.headerRow}>
          <View style={styles.greetingLeft}>
            {activeUser?.avatarUrl ? (
              <Image source={{ uri: activeUser.avatarUrl }} style={styles.athleteAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={24} color={colors.accent} />
              </View>
            )}
            <View>
              <Text style={styles.greetingName}>
                Good day, {activeUser?.name || 'Athlete'}
              </Text>
              <Text style={styles.greetingSub}>
                Track your daily activity & stay healthy
              </Text>
            </View>
          </View>

          {/* Unit Toggle Pill */}
          <View style={styles.unitTogglePill}>
            <TouchableOpacity
              style={[styles.unitBtn, displayUnit === 'kg' && styles.unitBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDisplayUnit('kg');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitBtnText, displayUnit === 'kg' && styles.unitBtnTextActive]}>
                KG
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.unitBtn, displayUnit === 'lbs' && styles.unitBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDisplayUnit('lbs');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitBtnText, displayUnit === 'lbs' && styles.unitBtnTextActive]}>
                LBS
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Contextual Timeframe Filter Pills with ClayPressable */}
        <View style={styles.timeframeRow}>
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Weekly' },
            { key: 'month', label: 'Monthly' },
            { key: 'all', label: 'All Time' },
          ].map((tab) => {
            const isActive = activeTimeframe === tab.key;
            return (
              <ClayPressable
                key={tab.key}
                variant="chip"
                style={[styles.timeframeChip, isActive && styles.timeframeChipActive]}
                onPress={() => {
                  setActiveTimeframe(tab.key as any);
                }}
              >
                <Text
                  style={[
                    styles.timeframeChipText,
                    isActive && styles.timeframeChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </ClayPressable>
            );
          })}
        </View>

        {/* 3. Hero Bento Section 1: Full-Width Walk Progress Ring Tile */}
        <View style={styles.heroRow}>
          {/* Main Hero Tile: Royal Indigo Walk Tile with Animated Circular Progress Ring */}
          <ClayPressable
            variant="card"
            style={styles.heroWalkCard}
            onPress={() => {}}
            haptic="medium"
          >
            <View style={styles.heroWalkHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.heroWalkIconCircle}>
                  <MaterialCommunityIcons name="shoe-print" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.heroWalkTitle}>{descriptor.walkTitle}</Text>
              </View>
              <View style={styles.heroWalkGoalPill}>
                <Text style={styles.heroWalkGoalText}>
                  {stepPercentage}% of goal
                </Text>
              </View>
            </View>

            {/* Dynamic Animated Circular Progress Ring */}
            <View style={styles.ringCenterContainer}>
              <CircularProgressRing
                size={140}
                strokeWidth={11}
                progress={stepProgress}
                color="#FFFFFF"
                trackColor="rgba(255, 255, 255, 0.22)"
                showIndicatorDot={true}
              >
                <Text style={styles.ringStepsNumber}>
                  {displaySteps.toLocaleString()}
                </Text>
                <Text style={styles.ringStepsGoalText}>
                  of {effectiveStepGoal.toLocaleString()}
                </Text>
                <Text style={styles.ringStepsSubtitle}>{descriptor.stepsLabel}</Text>
              </CircularProgressRing>
            </View>

            {/* Bottom Mini Metrics */}
            <View style={styles.heroWalkFooter}>
              <View style={styles.heroWalkStat}>
                <MaterialCommunityIcons name="map-marker-distance" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroWalkStatText}>{displayKm.toFixed(1)} km</Text>
              </View>
              <View style={styles.heroWalkStat}>
                <MaterialCommunityIcons name="fire" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroWalkStatText}>{displayKcal} Kcal</Text>
              </View>
              <TouchableOpacity
                style={[styles.heroWalkStat, styles.heroWalkStatInteractive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsGoalSheetVisible(true);
                }}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="target" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroWalkStatText}>{dailyStepGoal.toLocaleString()} Goal</Text>
                <MaterialCommunityIcons name="pencil" size={10} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>
          </ClayPressable>
        </View>

        {/* 4. Hero Bento Section 2: Workouts, Exercise Time & Calories Tiles */}
        <AnimatedEntrance index={1} direction="up">
        <View style={styles.bentoGrid}>
          {/* Workouts / Strength Volume Card */}
          <ClayPressable
            variant="tile"
            style={styles.bentoTile}
            onPress={() => {}}
          >
            <View style={styles.bentoTileHeader}>
              <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(99, 85, 230, 0.12)' }]}>
                <MaterialCommunityIcons name="dumbbell" size={18} color={colors.accent} />
              </View>
              <Text style={styles.bentoTileCategory}>Strength</Text>
            </View>
            <Text style={styles.bentoTileValue}>{totalVolumeFormatted}k {displayUnit.toUpperCase()}</Text>
            <Text style={styles.bentoTileSub}>
              {filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''} logged
            </Text>
          </ClayPressable>

          {/* Active Exercise Duration Card (with animated Equalizer bars) */}
          <ClayPressable
            variant="tile"
            style={styles.bentoTile}
            onPress={() => {}}
          >
            <View style={styles.bentoTileHeader}>
              <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(0, 193, 246, 0.12)' }]}>
                <MaterialCommunityIcons name="timer-outline" size={18} color="#00C1F6" />
              </View>
              <EqualizerRhythmBars color="#00C1F6" active={true} />
            </View>
            <Text style={styles.bentoTileValue}>{activeTrainingTimeFormatted}</Text>
            <Text style={styles.bentoTileSub}>Active training time</Text>
          </ClayPressable>

          {/* Calories Burned Card */}
          <ClayPressable
            variant="tile"
            style={styles.bentoTile}
            onPress={() => {}}
          >
            <View style={styles.bentoTileHeader}>
              <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(255, 122, 61, 0.12)' }]}>
                <MaterialCommunityIcons name="fire" size={18} color="#FF7A3D" />
              </View>
              <Text style={[styles.bentoTileCategory, { color: '#FF7A3D' }]}>Active</Text>
            </View>
            <Text style={styles.bentoTileValue}>{displayKcal} Kcal</Text>
            <Text style={styles.bentoTileSub}>Total burned output</Text>
          </ClayPressable>

          {/* Personal Records Card */}
          <ClayPressable
            variant="tile"
            style={styles.bentoTile}
            onPress={() => {}}
          >
            <View style={styles.bentoTileHeader}>
              <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(255, 152, 0, 0.12)' }]}>
                <MaterialCommunityIcons name="trophy" size={18} color="#FF9800" />
              </View>
              <Text style={[styles.bentoTileCategory, { color: '#FF9800' }]}>PRs</Text>
            </View>
            <Text style={styles.bentoTileValue}>{Object.keys(personalRecords).length}</Text>
            <Text style={styles.bentoTileSub}>Records broken</Text>
          </ClayPressable>
        </View>
        </AnimatedEntrance>

        {/* 6. Weekly Activity Histogram (Monday - Sunday from Image 4) */}
        <View style={styles.weeklyHistogramCard}>
          <View style={styles.histogramHeader}>
            <View>
              <Text style={styles.histogramEyebrow}>7-DAY CADENCE</Text>
              <Text style={styles.histogramTitle}>Weekly Activity</Text>
            </View>
            <View style={styles.bestPerfBadge}>
              <MaterialCommunityIcons name="star" size={14} color="#FF7A3D" />
              <Text style={styles.bestPerfText}>{peakDay ? `Best: ${peakDay.dayFull}` : 'No activity yet'}</Text>
            </View>
          </View>

          {/* Selected Day Telemetry Box */}
          <View style={styles.dayTelemetryBox}>
            <Text style={styles.dayTelemetryLabel}>
              {selectedDay.dayFull} Progress:
            </Text>
            <Text style={styles.dayTelemetryValue}>
              {selectedDay.steps.toLocaleString()} Steps • {(selectedDay.volume / 1000).toFixed(1)}k {displayUnit.toUpperCase()} Volume
            </Text>
          </View>

          {/* 7 Vertical Pill Bar Tracks */}
          <View style={styles.histogramBarsRow}>
            {weeklyActivityData.map((d, idx) => {
              const isSelected = selectedDayIdx === idx;
              const fillPercent = d.steps > 0 ? Math.min(Math.max((d.steps / dailyStepGoal) * 100, 8), 100) : 0;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.barColumn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDayIdx(idx);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${fillPercent}%` },
                        isSelected && styles.barFillSelected,
                        d.isPeak && styles.barFillPeak,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDayLabel, isSelected && styles.barDayLabelSelected]}>
                    {d.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 7. Volume Progression Chart Component */}
        <View style={styles.chartWrapper}>
          <ClayVolumeProgressionChart
            colors={colors}
            isDark={isDark}
            unit={displayUnit.toUpperCase()}
            data={volumeProgressionData}
            totalVolumeFormatted={totalVolumeFormatted}
          />
        </View>

        {/* 8. Muscle Distribution Radar Breakdown */}
        <View style={styles.chartWrapper}>
          <ClayMuscleDistributionRadar
            colors={colors}
            isDark={isDark}
            unit={displayUnit.toUpperCase()}
            groups={muscleGroupsData}
          />
        </View>

        {/* 9. Interactive 1RM Strength Calculator */}
        <View style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(99, 85, 230, 0.12)' }]}>
              <MaterialCommunityIcons name="calculator" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.toolTitle}>One-Rep Max (1RM) Estimator</Text>
              <Text style={styles.toolSubtitle}>Epley precision power algorithm</Text>
            </View>
          </View>

          <View style={styles.calcInputsRow}>
            <View style={styles.calcInputCol}>
              <Text style={styles.inputLabel}>LIFTED WEIGHT ({displayUnit.toUpperCase()})</Text>
              <TextInput
                style={styles.pillInput}
                keyboardType="numeric"
                value={calcWeight}
                onChangeText={(t) => setCalcWeight(t.replace(/[^0-9.]/g, ''))}
                placeholder="100"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={styles.calcInputCol}>
              <Text style={styles.inputLabel}>REPETITIONS ({calcReps})</Text>
              <View style={styles.repsStepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCalcReps((r) => Math.max(1, r - 1));
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={styles.repsCountText}>{calcReps}</Text>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCalcReps((r) => Math.min(20, r + 1));
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 1RM Result Display Pill */}
          <View style={styles.oneRmResultCard}>
            <Text style={styles.oneRmResultLabel}>ESTIMATED 1RM CEILING</Text>
            <Text style={styles.oneRmResultNumber}>
              {estimated1RM} {displayUnit.toUpperCase()}
            </Text>
            <View style={styles.percentageTiersRow}>
              {[
                { pct: '95%', val: Math.round(estimated1RM * 0.95) },
                { pct: '85%', val: Math.round(estimated1RM * 0.85) },
                { pct: '75%', val: Math.round(estimated1RM * 0.75) },
                { pct: '65%', val: Math.round(estimated1RM * 0.65) },
              ].map((tier) => (
                <View key={tier.pct} style={styles.tierPill}>
                  <Text style={styles.tierPctText}>{tier.pct}</Text>
                  <Text style={styles.tierValText}>{tier.val}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 10. Instant Weight Unit Converter Tool (KG ⇄ LBS) */}
        <View style={styles.toolCard}>
          <View style={styles.toolHeader}>
            <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(0, 193, 246, 0.12)' }]}>
              <MaterialCommunityIcons name="swap-horizontal-bold" size={20} color="#00C1F6" />
            </View>
            <View>
              <Text style={styles.toolTitle}>Weight Standard Converter</Text>
              <Text style={styles.toolSubtitle}>Instant bidirectional telemetry</Text>
            </View>
          </View>

          <View style={styles.converterInputsRow}>
            <View style={styles.converterInputCol}>
              <Text style={styles.inputLabel}>KILOGRAMS (KG)</Text>
              <TextInput
                style={styles.pillInput}
                keyboardType="numeric"
                value={converterKg}
                onChangeText={handleUpdateConverterKg}
                placeholder="100"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwapConverter} activeOpacity={0.75}>
              <MaterialCommunityIcons name="swap-horizontal" size={22} color={colors.accent} />
            </TouchableOpacity>

            <View style={styles.converterInputCol}>
              <Text style={styles.inputLabel}>POUNDS (LBS)</Text>
              <TextInput
                style={styles.pillInput}
                keyboardType="numeric"
                value={converterLbs}
                onChangeText={handleUpdateConverterLbs}
                placeholder="220.5"
                placeholderTextColor={colors.textDim}
              />
            </View>
          </View>

          {/* Quick Preset Chips */}
          <View style={styles.presetsRow}>
            {[20, 60, 100, 140, 180, 220].map((presetVal) => (
              <TouchableOpacity
                key={presetVal}
                style={styles.presetChip}
                onPress={() => handleSelectConverterPreset(presetVal, 'kg')}
                activeOpacity={0.7}
              >
                <Text style={styles.presetChipText}>{presetVal} kg</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Daily Step Goal Picker Bottom Sheet */}
      <BottomSheetModal
        visible={isGoalSheetVisible}
        onClose={() => setIsGoalSheetVisible(false)}
      >
        <View style={styles.goalSheetContent}>
          <View style={styles.goalSheetHeader}>
            <View style={styles.goalSheetIconCircle}>
              <MaterialCommunityIcons name="target" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalSheetTitle}>Daily Step Target</Text>
              <Text style={styles.goalSheetSubtitle}>Set your personalized cadence goal</Text>
            </View>
          </View>

          <View style={styles.goalSheetPresetsGrid}>
            {[5000, 7500, 10000, 12500, 15000, 20000].map((preset) => {
              const isSelected = dailyStepGoal === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.goalSheetChip, isSelected && styles.goalSheetChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateDailyStepGoal(preset);
                    setIsGoalSheetVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.goalSheetChipNumber, isSelected && styles.goalSheetChipNumberActive]}>
                    {(preset / 1000).toFixed(preset % 1000 === 0 ? 0 : 1)}k
                  </Text>
                  <Text style={[styles.goalSheetChipSub, isSelected && styles.goalSheetChipSubActive]}>
                    {preset.toLocaleString()} steps
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
    </Animated.View>
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
      paddingTop: Platform.OS === 'android' ? 14 : 6,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    greetingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    athleteAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceRaised,
    },
    avatarPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    greetingName: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    greetingSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    unitTogglePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 18,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    unitBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
    },
    unitBtnActive: {
      backgroundColor: colors.surface,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    unitBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
    },
    unitBtnTextActive: {
      color: colors.accent,
      fontWeight: '900',
    },
    timeframeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 16,
    },
    timeframeChip: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    timeframeChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      elevation: 3,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    timeframeChipText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    timeframeChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    heroRow: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    heroWalkCard: {
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: 26,
      padding: 18,
      justifyContent: 'space-between',
      minHeight: 220,
      elevation: 6,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.32,
      shadowRadius: 12,
    },
    heroWalkHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroWalkGoalPill: {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    heroWalkGoalText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    heroWalkTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    heroWalkIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringCenterContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 4,
    },
    ringStepsNumber: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.3,
    },
    ringStepsGoalText: {
      fontSize: 11,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 1,
    },
    ringStepsSubtitle: {
      fontSize: 10,
      fontWeight: '800',
      color: 'rgba(255, 255, 255, 0.70)',
      marginTop: 2,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroWalkFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.18)',
    },
    heroWalkStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    heroWalkStatInteractive: {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    goalSheetContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
    },
    goalSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 20,
    },
    goalSheetIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalSheetTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    goalSheetSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      marginTop: 2,
    },
    goalSheetPresetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'space-between',
    },
    goalSheetChip: {
      width: '31%',
      paddingVertical: 14,
      borderRadius: 18,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalSheetChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    goalSheetChipNumber: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    goalSheetChipNumberActive: {
      color: colors.accentContrastText,
    },
    goalSheetChipSub: {
      fontSize: 9.5,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: 2,
    },
    goalSheetChipSubActive: {
      color: colors.accentContrastText,
      opacity: 0.9,
    },
    heroWalkStatText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    bentoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    bentoTile: {
      width: (Dimensions.get('window').width - 44) / 2,
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    bentoTileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    bentoIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bentoTileCategory: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
    },
    bentoTileValue: {
      fontSize: 17,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    bentoTileSub: {
      fontSize: 11,
      color: colors.textMuted,
    },
    goalAchievedCard: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      padding: 18,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.30 : 0.06,
      shadowRadius: 8,
    },
    goalAchievedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    goalBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    goalAchievedEyebrow: {
      fontSize: 11,
      fontWeight: '900',
      color: '#00D084',
      letterSpacing: 0.8,
    },
    goalDateText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '700',
    },
    speedometerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
      marginBottom: 16,
    },
    speedometerIconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 208, 132, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    speedometerValue: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    speedometerUnit: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      marginTop: 2,
    },
    speedometerFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceBorder,
      marginTop: 8,
      marginBottom: 10,
    },
    speedometerStatCol: {
      alignItems: 'center',
    },
    speedometerStatLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 2,
    },
    speedometerStatValue: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    speedometerDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.surfaceBorder,
    },
    goalConfigWrapper: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    goalConfigLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textDim,
      letterSpacing: 0.8,
      textAlign: 'center',
      marginBottom: 8,
    },
    goalPresetsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    goalPresetChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    goalPresetChipActive: {
      backgroundColor: colors.emerald,
      borderColor: colors.emerald,
    },
    goalPresetChipText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
    },
    goalPresetChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    weeklyHistogramCard: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      padding: 18,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    histogramHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    histogramEyebrow: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 1,
      marginBottom: 2,
    },
    histogramTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    bestPerfBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 122, 61, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    bestPerfText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FF7A3D',
    },
    dayTelemetryBox: {
      backgroundColor: colors.surfaceRaised,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      marginBottom: 14,
    },
    dayTelemetryLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
    },
    dayTelemetryValue: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 2,
    },
    histogramBarsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 128,
      paddingTop: 10,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
      justifyContent: 'flex-end',
    },
    barTrack: {
      width: 22,
      flex: 1,
      borderRadius: 11,
      backgroundColor: colors.surfaceRaised,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    barFill: {
      width: '100%',
      borderRadius: 11,
      backgroundColor: isDark ? '#3E476A' : '#C8CFE6',
    },
    barFillSelected: {
      backgroundColor: colors.accent,
    },
    barFillPeak: {
      backgroundColor: '#FF7A3D',
    },
    barDayLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    barDayLabelSelected: {
      color: colors.accent,
      fontWeight: '900',
    },
    chartWrapper: {
      marginBottom: 16,
    },
    toolCard: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      padding: 18,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 6,
    },
    toolHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    toolTitle: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    toolSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    calcInputsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    calcInputCol: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    pillInput: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    repsStepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceRaised,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      paddingHorizontal: 6,
      height: 42,
    },
    stepperBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    repsCountText: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    oneRmResultCard: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: 18,
      padding: 14,
      alignItems: 'center',
    },
    oneRmResultLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.accent,
      letterSpacing: 1,
      marginBottom: 2,
    },
    oneRmResultNumber: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    percentageTiersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: 6,
    },
    tierPill: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingVertical: 6,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    tierPctText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.textMuted,
    },
    tierValText: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.textPrimary,
      marginTop: 2,
    },
    converterInputsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
    },
    converterInputCol: {
      flex: 1,
    },
    swapBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    presetsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    presetChipText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
    },
  });
