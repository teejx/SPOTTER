import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeColors } from '../theme/colors';

interface VolumeDataPoint {
  day: string;
  volume: number;
  label: string;
  isPeak?: boolean;
}

interface ClayVolumeProgressionChartProps {
  colors: ThemeColors;
  isDark: boolean;
  unit: string;
  data: VolumeDataPoint[];
  totalVolumeFormatted: string;
  deltaPercent?: number;
}

export const ClayVolumeProgressionChart: React.FC<ClayVolumeProgressionChartProps> = ({
  colors,
  isDark,
  unit,
  data,
  totalVolumeFormatted,
  deltaPercent = 12.4,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(data.length - 1);
  const [timeframe, setTimeframe] = useState<'7D' | '30D'>('7D');

  const maxVolume = useMemo(() => {
    const max = Math.max(...data.map((d) => d.volume), 1);
    return max;
  }, [data]);

  const selectedPoint = data[selectedIdx] || data[data.length - 1];

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      {/* Header with Timeframe Tabs */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardEyebrow}>TRAINING TONNAGE</Text>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Volume Progression
          </Text>
        </View>

        <View style={[styles.timeframeRow, isDark ? styles.timeframeRowDark : styles.timeframeRowLight]}>
          {(['7D', '30D'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeframeBtn,
                timeframe === t && (isDark ? styles.timeframeBtnActiveDark : styles.timeframeBtnActiveLight),
              ]}
              onPress={() => {
                setTimeframe(t);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === t && { color: colors.accent, fontWeight: '900' },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Metric & Delta Pill */}
      <View style={styles.metricRow}>
        <View style={styles.metricBigWrap}>
          <Text style={[styles.metricBigNumber, { color: colors.textPrimary }]}>
            {totalVolumeFormatted}k
          </Text>
          <Text style={styles.metricUnit}>{unit.toUpperCase()}</Text>
        </View>

        <View style={styles.deltaPill}>
          <MaterialCommunityIcons name="arrow-top-right" size={14} color="#10B981" />
          <Text style={styles.deltaPillText}>{parseFloat(totalVolumeFormatted) > 0 ? `+${deltaPercent}% vs prior cycle` : 'Current week telemetry'}</Text>
        </View>
      </View>

      {/* Interactive Tooltip Card */}
      {selectedPoint && (
        <View style={[styles.tooltipCard, isDark ? styles.tooltipCardDark : styles.tooltipCardLight]}>
          <View style={styles.tooltipDot} />
          <Text style={styles.tooltipLabel}>{selectedPoint.label}:</Text>
          <Text style={[styles.tooltipValue, { color: colors.accent }]}>
            {selectedPoint.volume.toLocaleString()} {unit}
          </Text>
        </View>
      )}

      {/* Clay Bar Columns */}
      <View style={styles.barsContainer}>
        {data.map((item, idx) => {
          const isZero = item.volume <= 0;
          const heightPercent = isZero ? 0 : Math.max(10, Math.round((item.volume / maxVolume) * 100));
          const isSelected = selectedIdx === idx;
          const isPeak = !isZero && (item.isPeak || (maxVolume > 0 && item.volume === maxVolume));

          return (
            <TouchableOpacity
              key={idx}
              style={styles.barColumn}
              onPress={() => {
                setSelectedIdx(idx);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.barTrack, isDark ? styles.barTrackDark : styles.barTrackLight]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: isSelected
                        ? colors.accent
                        : isPeak
                        ? '#F97316'
                        : isDark
                        ? '#2E3347'
                        : '#CBD5E1',
                    },
                    isSelected && styles.barFillSelected,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dayLabel,
                  isSelected && { color: colors.accent, fontWeight: '900' },
                ]}
              >
                {item.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface MuscleGroupProgressItem {
  name: string;
  volume: number;
  percent: number;
  status: 'OPTIMAL' | 'RECOVERING' | 'FRESH';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface ClayMuscleDistributionProps {
  colors: ThemeColors;
  isDark: boolean;
  unit: string;
  groups: MuscleGroupProgressItem[];
}

export const ClayMuscleDistributionRadar: React.FC<ClayMuscleDistributionProps> = ({
  colors,
  isDark,
  unit,
  groups,
}) => {
  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardEyebrow}>HYPERTROPHY BALANCING</Text>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Muscle Group Load
          </Text>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>7 TARGETS</Text>
        </View>
      </View>

      <View style={styles.groupList}>
        {groups.map((group) => {
          const statusColor =
            group.status === 'OPTIMAL'
              ? '#10B981'
              : group.status === 'RECOVERING'
              ? '#F59E0B'
              : '#38BDF8';

          return (
            <View key={group.name} style={styles.groupRow}>
              <View style={styles.groupInfoRow}>
                <View style={styles.groupIconName}>
                  <MaterialCommunityIcons
                    name={group.icon}
                    size={16}
                    color={colors.textPrimary}
                  />
                  <Text style={[styles.groupName, { color: colors.textPrimary }]}>
                    {group.name}
                  </Text>
                </View>

                <View style={styles.groupStatusRow}>
                  <Text style={styles.groupVolume}>
                    {(group.volume / 1000).toFixed(1)}k {unit} ({group.percent}%)
                  </Text>
                  <View style={[styles.statusChip, { borderColor: statusColor }]}>
                    <Text style={[styles.statusChipText, { color: statusColor }]}>
                      {group.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Clay Progress Track */}
              <View style={[styles.progressTrack, isDark ? styles.progressTrackDark : styles.progressTrackLight]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: group.percent > 0 ? `${Math.min(100, Math.max(8, group.percent))}%` : '0%',
                      backgroundColor: group.percent > 25 ? colors.accent : isDark ? '#3D445D' : '#94A3B8',
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

interface StepTelemetryProps {
  colors: ThemeColors;
  isDark: boolean;
  totalSteps: number;
  totalKm: number;
  totalKcal: number;
  dailyGoal?: number;
  weeklySteps: number[];
}

export const ClayStepTelemetryDial: React.FC<StepTelemetryProps> = ({
  colors,
  isDark,
  totalSteps,
  totalKm,
  totalKcal,
  dailyGoal = 10000,
  weeklySteps,
}) => {
  const goalPercent = Math.min(100, Math.round((totalSteps / dailyGoal) * 100));
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardEyebrow}>DAILY MOVEMENT</Text>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Step Telemetry & Output
          </Text>
        </View>
        <MaterialCommunityIcons name="walk" size={24} color="#10B981" />
      </View>

      {/* Main Gauge / Dial Center */}
      <View style={styles.stepDialContainer}>
        <View style={[styles.stepDialOuter, isDark ? styles.stepDialOuterDark : styles.stepDialOuterLight]}>
          <Text style={[styles.stepNumber, { color: colors.textPrimary }]}>
            {totalSteps.toLocaleString()}
          </Text>
          <Text style={styles.stepGoalSubtitle}>
            GOAL: {dailyGoal.toLocaleString()} • {goalPercent}%
          </Text>
        </View>
      </View>

      {/* 3 Metric Pills */}
      <View style={styles.stepPillGrid}>
        <View style={[styles.statPill, isDark ? styles.statPillDark : styles.statPillLight]}>
          <MaterialCommunityIcons name="map-marker-distance" size={16} color="#38BDF8" />
          <Text style={[styles.statPillVal, { color: colors.textPrimary }]}>
            {totalKm.toFixed(1)} km
          </Text>
          <Text style={styles.statPillLbl}>DISTANCE</Text>
        </View>

        <View style={[styles.statPill, isDark ? styles.statPillDark : styles.statPillLight]}>
          <MaterialCommunityIcons name="fire" size={16} color="#F97316" />
          <Text style={[styles.statPillVal, { color: colors.textPrimary }]}>
            {totalKcal} kcal
          </Text>
          <Text style={styles.statPillLbl}>ENERGY</Text>
        </View>

        <View style={[styles.statPill, isDark ? styles.statPillDark : styles.statPillLight]}>
          <MaterialCommunityIcons name="speedometer" size={16} color="#A855F7" />
          <Text style={[styles.statPillVal, { color: colors.textPrimary }]}>
            {goalPercent}%
          </Text>
          <Text style={styles.statPillLbl}>TARGET</Text>
        </View>
      </View>

      {/* Weekly Step Mini Histogram */}
      <View style={styles.weeklyHistogramContainer}>
        <Text style={styles.miniHeader}>7-DAY CADENCE</Text>
        <View style={styles.histogramRow}>
          {weeklySteps.map((steps, i) => {
            const h = Math.min(100, Math.max(15, Math.round((steps / dailyGoal) * 100)));
            const reached = steps >= dailyGoal;
            return (
              <View key={i} style={styles.histogramCol}>
                <View style={[styles.histogramTrack, isDark ? styles.barTrackDark : styles.barTrackLight]}>
                  <View
                    style={[
                      styles.histogramBar,
                      {
                        height: `${h}%`,
                        backgroundColor: reached ? '#10B981' : isDark ? '#333A4E' : '#94A3B8',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histogramDay}>{days[i]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16,
  },
  cardDark: {
    backgroundColor: '#152031',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#111C2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#6355E6',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  timeframeRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
  },
  timeframeRowDark: {
    backgroundColor: '#101326',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeframeRowLight: {
    backgroundColor: '#F0F2FA',
    borderColor: 'rgba(17, 28, 45, 0.08)',
  },
  timeframeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  timeframeBtnActiveDark: {
    backgroundColor: '#1F2A3C',
  },
  timeframeBtnActiveLight: {
    backgroundColor: '#FFFFFF',
  },
  timeframeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricBigWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metricBigNumber: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94A3B8',
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  deltaPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  tooltipCardDark: {
    backgroundColor: '#1F2A3C',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tooltipCardLight: {
    backgroundColor: '#F0F3FF',
    borderColor: 'rgba(17, 28, 45, 0.08)',
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6355E6',
  },
  tooltipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B947D',
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
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
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barTrackDark: {
    backgroundColor: '#040E1F',
  },
  barTrackLight: {
    backgroundColor: '#E7EEFF',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  barFillSelected: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  badgePill: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#818CF8',
  },
  groupList: {
    gap: 12,
  },
  groupRow: {
    gap: 6,
  },
  groupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupIconName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 13,
    fontWeight: '800',
  },
  groupStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupVolume: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  statusChipText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressTrackDark: {
    backgroundColor: '#0F1118',
  },
  progressTrackLight: {
    backgroundColor: '#F1F5F9',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  stepDialContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  stepDialOuter: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
  },
  stepDialOuterDark: {
    backgroundColor: '#10121A',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  stepDialOuterLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -0.5,
  },
  stepGoalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  stepPillGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 4,
  },
  statPillDark: {
    backgroundColor: '#10121A',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statPillLight: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  statPillVal: {
    fontSize: 13,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statPillLbl: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#94A3B8',
  },
  weeklyHistogramContainer: {
    marginTop: 6,
  },
  miniHeader: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#94A3B8',
    marginBottom: 8,
  },
  histogramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 70,
  },
  histogramCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  histogramTrack: {
    width: 14,
    flex: 1,
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  histogramBar: {
    width: '100%',
    borderRadius: 7,
  },
  histogramDay: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
});
